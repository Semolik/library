import { UnauthorizedException } from '@nestjs/common';

export class InvalidTokenError extends UnauthorizedException {
  constructor(message = 'Invalid token') {
    super(message);
  }
}

