import { HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseError } from './database.utils';
import { AxiosError } from 'axios';

export interface ErrorResponse {
  status: string;
  message: string;
  code?: string;
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
   throw error
  }
  if(error instanceof DatabaseError){
    throw error
  }


  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError;

    const statusCode = axiosError.response?.status || HttpStatus.BAD_GATEWAY;
    const data : any = axiosError.response?.data;

    const message =
      typeof data === 'string'
        ? data
        : data?.message || axiosError.message || 'Axios request failed';

    const code =
      typeof data === 'object' && data?.code
        ? data.code
        : 'AXIOS_REQUEST_FAILED';

    return new HttpException(
      {
        status: 'ERROR',
        message,
        code,
      },
      statusCode
    );
  }
  
  return new HttpException({
    status: "ERROR",
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  }, HttpStatus.INTERNAL_SERVER_ERROR);
};

export const createSuccessResponse = <T>(data: T, message: string = 'Operation successful') => ({
  status: "SUCCESS",
  message,
  data
}); 