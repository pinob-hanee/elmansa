import { Router } from 'express';
import { authenticate, requireRole } from '../../api/middlewares/auth.middleware';
import { successResponse } from '../../utils/response';
import { prisma } from '../../config/db';
import { BadRequestError } from '../../utils/errors';

const router = Router();

router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'TEACHER', 'MODERATOR'));

router.post('/send', async (req, res, next) => {
  try {
    const { userId, title, message, link } = req.body;

    if (!title || !message) {
      throw new BadRequestError('Title and message are required');
    }

    if (userId) {
      // Send to specific student
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          link,
          type: 'SYSTEM'
        }
      });
      return successResponse(res, notification, 'Notification sent to student');
    } else {
      // Broadcast to all students
      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true }
      });

      if (students.length === 0) {
        return successResponse(res, { count: 0 }, 'No students found to notify');
      }

      const notifications = students.map(student => ({
        userId: student.id,
        title,
        message,
        link,
        type: 'SYSTEM'
      }));

      const result = await prisma.notification.createMany({
        data: notifications
      });

      return successResponse(res, { count: result.count }, `Broadcasted notification to ${result.count} students`);
    }
  } catch (e) {
    next(e);
  }
});

export default router;
