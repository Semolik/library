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
import { JwtPayloadDto, RoleEnum } from '@workspace/shared-types';
import { UserModel } from '../models/user.model';

function userWithoutPassword(user: UserModel): Omit<UserModel, 'password'> {
  const { password: _pw, ...rest } = user;
  return rest;
}

const ELEVATED_STAFF_ROLES = ['SUPERUSER', 'ADMIN'] as const;

/** Ещё и библиотекарь (регистрация читателей по ТЗ) */
const USER_MANAGEMENT_ROLES = ['SUPERUSER', 'ADMIN', 'LIBRARIAN'] as const;

const NON_READER_ROLE_NAMES = new Set<string>([
  RoleEnum.SUPERUSER,
  RoleEnum.ADMIN,
  RoleEnum.LIBRARIAN,
]);

function isElevatedStaff(roles?: string[]): boolean {
  return Boolean(
    roles?.some((r) =>
      ELEVATED_STAFF_ROLES.includes(r as (typeof ELEVATED_STAFF_ROLES)[number]),
    ),
  );
}

function isOnlyReaderRoles(roleNames: string[]): boolean {
  return roleNames.every((name) => name === RoleEnum.USER);
}

function targetHasNonReaderRoles(roleNames: string[]): boolean {
  return roleNames.some((name) => NON_READER_ROLE_NAMES.has(name));
}

function assertRoleAssignmentAllowed(current: JwtPayloadDto, assignedRoles: string[]): void {
  if (isElevatedStaff(current.roles)) return;

  const isLibrarian = current.roles?.includes(RoleEnum.LIBRARIAN);
  if (!isLibrarian) {
    throw new ForbiddenException('Недостаточно прав.');
  }

  if (!isOnlyReaderRoles(assignedRoles)) {
    throw new ForbiddenException('Библиотекарь может назначать только роль читателя.');
  }
}

async function assertLibrarianMayAccessUserCard(
  userService: UserService,
  current: JwtPayloadDto,
  targetUserId: string,
): Promise<void> {
  if (isElevatedStaff(current.roles)) return;

  const isLibrarian = current.roles?.includes(RoleEnum.LIBRARIAN);
  if (!isLibrarian) return;

  const target = await userService.findById(targetUserId);
  if (!target) {
    throw new NotFoundException('Пользователь не найден.');
  }

  const names = target.roles?.map((r) => r.name) ?? [];
  if (names.length > 0 && targetHasNonReaderRoles(names)) {
    throw new ForbiddenException(
      'Карточки персонала и администраторов доступны только администратору библиотеки.',
    );
  }
}

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
    const row = await this.userService.findById(user.sub);
    if (!row) {
      throw new NotFoundException('Пользователь не найден.');
    }
    return userWithoutPassword(row);
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

    const updated = await this.userService.updateProfile(user.sub, { email, firstName, lastName });
    return userWithoutPassword(updated);
  }

  @Get('list-roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...USER_MANAGEMENT_ROLES)
  async listRoles(@CurrentUser() current: JwtPayloadDto) {
    const roles = await this.roleService.findAll();
    const elevated = isElevatedStaff(current.roles);
    const filtered = elevated ? roles : roles.filter((role) => role.name === RoleEnum.USER);
    return filtered.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
    }));
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...USER_MANAGEMENT_ROLES)
  async listUsers() {
    return this.userService.findAllUsers();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...USER_MANAGEMENT_ROLES)
  async getUser(@CurrentUser() current: JwtPayloadDto, @Param('id') id: string) {
    await assertLibrarianMayAccessUserCard(this.userService, current, id);

    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('Пользователь не найден.');
    }
    return user;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...USER_MANAGEMENT_ROLES)
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

    let roles = asStringArray(body.roles) ?? [];

    if (
      roles.includes(RoleEnum.SUPERUSER) &&
      !current.roles?.includes(RoleEnum.SUPERUSER)
    ) {
      throw new ForbiddenException('Назначить роль SUPERUSER может только суперпользователь.');
    }

    if (!isElevatedStaff(current.roles) && current.roles?.includes(RoleEnum.LIBRARIAN)) {
      roles = roles.length === 0 ? [RoleEnum.USER] : roles;
    }

    assertRoleAssignmentAllowed(current, roles);

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
  @Roles(...USER_MANAGEMENT_ROLES)
  async updateUser(
    @CurrentUser() current: JwtPayloadDto,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    await assertLibrarianMayAccessUserCard(this.userService, current, id);

    const body = (req.body ?? {}) as Record<string, unknown>;
    const email = asString(body.email);

    if (email && !EMAIL_REGEX.test(email)) {
      throw new BadRequestException('Некорректный формат email.');
    }

    const rolesInput = asStringArray(body.roles);
    const isSuperuser = current.roles?.includes(RoleEnum.SUPERUSER) ?? false;

    let rolesToPersist: string[] | undefined = rolesInput;

    if (rolesInput !== undefined) {
      let effective = rolesInput;
      if (!isElevatedStaff(current.roles) && current.roles?.includes(RoleEnum.LIBRARIAN)) {
        effective = rolesInput.length === 0 ? [RoleEnum.USER] : rolesInput;
      }

      if (effective.includes(RoleEnum.SUPERUSER) && !isSuperuser) {
        throw new ForbiddenException('Назначить роль SUPERUSER может только суперпользователь.');
      }

      assertRoleAssignmentAllowed(current, effective);
      rolesToPersist = effective;
    }

    if (
      current.sub === id &&
      rolesToPersist &&
      !rolesToPersist.includes(RoleEnum.SUPERUSER) &&
      isSuperuser
    ) {
      throw new BadRequestException('Нельзя снять с себя роль SUPERUSER.');
    }

    return this.userService.adminUpdate(id, {
      email,
      firstName: asNullableString(body.firstName),
      lastName: asNullableString(body.lastName),
      isActive: asBoolean(body.isActive),
      roles: rolesToPersist,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...USER_MANAGEMENT_ROLES)
  async deleteUser(
    @CurrentUser() current: JwtPayloadDto,
    @Param('id') id: string,
  ) {
    await assertLibrarianMayAccessUserCard(this.userService, current, id);

    if (current.sub === id) {
      throw new BadRequestException('Нельзя удалить собственный аккаунт.');
    }
    await this.userService.deleteUser(id);
    return { id };
  }
}
