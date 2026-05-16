import { Injectable } from '@nestjs/common';
import { RoleModel } from '../models/role.model';
import { RoleRepository } from '../repositories/role.repository';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  async findById(id: string): Promise<RoleModel | null> {
    return this.roleRepository.findByIdWithRelations(id);
  }

  async findByName(name: string): Promise<RoleModel | null> {
    return this.roleRepository.findByNameWithRelations(name);
  }

  async findAll(): Promise<RoleModel[]> {
    return this.roleRepository.findAllWithRelations();
  }

  async create(name: string, description?: string): Promise<RoleModel> {
    const role = this.roleRepository.create({ name, description });
    return this.roleRepository.save(role);
  }

  async update(id: string, data: Partial<RoleModel>): Promise<RoleModel> {
    await this.roleRepository.updateById(id, data);
    const role = await this.findById(id);
    if (!role) {
      throw new Error(`Role with id ${id} not found after update`);
    }
    return role;
  }

  async addPermission(roleId: string, permissionId: string): Promise<void> {
    const role = await this.findById(roleId);
    if (role) {
      await this.roleRepository.addPermission(roleId, permissionId);
    }
  }
}
