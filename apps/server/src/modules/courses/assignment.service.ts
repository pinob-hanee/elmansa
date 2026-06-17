import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export class AssignmentService {
  async upsertAssignment(lessonId: string, data: { title: string; description: string; maxScore?: number; passingScore?: number; checklist?: any; isFinalAssessment?: boolean }) {
    const { isFinalAssessment, ...assignmentData } = data;
    
    // Update lesson
    if (typeof isFinalAssessment === 'boolean') {
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { isFinalAssessment }
      });
    }

    return prisma.assignment.upsert({
      where: { lessonId },
      create: { ...assignmentData, lessonId },
      update: assignmentData,
    });
  }

  async getAssignmentByLesson(lessonId: string) {
    return prisma.assignment.findUnique({
      where: { lessonId },
      include: {
        lesson: { select: { isFinalAssessment: true } }
      }
    });
  }

  async submitAssignment(assignmentId: string, userId: string, data: { repoUrl?: string; liveUrl?: string; fileKey?: string; notes?: string }) {
    return prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        userId,
        ...data,
        status: 'PENDING',
      },
    });
  }

  async getStudentSubmissions(userId: string) {
    return prisma.assignmentSubmission.findMany({
      where: { userId },
      include: {
        assignment: { select: { title: true, maxScore: true, passingScore: true, lessonId: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssignmentSubmissions(assignmentId: string) {
    return prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        user: { select: { id: true, email: true, profile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllSubmissions() {
    return prisma.assignmentSubmission.findMany({
      include: {
        user: { select: { id: true, email: true, profile: true } },
        assignment: { select: { title: true, maxScore: true, passingScore: true, lessonId: true, lesson: { select: { chapter: { select: { module: { select: { course: { select: { title: true } } } } } } } } } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async gradeSubmission(submissionId: string, reviewerId: string, data: { score: number; status: 'GRADED' | 'REJECTED'; feedback: string; checklistScores: any }) {
    const submission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        ...data,
        reviewerId,
      },
      include: {
        assignment: { include: { lesson: true } }
      }
    });

    // If graded and passed, update lesson progress
    if (data.status === 'GRADED' && data.score >= submission.assignment.passingScore) {
      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId: submission.userId, lessonId: submission.assignment.lessonId } },
        create: {
          userId: submission.userId,
          lessonId: submission.assignment.lessonId,
          isCompleted: true,
          completedAt: new Date(),
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
        }
      });
    }

    return submission;
  }
}
