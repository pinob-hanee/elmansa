import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { env } from '../../config/env';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const isCloudinaryConfigured = !!env.CLOUDINARY_CLOUD_NAME && !!env.CLOUDINARY_API_KEY && !!env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

const localUploadDir = path.join(process.cwd(), 'uploads');

export const generateSignedUrl = (key: string, resourceType: 'video' | 'image' | 'raw' | 'auto' = 'video'): string => {
  if (key.startsWith('http')) return key;
  if (!isCloudinaryConfigured) return `${env.APP_URL || 'http://localhost:5000'}/uploads/${key}`;
  return cloudinary.url(key, { secure: true, resource_type: resourceType });
};

const getStorage = (folder: string, isVideo = false) => {
  if (isCloudinaryConfigured) {
    return new CloudinaryStorage({
      cloudinary,
      params: async (_req, file) => {
        return {
          folder: `elmansa/${folder}`,
          resource_type: isVideo ? 'video' : 'auto',
        };
      },
    });
  } else {
    // Local storage fallback
    const targetDir = path.join(localUploadDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    return multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, targetDir),
      filename: (_req, file, cb) => {
        const ext = file.originalname.split('.').pop();
        cb(null, `${uuidv4()}.${ext}`);
      },
    });
  }
};

// Multer for video uploads
export const videoUpload = multer({
  storage: getStorage('videos', true),
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Multer for image/PDF uploads
export const fileUpload = multer({
  storage: getStorage('documents', false),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

export const deleteMediaObject = async (public_id: string, isVideo = false): Promise<void> => {
  if (!isCloudinaryConfigured) {
    const filePath = path.join(localUploadDir, public_id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return;
  }
  await cloudinary.uploader.destroy(public_id, { resource_type: isVideo ? 'video' : 'image' });
};
