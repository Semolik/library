import { Controller, Post, Body, Get, UseGuards, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '@modules/auth/services/auth.service';
import { CurrentUser, ApiException } from '@common/decorators';
import { CreateUserDto, LoginUserDto, UserProfileDto } from '@modules/auth/schemas/user';
import { RefreshTokenDto, TokenResponseDto } from '@modules/auth/schemas/token';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { User } from '@prisma/client';
import { UserAlreadyExistsError, InvalidCredentialsError, InvalidTokenError, UserNotFoundError } from '@common/exceptions';
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
  @ApiException(UserAlreadyExistsError)
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Вход в систему' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: 200,
    description: 'Вход выполнен успешно',
    type: TokenResponseDto,
  })
  @ApiException(InvalidCredentialsError)
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Обновление токена доступа' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Токен успешно обновлён',
    type: TokenResponseDto,
  })
  @ApiException(InvalidTokenError)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Получение профиля текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Профиль пользователя',
    type: UserProfileDto,
  })
  @ApiException(UserNotFoundError)
  async getProfile(@CurrentUser() user: User) {
    return user;
  }
}
