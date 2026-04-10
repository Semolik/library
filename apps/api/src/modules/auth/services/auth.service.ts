import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@common/services/prisma.service';
import { ConfigService } from '@config/config.service';
import { UserAlreadyExistsError, InvalidCredentialsError, InvalidTokenError, UserNotFoundError } from '@common/exceptions';
import type { JwtPayload, TokenResponse } from '@workspace/contracts';
import { CreateUserDto, LoginUserDto } from '@modules/auth/schemas/user';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<TokenResponse> {
    const { email, username, password } = createUserDto;

    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new UserAlreadyExistsError('email');
    }

    const existingUserByUsername = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      throw new UserAlreadyExistsError('username');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    return this.generateTokens(user);
  }

  async login(loginUserDto: LoginUserDto): Promise<TokenResponse> {
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

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
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

  private generateTokens(user: User): TokenResponse {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
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
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }
}
