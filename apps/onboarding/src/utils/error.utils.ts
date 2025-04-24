import { HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseError } from './database.utils';

export const handleHttpException = (error: any) => {
  if (error instanceof HttpException) {
    throw error;
  }

  if (error instanceof DatabaseError) {
    throw error;
  }

  throw new HttpException({
    status: "ERROR",
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  }, HttpStatus.INTERNAL_SERVER_ERROR);
}; 