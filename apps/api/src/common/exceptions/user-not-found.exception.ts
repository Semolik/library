import { UnauthorizedException } from '@nestjs/common';

export class UserNotFoundError extends UnauthorizedException {
  constructor() {
    super('User not found');
  }
}

