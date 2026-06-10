import { CourseService } from '../src/modules/courses/course.service';
import { prisma } from '../src/config/database';
import { cache } from '../src/config/cache';

// Mock dependencies
jest.mock('../src/config/database', () => ({
  prisma: {
    course: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
    },
    certificate: {
      findUnique: jest.fn(),
    },
    studentChapterDeadline: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../src/config/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

describe('CourseService', () => {
  let courseService: CourseService;

  beforeEach(() => {
    courseService = new CourseService();
    jest.clearAllMocks();
  });

  describe('listCourses', () => {
    it('should return cached courses for public requests if available', async () => {
      const mockCachedData = { courses: [{ id: '1', title: 'Cached Course' }], meta: { page: 1, limit: 12, total: 1, totalPages: 1 } };
      (cache.get as jest.Mock).mockResolvedValue(mockCachedData);

      const filters = { isPublished: true, page: 1, limit: 12 };
      const result = await courseService.listCourses(filters);

      expect(cache.get).toHaveBeenCalledWith(`courses:list:${JSON.stringify(filters)}`);
      expect(result).toEqual(mockCachedData);
      expect(prisma.course.findMany).not.toHaveBeenCalled();
    });

    it('should query DB, set cache and return data if cache miss', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null);
      const mockCourses = [{ id: '1', title: 'DB Course' }];
      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      (prisma.course.count as jest.Mock).mockResolvedValue(1);

      const filters = { isPublished: true, page: 1, limit: 12 };
      const result = await courseService.listCourses(filters);

      expect(cache.get).toHaveBeenCalledWith(`courses:list:${JSON.stringify(filters)}`);
      expect(prisma.course.findMany).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith(
        `courses:list:${JSON.stringify(filters)}`,
        result,
        300
      );
      expect(result.courses).toEqual(mockCourses);
    });

    it('should NOT use cache for admin queries (isPublished: false)', async () => {
      const mockCourses = [{ id: '1', title: 'Admin Course' }];
      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      (prisma.course.count as jest.Mock).mockResolvedValue(1);

      const filters = { isPublished: false, page: 1, limit: 12 };
      await courseService.listCourses(filters);

      expect(cache.get).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
      expect(prisma.course.findMany).toHaveBeenCalled();
    });
  });

  describe('getCourseBySlug', () => {
    it('should return cached course for public request (no userId)', async () => {
      const mockCached = { id: 'course-1', title: 'Cached Details' };
      (cache.get as jest.Mock).mockResolvedValue(mockCached);

      const result = await courseService.getCourseBySlug('my-course');

      expect(cache.get).toHaveBeenCalledWith('course:my-course:public');
      expect(result).toEqual(mockCached);
      expect(prisma.course.findUnique).not.toHaveBeenCalled();
    });
  });
});
