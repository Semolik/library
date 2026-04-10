import { AppException } from './app.exception';

export class InvalidTokenError extends AppException {
  readonly statusCode = 401;
  readonly description = 'Невалидный токен';
  readonly message: string;

  constructor(message: string = 'Invalid token') {
    super({
      statusCode: 401,
      message: message,
      description: 'Невалидный токен',
    });
    this.message = message;
  }
}

