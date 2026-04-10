import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@common/services/prisma.service';
import { ConfigService } from '@config/config.service';
import { UserAlreadyExistsError, InvalidCredentialsError, InvalidTokenError, UserNotFoundError } from '@common/exceptions';
import type { CreateUserFormData, LoginUserFormData } from '@workspace/contracts/auth';
import { User, Prisma } from '@prisma/client';

interface JwtPayload {
  sub: number;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserFormData) {
    const { email, password } = createUserDto;

    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new UserAlreadyExistsError();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData: Prisma.UserCreateInput = {
      email,
      password: hashedPassword,
    };

    const user = await this.prisma.user.create({
      data: userData,
    });

    return this.generateTokens(user);
  }

  async login(loginUserDto: LoginUserFormData) {
    const { email, password } = loginUserDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken);
    } catch {
      throw new InvalidTokenError('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new InvalidTokenError('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UserNotFoundError();
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: User) {
    const accessPayload = {
      sub: user.id,
      type: 'access',
    };

    const refreshPayload = {
      sub: user.id,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: 3600, // 1 час в секундах
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: 604800, // 7 дней в секундах
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.jwtExpiration,
    };
  }
}
