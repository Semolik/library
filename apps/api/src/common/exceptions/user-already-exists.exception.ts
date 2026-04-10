import { AppException } from './app.exception';

export class UserAlreadyExistsError extends AppException {
  readonly statusCode = 400;
  readonly message = 'User with this email already exists';
  readonly description = 'Email уже зарегистрирован';

  constructor() {
    super({
      statusCode: 400,
      message: 'User with this email already exists',
      description: 'Email уже зарегистрирован',
    });
  }
}

