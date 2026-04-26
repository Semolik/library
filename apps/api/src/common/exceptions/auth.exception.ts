import { UnauthorizedException } from '@nestjs/common';

export class AuthException extends UnauthorizedException {
  constructor(message: string) {
    super(message);
  }
}

