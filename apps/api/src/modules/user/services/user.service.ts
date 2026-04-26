import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserModel } from '../models/user.model';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>,
  ) {}

  async findById(id: string): Promise<UserModel | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });
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

  async update(
    id: string,
    data: Partial<UserModel>,
  ): Promise<UserModel> {
    await this.userRepository.update(id, data);
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

  async addRole(userId: string, roleId: string): Promise<void> {
    const user = await this.findById(userId);
    if (user) {
      user.roles.push({ id: roleId } as any);
      await this.userRepository.save(user);
    }
  }
}

