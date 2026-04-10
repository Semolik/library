import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { AppException } from '../exceptions/app.exception';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExceptionConstructor = new (...args: any[]) => AppException;

export function ApiException(...exceptions: ExceptionConstructor[]) {
  const decorators = exceptions.map(exc => {
    const instance = new exc();

    return ApiResponse({
      status: instance.statusCode,
      description: instance.description,
    });
  });

  return applyDecorators(...decorators);
}

