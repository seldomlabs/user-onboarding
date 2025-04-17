import { HttpException } from '@nestjs/common';
import { DatabaseError } from './database.utils';

export const handleHttpException = (error: any) => {
  if (error instanceof HttpException) {
    throw error;
  }

  if (error instanceof DatabaseError) {
    throw new HttpException({
      status: "ERROR",
      message: error.message,
      code: error.code,
      statusCode: error.getStatus()
    }, error.getStatus());
  }

  throw new HttpException({
    status: "ERROR",
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    statusCode: 500
  }, 500);
}; 