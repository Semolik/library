import { Injectable } from '@nestjs/common';
import { PermissionModel } from '../models/permission.model';
import { PermissionRepository } from '../repositories/permission.repository';

@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  async findById(id: string): Promise<PermissionModel | null> {
    return this.permissionRepository.findByIdWithRoles(id);
  }

  async findByName(name: string): Promise<PermissionModel | null> {
    return this.permissionRepository.findByNameWithRoles(name);
  }

  async findAll(): Promise<PermissionModel[]> {
    return this.permissionRepository.findAllWithRoles();
  }

  async create(name: string, description?: string): Promise<PermissionModel> {
    const permission = this.permissionRepository.create({ name, description });
    return this.permissionRepository.save(permission);
  }

  async update(id: string, data: Partial<PermissionModel>): Promise<PermissionModel> {
    await this.permissionRepository.updateById(id, data);
    const permission = await this.findById(id);
    if (!permission) {
      throw new Error(`Permission with id ${id} not found after update`);
    }
    return permission;
  }
}
