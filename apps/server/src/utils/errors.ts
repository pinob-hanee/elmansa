// ============================================================
// Custom Error Classes
// ============================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: unknown;

  constructor(message: string, statusCode: number, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', errors?: unknown) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export class UnprocessableError extends AppError {
  constructor(message = 'Unprocessable Entity', errors?: unknown) {
    super(message, 422, errors);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too Many Requests') {
    super(message, 429);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
  }
}
