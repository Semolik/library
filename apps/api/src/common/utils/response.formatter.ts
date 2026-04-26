import { Injectable } from '@nestjs/common';

export interface IResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
}

@Injectable()
export class ResponseFormatter {
  static success<T>(data: T, message = 'Success'): IResponse<T> {
    return {
      statusCode: 200,
      message,
      data,
    };
  }

  static created<T>(data: T, message = 'Created'): IResponse<T> {
    return {
      statusCode: 201,
      message,
      data,
    };
  }

  static error(error: string, statusCode = 400): IResponse {
    return {
      statusCode,
      error,
    };
  }
}

