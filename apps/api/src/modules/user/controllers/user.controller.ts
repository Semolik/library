import {
  BadRequestException,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayloadDto } from '@workspace/shared-types';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: JwtPayloadDto) {
    return this.userService.findById(user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateCurrentUser(
    @CurrentUser() user: JwtPayloadDto,
    @Req() req: Request,
  ) {
    const body = req.body as Record<string, unknown>;
    if (process.env.NODE_ENV !== 'production') {
      console.log('[users/me] update body:', body);
    }
    const email = typeof body.email === 'string' ? body.email.trim() : undefined;
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : undefined;
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : undefined;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Некорректный формат email.');
    }

    return this.userService.updateProfile(user.sub, { email, firstName, lastName });
  }
}

