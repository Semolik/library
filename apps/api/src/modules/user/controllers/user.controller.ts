import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../services/user.service';
import { RoleService } from '../../security/services/role.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayloadDto } from '@workspace/shared-types';

const ADMIN_ROLES = ['SUPERUSER', 'ADMIN'] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function asNullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }
  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private roleService: RoleService,
  ) {}

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
    const email = asString(body.email);
    const firstName = asString(body.firstName);
    const lastName = asString(body.lastName);

    if (email && !EMAIL_REGEX.test(email)) {
      throw new BadRequestException('Некорректный формат email.');
    }

    return this.userService.updateProfile(user.sub, { email, firstName, lastName });
  }

  @Get('list-roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async listRoles() {
    const roles = await this.roleService.findAll();
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
    }));
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async listUsers() {
    return this.userService.findAllUsers();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async getUser(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('Пользователь не найден.');
    }
    return user;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async createUser(
    @CurrentUser() current: JwtPayloadDto,
    @Req() req: Request,
  ) {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const email = asString(body.email);
    const password = typeof body.password === 'string' ? body.password : undefined;

    if (!email || !EMAIL_REGEX.test(email)) {
      throw new BadRequestException('Некорректный формат email.');
    }
    if (!password || password.length < 8) {
      throw new BadRequestException('Пароль должен быть не короче 8 символов.');
    }

    const roles = asStringArray(body.roles) ?? [];
    if (
      roles.includes('SUPERUSER') &&
      !current.roles?.includes('SUPERUSER')
    ) {
      throw new ForbiddenException('Назначить роль SUPERUSER может только суперпользователь.');
    }

    return this.userService.adminCreate({
      email,
      password,
      firstName: asNullableString(body.firstName) ?? null,
      lastName: asNullableString(body.lastName) ?? null,
      isActive: asBoolean(body.isActive) ?? true,
      roles,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async updateUser(
    @CurrentUser() current: JwtPayloadDto,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const email = asString(body.email);

    if (email && !EMAIL_REGEX.test(email)) {
      throw new BadRequestException('Некорректный формат email.');
    }

    const roles = asStringArray(body.roles);
    const isSuperuser = current.roles?.includes('SUPERUSER') ?? false;
    if (roles && roles.includes('SUPERUSER') && !isSuperuser) {
      throw new ForbiddenException('Назначить роль SUPERUSER может только суперпользователь.');
    }

    if (current.sub === id && roles && !roles.includes('SUPERUSER') && isSuperuser) {
      throw new BadRequestException('Нельзя снять с себя роль SUPERUSER.');
    }

    return this.userService.adminUpdate(id, {
      email,
      firstName: asNullableString(body.firstName),
      lastName: asNullableString(body.lastName),
      isActive: asBoolean(body.isActive),
      roles,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  async deleteUser(
    @CurrentUser() current: JwtPayloadDto,
    @Param('id') id: string,
  ) {
    if (current.sub === id) {
      throw new BadRequestException('Нельзя удалить собственный аккаунт.');
    }
    await this.userService.deleteUser(id);
    return { id };
  }
}
