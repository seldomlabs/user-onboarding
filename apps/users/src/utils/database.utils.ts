import { HttpException, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

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
      statusCode
    }, statusCode);
    this.code = code;
  }
}

export const handleDatabaseError = (error: unknown): never => {
  if (error instanceof QueryFailedError) {
    // Handle specific database errors
    switch (error.driverError?.code) {
      case '42P01': // Table does not exist
        throw new DatabaseError(
          'Required database table does not exist',
          'TABLE_NOT_FOUND',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      case '23505': // Unique constraint violation
        throw new DatabaseError(
          'Duplicate entry found',
          'DUPLICATE_ENTRY',
          HttpStatus.CONFLICT
        );
      case '23503': // Foreign key constraint violation
        throw new DatabaseError(
          'Referenced entity not found',
          'FOREIGN_KEY_VIOLATION',
          HttpStatus.BAD_REQUEST
        );
      case '23502': // Not null constraint violation
        throw new DatabaseError(
          'Required field is missing',
          'NULL_CONSTRAINT_VIOLATION',
          HttpStatus.BAD_REQUEST
        );
      default:
        throw new DatabaseError(
          'Database operation failed',
          'DATABASE_ERROR',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
  }
  throw error;
}; 