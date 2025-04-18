import { HttpException, HttpStatus } from '@nestjs/common';

export class DatabaseError extends HttpException {
  public readonly code: string;
  constructor(
    message: string,
    code: string,
    statusCode: HttpStatus
  ) {
    super({
      status: "ERROR",
      message,
      code,
    }, statusCode);
    this.code = code
  }
}

export const handleDatabaseError = (error: any) => {
  if (error instanceof DatabaseError) {
    throw error;
  }

  throw new DatabaseError(
    'Database operation failed',
    'DATABASE_ERROR',
    HttpStatus.INTERNAL_SERVER_ERROR
  );
}; 