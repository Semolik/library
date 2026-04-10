import { AppException } from './app.exception';

export class InvalidCredentialsError extends AppException {
  readonly statusCode = 401;
  readonly message = 'Invalid credentials';
  readonly description = 'Неверные учётные данные';

  constructor() {
    super({
      statusCode: 401,
      message: 'Invalid credentials',
      description: 'Неверные учётные данные',
    });
  }
}

