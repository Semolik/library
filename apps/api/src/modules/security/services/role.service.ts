import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleModel } from '../models/role.model';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleModel)
    private roleRepository: Repository<RoleModel>,
  ) {}

  async findById(id: string): Promise<RoleModel | null> {
    return this.roleRepository.findOne({
      where: { id },
      relations: ['permissions', 'users'],
    });
  }

  async findByName(name: string): Promise<RoleModel | null> {
    return this.roleRepository.findOne({
      where: { name },
      relations: ['permissions', 'users'],
    });
  }

  async findAll(): Promise<RoleModel[]> {
    return this.roleRepository.find({
      relations: ['permissions', 'users'],
    });
  }

  async create(name: string, description?: string): Promise<RoleModel> {
    const role = this.roleRepository.create({ name, description });
    return this.roleRepository.save(role);
  }

  async update(id: string, data: Partial<RoleModel>): Promise<RoleModel> {
    await this.roleRepository.update(id, data);
    const role = await this.findById(id);
    if (!role) {
      throw new Error(`Role with id ${id} not found after update`);
    }
    return role;
  }

  async addPermission(roleId: string, permissionId: string): Promise<void> {
    const role = await this.findById(roleId);
    if (role) {
      role.permissions.push({ id: permissionId } as any);
      await this.roleRepository.save(role);
    }
  }
}

