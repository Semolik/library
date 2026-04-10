import { AppException } from './app.exception';

export class UserNotFoundError extends AppException {
  readonly statusCode = 401;
  readonly message = 'User not found';
  readonly description = 'Не авторизован';

  constructor() {
    super({
      statusCode: 401,
      message: 'User not found',
      description: 'Не авторизован',
    });
  }
}

