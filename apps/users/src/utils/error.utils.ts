import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorResponse {
  status: string;
  message: string;
  code?: string;
  statusCode?: number;
}

export const formatErrorMessage = (errorResponse: unknown): string => {
  if (typeof errorResponse === 'string') {
    return errorResponse;
  }
  if (typeof errorResponse === 'object' && errorResponse !== null) {
    const errorObj = errorResponse as { message?: unknown };
    if (errorObj.message !== undefined) {
      return String(errorObj.message);
    }
    return JSON.stringify(errorResponse);
  }
  return String(errorResponse);
};

export const handleHttpException = (error: unknown): HttpException => {
  if (error instanceof HttpException) {
    const errorResponse = error.getResponse();
    const status = error.getStatus();
    const errorMessage = formatErrorMessage(errorResponse);
    return new HttpException(errorMessage, status);
  }
  
  return new HttpException({
    status: "ERROR",
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    statusCode: 500
  }, HttpStatus.INTERNAL_SERVER_ERROR);
};

export const createSuccessResponse = <T>(data: T, message: string = 'Operation successful') => ({
  status: "SUCCESS",
  message,
  data
}); 