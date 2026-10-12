export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'AppError';
  }

  static badRequest(message: string, code = 'BAD_REQUEST'): AppError {
    return new AppError(400, code, message);
  }

  static unauthorized(message = 'No autorizado', code = 'UNAUTHORIZED'): AppError {
    return new AppError(401, code, message);
  }

  static forbidden(message = 'Prohibido', code = 'FORBIDDEN'): AppError {
    return new AppError(403, code, message);
  }

  static notFound(message = 'No encontrado', code = 'NOT_FOUND'): AppError {
    return new AppError(404, code, message);
  }

  static tooManyRequests(message: string, code = 'RATE_LIMIT'): AppError {
    return new AppError(429, code, message);
  }
}
