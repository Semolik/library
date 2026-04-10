import { BadRequestException } from '@nestjs/common';

export class UserAlreadyExistsError extends BadRequestException {
  constructor(field: 'email' | 'username') {
    const message = field === 'email'
      ? 'User with this email already exists'
      : 'User with this username already exists';
    super(message);
  }
}

