import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../user/services/user.service';
import { RoleService } from '../../security/services/role.service';
import { JwtPayloadDto, RoleEnum } from '@workspace/shared-types';
import { EnvironmentVariables } from '../../../config/env.validation';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private jwtService: JwtService,
    private env: EnvironmentVariables,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userService.create(
      email,
      hashedPassword,
      firstName,
      lastName,
    );

    // Первый регистрант получает SUPERUSER, если в системе ещё никто не имеет этой роли;
    // все последующие — USER (ADMIN/LIBRARIAN назначаются вручную администратором).
    const roleName = (await this.userService.hasAnyUserWithRole(RoleEnum.SUPERUSER))
      ? RoleEnum.USER
      : RoleEnum.SUPERUSER;
    const roleToAssign = await this.roleService.findByName(roleName);
    if (roleToAssign) {
      await this.userService.addRole(user.id, roleToAssign.id);
    }

    const refreshed = await this.userService.findById(user.id);
    return this.login(refreshed ?? user);
  }

  async login(user: any) {
    const roleNames = user.roles?.map((role: { name: string }) => role.name) || [];

    const payload: JwtPayloadDto = {
      sub: user.id,
      email: user.email,
      roles: roleNames,
    };

    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: this.env.JWT_EXPIRATION_TIME,
      }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roleNames,
      },
    };
  }

  async validateToken(token: string): Promise<JwtPayloadDto> {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

