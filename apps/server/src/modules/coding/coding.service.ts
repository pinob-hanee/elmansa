import { PrismaClient, SubmissionStatus } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Judge0 language IDs
const LANGUAGE_IDS: Record<string, number> = {
  python: 71,      // Python 3
  javascript: 63,  // Node.js
  cpp: 54,         // C++ (GCC 9.2.0)
  java: 62,        // Java (OpenJDK 13)
  c: 50,           // C (GCC 9.2.0)
};

// Judge0 base URL - can be self-hosted or use public instance
const JUDGE0_URL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface StarterCode {
  python?: string;
  javascript?: string;
  cpp?: string;
  java?: string;
  c?: string;
}

export class CodingService {
  // ── Problems ──────────────────────────────────────────────────────────
  async getProblems(filters: {
    courseId?: string;
    difficulty?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { courseId, difficulty, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { isPublished: true };
    if (courseId) where.courseId = courseId;
    if (difficulty) where.difficulty = difficulty;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { titleAr: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const [problems, total] = await Promise.all([
      prisma.codingProblem.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          titleAr: true,
          difficulty: true,
          tags: true,
          languages: true,
          courseId: true,
          createdAt: true,
          _count: { select: { submissions: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.codingProblem.count({ where }),
    ]);

    return {
      data: problems,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getProblemById(id: string, userId?: string) {
    const problem = await prisma.codingProblem.findUnique({
      where: { id },
      include: {
        course: { select: { title: true, titleAr: true } },
      },
    });
    if (!problem) throw new Error('Problem not found');

    // Strip hidden test cases for students
    const testCases = (problem.testCases as unknown as TestCase[]).map((tc) => ({
      ...tc,
      expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
    }));

    // Fetch user's best submission for this problem
    let bestSubmission = null;
    if (userId) {
      bestSubmission = await prisma.codingSubmission.findFirst({
        where: { problemId: id, userId, status: 'ACCEPTED' },
        orderBy: { createdAt: 'desc' },
        select: { status: true, runtimeMs: true, testsPassed: true, testsTotal: true },
      });
    }

    return { ...problem, testCases, bestSubmission };
  }

  async getAdminProblems(filters: { courseId?: string; search?: string }) {
    const where: any = {};
    if (filters.courseId) where.courseId = filters.courseId;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.codingProblem.findMany({
      where,
      include: { _count: { select: { submissions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProblem(data: any) {
    return prisma.codingProblem.create({ data });
  }

  async updateProblem(id: string, data: any) {
    return prisma.codingProblem.update({ where: { id }, data });
  }

  async deleteProblem(id: string) {
    return prisma.codingProblem.delete({ where: { id } });
  }

  // ── Submission ─────────────────────────────────────────────────────────
  async submitCode(problemId: string, userId: string, code: string, language: string) {
    const problem = await prisma.codingProblem.findUnique({ where: { id: problemId } });
    if (!problem) throw new Error('Problem not found');

    const testCases = problem.testCases as unknown as TestCase[];
    const langId = LANGUAGE_IDS[language];
    if (!langId) throw new Error(`Unsupported language: ${language}`);

    // Create a pending submission first
    const submission = await prisma.codingSubmission.create({
      data: {
        problemId,
        userId,
        code,
        language,
        status: 'PENDING',
        testsTotal: testCases.length,
      },
    });

    // Run all test cases against Judge0 (async)
    this.runJudge0Tests(submission.id, code, langId, testCases, problem.timeLimit, problem.memoryLimit).catch(
      (err) => console.error('Judge0 error:', err)
    );

    return { submissionId: submission.id, status: 'PENDING' };
  }

  private async runJudge0Tests(
    submissionId: string,
    code: string,
    languageId: number,
    testCases: TestCase[],
    timeLimit: number,
    memoryLimit: number
  ) {
    let testsPassed = 0;
    let finalStatus: SubmissionStatus = 'ACCEPTED';
    let errorMsg = '';
    let totalRuntime = 0;

    // Collect per-test-case results for rich UI display
    const testResults: Array<{
      passed: boolean;
      input: string | null;
      expected: string | null;
      output: string;
      error?: string;
    }> = [];

    for (const tc of testCases) {
      try {
        const result = await this.executeOnJudge0(code, languageId, tc.input, timeLimit, memoryLimit);

        const stdout = (result.stdout || '').trim();
        const expected = tc.expectedOutput.trim();
        const passed = stdout === expected;

        if (passed) {
          testsPassed++;
        } else if (finalStatus === 'ACCEPTED') {
          // Capture the first failure
          if (result.status?.id === 5) {
            finalStatus = 'TIME_LIMIT_EXCEEDED';
          } else if (result.status?.id === 6) {
            finalStatus = 'COMPILE_ERROR';
            errorMsg = result.compile_output || '';
          } else if (result.status?.id >= 7) {
            finalStatus = 'RUNTIME_ERROR';
            errorMsg = result.stderr || '';
          } else {
            finalStatus = 'WRONG_ANSWER';
          }
        }

        if (result.time) totalRuntime += parseFloat(result.time) * 1000;

        testResults.push({
          passed,
          // Only show input/expected for non-hidden test cases
          input: tc.isHidden ? null : tc.input,
          expected: tc.isHidden ? null : tc.expectedOutput,
          output: stdout,
          error: result.stderr || result.compile_output || undefined,
        });
      } catch (err: any) {
        console.error('Judge0 error:', err.response?.data || err.message);
        finalStatus = 'RUNTIME_ERROR';
        if (err.response?.status === 422) {
          errorMsg = '422 Validation Error: ' + JSON.stringify(err.response.data);
        } else {
          errorMsg = 'Execution failed: ' + (err.response?.data?.error || err.message);
        }
        testResults.push({
          passed: false,
          input: tc.isHidden ? null : tc.input,
          expected: tc.isHidden ? null : tc.expectedOutput,
          output: '',
          error: errorMsg,
        });
      }
    }

    await prisma.codingSubmission.update({
      where: { id: submissionId },
      data: {
        status: finalStatus,
        testsPassed,
        // Store detailed per-test-case results as JSON
        output: JSON.stringify(testResults),
        errorMsg: errorMsg || null,
        runtimeMs: testCases.length > 0 ? Math.round(totalRuntime / testCases.length) : 0,
      },
    });
  }

  private async executeOnJudge0(
    code: string,
    languageId: number,
    stdin: string,
    timeLimit: number,
    memoryLimit: number
  ) {
    const isRapidApi = JUDGE0_API_KEY && JUDGE0_URL.includes('rapidapi');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Bypass Ngrok's free tier browser warning screen
    if (JUDGE0_URL.includes('ngrok')) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }

    if (isRapidApi) {
      headers['X-RapidAPI-Key'] = JUDGE0_API_KEY;
      headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
    }

    const payload = {
      source_code: code,
      language_id: languageId,
      stdin: stdin,
      // RapidAPI Judge0 CE caps: cpu_time_limit <= 20s, memory_limit <= 256000 KB
      cpu_time_limit: Math.min(timeLimit, 20),
      memory_limit: Math.min(memoryLimit * 1024, 256000),
    };

    // Submit
    const { data: submission } = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      payload,
      { headers, timeout: (timeLimit + 5) * 1000 }
    );

    return submission;
  }

  async getSubmission(submissionId: string, userId: string) {
    return prisma.codingSubmission.findFirst({
      where: { id: submissionId, userId },
    });
  }

  // Run code against visible test cases only — returns result immediately, no DB record
  async runCode(problemId: string, code: string, language: string) {
    const problem = await prisma.codingProblem.findUnique({ where: { id: problemId } });
    if (!problem) throw new Error('Problem not found');

    const allTestCases = problem.testCases as unknown as TestCase[];
    const visibleCases = allTestCases.filter(tc => !tc.isHidden);

    const langId = LANGUAGE_IDS[language];
    if (!langId) throw new Error(`Unsupported language: ${language}`);

    const testResults: Array<{
      passed: boolean;
      input: string;
      expected: string;
      output: string;
      error?: string;
    }> = [];

    for (const tc of visibleCases) {
      try {
        const result = await this.executeOnJudge0(code, langId, tc.input, problem.timeLimit, problem.memoryLimit);
        const stdout = (result.stdout || '').trim();
        const passed = stdout === tc.expectedOutput.trim();
        testResults.push({
          passed,
          input: tc.input,
          expected: tc.expectedOutput,
          output: stdout,
          error: result.stderr || result.compile_output || undefined,
        });
      } catch (err: any) {
        testResults.push({
          passed: false,
          input: tc.input,
          expected: tc.expectedOutput,
          output: '',
          error: err.response?.data?.error || err.message,
        });
      }
    }

    return {
      testsPassed: testResults.filter(r => r.passed).length,
      testsTotal: visibleCases.length,
      testResults,
      isRun: true, // flag so frontend can label it differently
    };
  }

  async getMySubmissions(problemId: string, userId: string) {
    return prisma.codingSubmission.findMany({
      where: { problemId, userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        language: true,
        testsPassed: true,
        testsTotal: true,
        runtimeMs: true,
        code: true,
        createdAt: true,
      },
    });
  }
}
