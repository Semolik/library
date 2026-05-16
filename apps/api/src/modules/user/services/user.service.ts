import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RoleService } from '../../security/services/role.service';
import { UserModel } from '../models/user.model';
import { UserRepository } from '../repositories/user.repository';

export type AdminUserUpdateInput = {
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  isActive?: boolean;
  roles?: string[];
};

export type AdminUserCreateInput = {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  isActive?: boolean;
  roles?: string[];
};

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private roleService: RoleService,
  ) {}

  async findById(id: string): Promise<UserModel | null> {
    return this.userRepository.findByIdWithRolesAndPermissions(id);
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    return this.userRepository.findByEmailWithRolesAndPermissions(email);
  }

  /** True, если хотя бы у одного пользователя есть роль с данным именем. */
  async hasAnyUserWithRole(roleName: string): Promise<boolean> {
    const count = await this.userRepository.countUsersHavingRoleName(roleName);
    return count > 0;
  }

  async findAllUsers(): Promise<UserModel[]> {
    return this.userRepository.findAllWithRolesOrderedByCreatedAt();
  }

  async create(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ): Promise<UserModel> {
    const user = this.userRepository.create({
      email,
      password,
      firstName,
      lastName,
    });
    return this.userRepository.save(user);
  }

  async update(id: string, data: Partial<UserModel>): Promise<UserModel> {
    await this.userRepository.updateById(id, data);
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User with id ${id} not found after update`);
    }
    return user;
  }

  async updateProfile(
    id: string,
    data: { email?: string; firstName?: string; lastName?: string },
  ): Promise<UserModel> {
    const user = await this.findById(id);
    if (!user) {
      throw new BadRequestException('Пользователь не найден.');
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new BadRequestException('Пользователь с таким email уже существует.');
      }
    }

    return this.update(id, {
      email: data.email ?? user.email,
      firstName: data.firstName ?? user.firstName,
      lastName: data.lastName ?? user.lastName,
    });
  }

  async setRolesByName(id: string, roleNames: string[]): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Пользователь не найден.');
    }

    const uniqueNames = Array.from(new Set(roleNames.map((name) => name.trim()).filter(Boolean)));
    const targetRoles = await Promise.all(
      uniqueNames.map((name) => this.roleService.findByName(name)),
    );
    const missing = uniqueNames.filter((_, index) => !targetRoles[index]);
    if (missing.length > 0) {
      throw new BadRequestException(`Неизвестные роли: ${missing.join(', ')}`);
    }

    const targetIds = targetRoles
      .filter((role): role is NonNullable<typeof role> => Boolean(role))
      .map((role) => role.id);
    const currentIds = user.roles.map((role) => role.id);
    const toAdd = targetIds.filter((rid) => !currentIds.includes(rid));
    const toRemove = currentIds.filter((cid) => !targetIds.includes(cid));

    if (toAdd.length === 0 && toRemove.length === 0) {
      return;
    }

    await this.userRepository.replaceRoles(id, toAdd, toRemove);
  }

  async adminUpdate(id: string, data: AdminUserUpdateInput): Promise<UserModel> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Пользователь не найден.');
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new BadRequestException('Пользователь с таким email уже существует.');
      }
    }

    const update: Partial<UserModel> = {};
    if (data.email !== undefined) update.email = data.email;
    if (data.firstName !== undefined) update.firstName = data.firstName ?? null;
    if (data.lastName !== undefined) update.lastName = data.lastName ?? null;
    if (data.isActive !== undefined) update.isActive = data.isActive;

    if (Object.keys(update).length > 0) {
      await this.userRepository.updateById(id, update);
    }

    if (data.roles) {
      await this.setRolesByName(id, data.roles);
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException('Пользователь не найден.');
    }
    return updated;
  }

  async adminCreate(data: AdminUserCreateInput): Promise<UserModel> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new BadRequestException('Пользователь с таким email уже существует.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      isActive: data.isActive ?? true,
    });
    const saved = await this.userRepository.save(user);

    if (data.roles && data.roles.length > 0) {
      await this.setRolesByName(saved.id, data.roles);
    }

    const created = await this.findById(saved.id);
    if (!created) {
      throw new NotFoundException('Пользователь не найден.');
    }
    return created;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Пользователь не найден.');
    }
    await this.userRepository.deleteById(id);
  }

  async addRole(userId: string, roleId: string): Promise<void> {
    await this.userRepository.addRole(userId, roleId);
  }
}
