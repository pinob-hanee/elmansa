import { Router } from 'express';
import { authenticate, requireRole } from '../../api/middlewares/auth.middleware';
import { successResponse } from '../../utils/response';
import { videoUpload, fileUpload } from './media.service';

const router = Router();

// Upload video
router.post(
  '/video',
  authenticate,
  requireRole('TEACHER', 'SUPER_ADMIN'),
  videoUpload.single('video'),
  (req, res, next) => {
    try {
      const file = req.file as any;
      if (!file) throw new Error('No file uploaded');
      
      const isCloudinary = file.path && file.path.startsWith('http');
      const location = isCloudinary ? file.path : `${process.env.APP_URL || 'http://localhost:5000'}/uploads/videos/${file.filename}`;
      const key = file.filename; // Cloudinary public_id or local filename

      successResponse(res, {
        key,
        location,
        mimetype: file.mimetype,
        size: file.size,
      }, 'Video uploaded', 201);
    } catch (e) { next(e); }
  }
);

// Upload image or document
router.post(
  '/file',
  authenticate,
  fileUpload.single('file'),
  (req, res, next) => {
    try {
      const file = req.file as any;
      if (!file) throw new Error('No file uploaded');
      
      const isCloudinary = file.path && file.path.startsWith('http');
      const location = isCloudinary ? file.path : `${process.env.APP_URL || 'http://localhost:5000'}/uploads/documents/${file.filename}`;
      const key = file.filename;

      successResponse(res, {
        key,
        location,
        mimetype: file.mimetype,
        size: file.size,
      }, 'File uploaded', 201);
    } catch (e) { next(e); }
  }
);

export default router;
