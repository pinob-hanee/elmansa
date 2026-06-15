import { PrismaClient, SubmissionStatus } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Piston API Configuration
const PISTON_LANGUAGES: Record<string, { language: string; version: string }> = {
  python: { language: 'python', version: '3.10.0' },
  javascript: { language: 'javascript', version: '18.15.0' },
  cpp: { language: 'c++', version: '10.2.0' },
  java: { language: 'java', version: '15.0.2' },
  c: { language: 'c', version: '10.2.0' },
};

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

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
    const langConfig = PISTON_LANGUAGES[language];
    if (!langConfig) throw new Error(`Unsupported language: ${language}`);

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

    // Run all test cases against Piston (async)
    this.runTests(submission.id, code, langConfig, testCases, problem.timeLimit, problem.memoryLimit).catch(
      (err) => console.error('Execution error:', err)
    );

    return { submissionId: submission.id, status: 'PENDING' };
  }

  private async runTests(
    submissionId: string,
    code: string,
    langConfig: { language: string; version: string },
    testCases: TestCase[],
    timeLimit: number,
    memoryLimit: number
  ) {
    let testsPassed = 0;
    let finalStatus: SubmissionStatus = 'ACCEPTED';
    let lastOutput = '';
    let errorMsg = '';
    let totalRuntime = 0;

    for (const tc of testCases) {
      try {
        const result = await this.executeOnPiston(code, langConfig, tc.input, timeLimit, memoryLimit);

        const stdout = (result.run.stdout || '').trim();
        const expected = tc.expectedOutput.trim();
        const passed = stdout === expected;

        if (passed) {
          testsPassed++;
        } else if (finalStatus === 'ACCEPTED') {
          // Check for compile/runtime errors
          if (result.compile && result.compile.code !== 0) {
            finalStatus = 'COMPILE_ERROR';
            errorMsg = result.compile.stderr || result.compile.output || '';
          } else if (result.run.code !== 0) {
            if (result.run.signal === 'SIGKILL' || result.run.output.includes('Timeout')) {
              finalStatus = 'TIME_LIMIT_EXCEEDED';
            } else {
              finalStatus = 'RUNTIME_ERROR';
            }
            errorMsg = result.run.stderr || result.run.output || '';
          } else {
            finalStatus = 'WRONG_ANSWER';
            lastOutput = stdout;
          }
        }
        
        totalRuntime += 50; // Piston API doesn't return exact execution time easily, so we estimate/mock
      } catch (err: any) {
        console.error('Piston execution error:', err.response?.data || err.message);
        finalStatus = 'RUNTIME_ERROR';
        errorMsg = 'Execution failed: ' + (err.response?.data?.message || err.message);
      }
    }

    await prisma.codingSubmission.update({
      where: { id: submissionId },
      data: {
        status: finalStatus,
        testsPassed,
        output: lastOutput,
        errorMsg: errorMsg || null,
        runtimeMs: Math.round(totalRuntime / testCases.length),
      },
    });
  }

  private async executeOnPiston(
    code: string,
    langConfig: { language: string; version: string },
    stdin: string,
    timeLimit: number,
    memoryLimit: number
  ) {
    const payload = {
      language: langConfig.language,
      version: langConfig.version,
      files: [
        {
          name: `main.${langConfig.language === 'python' ? 'py' : langConfig.language === 'javascript' ? 'js' : langConfig.language === 'java' ? 'java' : langConfig.language === 'c++' ? 'cpp' : 'c'}`,
          content: code,
        }
      ],
      stdin: stdin || '',
      compile_timeout: 10000,
      run_timeout: timeLimit * 1000,
      compile_memory_limit: -1,
      run_memory_limit: memoryLimit * 1024 * 1024,
    };

    const { data } = await axios.post(PISTON_API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: (timeLimit + 5) * 1000,
    });

    return data;
  }

  async getSubmission(submissionId: string, userId: string) {
    return prisma.codingSubmission.findFirst({
      where: { id: submissionId, userId },
    });
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
        createdAt: true,
      },
    });
  }
}
