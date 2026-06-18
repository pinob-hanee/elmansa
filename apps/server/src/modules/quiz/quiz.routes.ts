import { Router } from 'express';
import { authenticate, requireRole } from '../../api/middlewares/auth.middleware';
import { prisma } from '../../config/database';
import { successResponse } from '../../utils/response';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

const router = Router();

// Get quiz by lesson
router.get('/lesson', authenticate, async (req, res, next) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: req.query.lessonId as string },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    if (!quiz) {
      return successResponse(res, null); // Return null if no quiz exists yet
    }

    // Ensure chapter deadline starts
    const lesson = await prisma.lesson.findUnique({ where: { id: req.query.lessonId as string } });
    if (lesson && req.user?.userId) {
      const existingDeadline = await prisma.studentChapterDeadline.findUnique({
        where: { userId_chapterId: { userId: req.user.userId, chapterId: lesson.chapterId } }
      });
      if (!existingDeadline) {
        await prisma.studentChapterDeadline.create({
          data: {
            userId: req.user.userId,
            chapterId: lesson.chapterId,
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          }
        });
      }
    }

    successResponse(res, quiz);
  } catch (e) { next(e); }
});

router.get('/lesson/:id', authenticate, async (req, res, next) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: req.params.id },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    if (!quiz) {
      return successResponse(res, null);
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id } });
    if (lesson && req.user?.userId) {
      const existingDeadline = await prisma.studentChapterDeadline.findUnique({
        where: { userId_chapterId: { userId: req.user.userId, chapterId: lesson.chapterId } }
      });
      if (!existingDeadline) {
        await prisma.studentChapterDeadline.create({
          data: {
            userId: req.user.userId,
            chapterId: lesson.chapterId,
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          }
        });
      }
    }

    successResponse(res, quiz);
  } catch (e) { next(e); }
});

// Upsert quiz by lesson (Admin/Teacher)
router.put('/lesson', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { lessonId, title, description, passingScore, timeLimitMin, questions } = req.body;
    
    // Use an interactive transaction to safely wipe old questions and insert new ones
    const quiz = await prisma.$transaction(async (tx) => {
      // 1. Find or create the base quiz
      let quizRecord = await tx.quiz.findUnique({ where: { lessonId } });
      
      if (!quizRecord) {
        quizRecord = await tx.quiz.create({
          data: {
            lessonId,
            title: title || 'اختبار',
            description,
            passingScore: passingScore ?? 70,
            timeLimitMin,
            isPublished: true,
          }
        });
      } else {
        quizRecord = await tx.quiz.update({
          where: { id: quizRecord.id },
          data: {
            title: title || quizRecord.title,
            description,
            passingScore: passingScore ?? quizRecord.passingScore,
            timeLimitMin,
          }
        });
        
        // 2. Wipe old questions
        await tx.quizQuestion.deleteMany({ where: { quizId: quizRecord.id } });
      }

      // 3. Insert new questions
      if (questions && Array.isArray(questions)) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          await tx.quizQuestion.create({
            data: {
              quizId: quizRecord.id,
              question: q.question,
              type: q.type || 'MULTIPLE_CHOICE',
              points: q.points || 1,
              sortOrder: i,
              options: {
                create: (q.options || []).map((opt: any, optIdx: number) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect || false,
                  sortOrder: optIdx,
                }))
              }
            }
          });
        }
      }

      return tx.quiz.findUnique({
        where: { id: quizRecord.id },
        include: { questions: { include: { options: true } } },
      });
    });

    successResponse(res, quiz, 'Quiz saved successfully', 200);
  } catch (e) { next(e); }
});

router.put('/lesson/:id', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const lessonId = req.params.id;
    const { title, description, passingScore, timeLimitMin, questions } = req.body;
    
    const quiz = await prisma.$transaction(async (tx) => {
      let quizRecord = await tx.quiz.findUnique({ where: { lessonId } });
      
      if (!quizRecord) {
        quizRecord = await tx.quiz.create({
          data: {
            lessonId,
            title: title || 'اختبار',
            description,
            passingScore: passingScore ?? 70,
            timeLimitMin,
            isPublished: true,
          }
        });
      } else {
        quizRecord = await tx.quiz.update({
          where: { id: quizRecord.id },
          data: {
            title: title || quizRecord.title,
            description,
            passingScore: passingScore ?? quizRecord.passingScore,
            timeLimitMin,
          }
        });
        await tx.quizQuestion.deleteMany({ where: { quizId: quizRecord.id } });
      }

      if (questions && Array.isArray(questions)) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          await tx.quizQuestion.create({
            data: {
              quizId: quizRecord.id,
              question: q.question,
              type: q.type || 'MULTIPLE_CHOICE',
              points: q.points || 1,
              sortOrder: i,
              options: {
                create: (q.options || []).map((opt: any, optIdx: number) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect || false,
                  sortOrder: optIdx,
                }))
              }
            }
          });
        }
      }

      return tx.quiz.findUnique({
        where: { id: quizRecord.id },
        include: { questions: { include: { options: true } } },
      });
    });

    successResponse(res, quiz, 'Quiz saved successfully', 200);
  } catch (e) { next(e); }
});

// Submit quiz attempt
router.post('/attempt', authenticate, async (req, res, next) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.body.quizId },
      include: { questions: { include: { options: true } } },
    });
    if (!quiz) throw new NotFoundError('Quiz not found');

    const { answers } = req.body as {
      answers: Array<{ questionId: string; optionIds?: string[]; answer?: string }>;
    };

    let totalScore = 0;
    let maxScore = 0;
    const answerRecords: any[] = [];

    for (const q of quiz.questions) {
      maxScore += q.points;
      const userAnswer = answers.find((a) => a.questionId === q.id);
      let isCorrect = false;
      let pointsEarned = 0;

      if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
        const correctOptionIds = q.options
          .filter((o) => o.isCorrect)
          .map((o) => o.id)
          .sort();
        const userOptionIds = (userAnswer?.optionIds || []).sort();
        isCorrect = JSON.stringify(correctOptionIds) === JSON.stringify(userOptionIds);
        pointsEarned = isCorrect ? q.points : 0;
        totalScore += pointsEarned;
      }

      answerRecords.push({
        questionId: q.id,
        optionIds: userAnswer?.optionIds || [],
        answer: userAnswer?.answer,
        isCorrect,
        pointsEarned,
      });
    }

    const scorePercent = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const isPassed = scorePercent >= quiz.passingScore;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: req.user!.userId,
        score: scorePercent,
        maxScore,
        isPassed,
        submittedAt: new Date(),
        answers: { create: answerRecords },
      },
      include: { answers: true },
    });

    // Award XP if passed (and hasn't passed before)
    let xpEarned = 0;
    let newBadges: string[] = [];
    if (isPassed) {
      const previousPass = await prisma.quizAttempt.findFirst({
        where: {
          quizId: quiz.id,
          userId: req.user!.userId,
          isPassed: true,
          id: { not: attempt.id }, // exclude the one we just created
        }
      });

      if (!previousPass) {
        try {
          const { GamificationService } = await import('../gamification/gamification.service');
          const gamSvc = new GamificationService();
          const gResult = await gamSvc.awardXpWithAchievements(req.user!.userId, 50, 'QUIZ_PASS');
          xpEarned = 50;
          newBadges = gResult?.newBadges || [];
        } catch (err) {
          console.error('Failed to award XP for quiz pass:', err);
        }
      }
    }

    successResponse(res, { attempt, score: scorePercent, isPassed, xpEarned, newBadges }, 'Quiz submitted', 201);
router.post('/:id/attempt', authenticate, async (req, res, next) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: { questions: { include: { options: true } } },
    });
    if (!quiz) throw new NotFoundError('Quiz not found');

    const { answers } = req.body as {
      answers: Array<{ questionId: string; optionIds?: string[]; answer?: string }>;
    };

    let totalScore = 0;
    let maxScore = 0;
    const answerRecords: any[] = [];

    for (const q of quiz.questions) {
      maxScore += q.points;
      const userAnswer = answers.find((a) => a.questionId === q.id);
      let isCorrect = false;
      let pointsEarned = 0;

      if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
        const correctOptionIds = q.options
          .filter((o) => o.isCorrect)
          .map((o) => o.id)
          .sort();
        const userOptionIds = (userAnswer?.optionIds || []).sort();
        isCorrect = JSON.stringify(correctOptionIds) === JSON.stringify(userOptionIds);
        pointsEarned = isCorrect ? q.points : 0;
        totalScore += pointsEarned;
      }

      answerRecords.push({
        questionId: q.id,
        optionIds: userAnswer?.optionIds || [],
        answer: userAnswer?.answer,
        isCorrect,
        pointsEarned,
      });
    }

    const scorePercent = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const isPassed = scorePercent >= quiz.passingScore;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: req.user!.userId,
        score: scorePercent,
        maxScore,
        isPassed,
        submittedAt: new Date(),
        answers: { create: answerRecords },
      },
      include: { answers: true },
    });

    let xpEarned = 0;
    let newBadges: string[] = [];
    if (isPassed) {
      const previousPass = await prisma.quizAttempt.findFirst({
        where: {
          quizId: quiz.id,
          userId: req.user!.userId,
          isPassed: true,
          id: { not: attempt.id },
        }
      });

      if (!previousPass) {
        try {
          const { GamificationService } = await import('../gamification/gamification.service');
          const gamSvc = new GamificationService();
          const gResult = await gamSvc.awardXpWithAchievements(req.user!.userId, 50, 'QUIZ_PASS');
          xpEarned = 50;
          newBadges = gResult?.newBadges || [];
        } catch (err) {
          console.error('Failed to award XP for quiz pass:', err);
        }
      }
    }

    successResponse(res, { attempt, score: scorePercent, isPassed, xpEarned, newBadges }, 'Quiz submitted', 201);
  } catch (e) { next(e); }
});

export default router;
