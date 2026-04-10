import { HttpException } from '@nestjs/common';

export interface AppExceptionOptions {
  statusCode: number;
  message: string;
  description: string;
}

export class AppException extends HttpException {
  readonly statusCode: number;
  readonly message: string;
  readonly description: string;

  constructor(options: AppExceptionOptions) {
    super(options.message, options.statusCode);
    this.statusCode = options.statusCode;
    this.message = options.message;
    this.description = options.description;
  }

  getResponse() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      description: this.description,
    };
  }
}

