import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionModel } from '../models/permission.model';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(PermissionModel)
    private permissionRepository: Repository<PermissionModel>,
  ) {}

  async findById(id: string): Promise<PermissionModel | null> {
    return this.permissionRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  async findByName(name: string): Promise<PermissionModel | null> {
    return this.permissionRepository.findOne({
      where: { name },
      relations: ['roles'],
    });
  }

  async findAll(): Promise<PermissionModel[]> {
    return this.permissionRepository.find({
      relations: ['roles'],
    });
  }

  async create(name: string, description?: string): Promise<PermissionModel> {
    const permission = this.permissionRepository.create({ name, description });
    return this.permissionRepository.save(permission);
  }

  async update(
    id: string,
    data: Partial<PermissionModel>,
  ): Promise<PermissionModel> {
    await this.permissionRepository.update(id, data);
    const permission = await this.findById(id);
    if (!permission) {
      throw new Error(`Permission with id ${id} not found after update`);
    }
    return permission;
  }
}

