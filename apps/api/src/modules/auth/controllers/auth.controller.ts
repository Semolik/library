import { Controller, Post, Body, Get, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UserRegisterDto, UserLoginDto } from '@workspace/shared-types';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayloadDto } from '@workspace/shared-types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: UserRegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.firstName, dto.lastName);
  }

  @Post('login')
  async login(@Body() dto: UserLoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: JwtPayloadDto) {
    return user;
  }
}

