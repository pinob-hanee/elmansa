import { z } from 'zod';

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100),
    description: z.string().min(10),
    categoryId: z.string().uuid().optional().or(z.literal('')),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    isFree: z.boolean().optional(),
    price: z.number().min(0).optional(),
    thumbnailUrl: z.string().url().optional().or(z.literal('')),
  })
});

export const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().min(10).optional(),
    categoryId: z.string().uuid().optional().or(z.literal('')),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    isFree: z.boolean().optional(),
    price: z.number().min(0).optional(),
    thumbnailUrl: z.string().url().optional().or(z.literal('')),
    isPublished: z.boolean().optional(),
  })
});

export const createChapterSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100),
    sortOrder: z.number().int().min(0).optional(),
  })
});

export const createLessonSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100),
    type: z.enum(['VIDEO', 'PDF', 'TEXT', 'QUIZ', 'ASSIGNMENT']),
    videoUrl: z.string().url().optional().or(z.literal('')),
    content: z.string().optional(),
    sortOrder: z.number().int().min(0).optional(),
    duration: z.number().int().min(0).optional(),
    isFreePreview: z.boolean().optional()
  })
});

export const listCoursesQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    categoryId: z.string().uuid().optional().or(z.literal('')),
    search: z.string().optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    isFree: z.enum(['true', 'false']).optional(),
  })
});
