import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';

import { env } from './config/env';
import { logger } from './utils/logger';
import { generalLimiter } from './api/middlewares/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './api/middlewares/error.middleware';
import { setupPassport } from './config/passport';

// Routes
import authRoutes from './modules/auth/auth.routes';
import courseRoutes from './modules/courses/course.routes';
import assignmentRoutes from './modules/courses/assignment.routes';
import userRoutes from './modules/users/user.routes';
import adminRoutes from './modules/admin/admin.routes';
import communityRoutes from './modules/community/community.routes';
import mediaRoutes from './modules/media/media.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import quizRoutes from './modules/quiz/quiz.routes';
import gamificationRoutes from './modules/gamification/gamification.routes';
import codingRoutes from './modules/coding/coding.routes';
import aiRoutes from './modules/ai/ai.routes';

const app = express();
const httpServer = createServer(app);

// ============================================================
// Socket.IO Setup
// ============================================================
export const io = new SocketIO(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on('join:user', (userId: string) => {
    socket.join(`user:${userId}`);
  });
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ============================================================
// Security Middleware
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers['x-forwarded-proto'] &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    return res.redirect(301, `https://${req.hostname}${req.url}`);
  }
  next();
});

app.use(
  helmet({
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        mediaSrc: ["'self'", 'https:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ============================================================
// General Middleware
// ============================================================
import path from 'path';

app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(generalLimiter);

// Serve local uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ============================================================
// Passport (OAuth)
// ============================================================
setupPassport();
app.use(passport.initialize());

// ============================================================
// Swagger API Docs
// ============================================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Elmansa LMS API',
      version: '1.0.0',
      description: 'Enterprise Learning Management System API',
    },
    servers: [{ url: `${env.APP_URL}/api/v1` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============================================================
// Health Check
// ============================================================
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
});

// ============================================================
// API Routes
// ============================================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/courses', assignmentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/gamification', gamificationRoutes);
app.use('/api/v1/coding', codingRoutes);
app.use('/api/v1/ai', aiRoutes);

// ============================================================
// Error Handling
// ============================================================
app.use(notFoundHandler);
app.use(errorHandler);

export { app, httpServer };
