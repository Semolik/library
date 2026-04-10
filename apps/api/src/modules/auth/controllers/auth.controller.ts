import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '@modules/auth/services/auth.service';
import { CurrentUser } from '@common/decorators';
import { CreateUserDto } from '@modules/auth/schemas/create-user.dto';
import { LoginUserDto } from '@modules/auth/schemas/login-user.dto';
import { RefreshTokenDto } from '@modules/auth/schemas/refresh-token.dto';
import { TokenResponseDto } from '@modules/auth/schemas/token-response.dto';
import type { TokenResponse, AuthUser } from '@workspace/contracts';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { User } from '@prisma/client';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  async register(@Body() createUserDto: CreateUserDto): Promise<TokenResponse> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Вход в систему' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: 200,
    description: 'Вход выполнен успешно',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Неверные учётные данные' })
  async login(@Body() loginUserDto: LoginUserDto): Promise<TokenResponse> {
    return this.authService.login(loginUserDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Обновление токена доступа' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Токен успешно обновлён',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Невалидный refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<TokenResponse> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Получение профиля текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Профиль пользователя',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        username: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    };
  }
}
