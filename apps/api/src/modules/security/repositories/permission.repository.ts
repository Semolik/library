import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionModel } from '../models/permission.model';

@Injectable()
export class PermissionRepository {
  constructor(
    @InjectRepository(PermissionModel)
    private readonly repo: Repository<PermissionModel>,
  ) {}

  findByIdWithRoles(id: string): Promise<PermissionModel | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  findByNameWithRoles(name: string): Promise<PermissionModel | null> {
    return this.repo.findOne({
      where: { name },
      relations: ['roles'],
    });
  }

  findAllWithRoles(): Promise<PermissionModel[]> {
    return this.repo.find({
      relations: ['roles'],
    });
  }

  save(permission: PermissionModel): Promise<PermissionModel> {
    return this.repo.save(permission);
  }

  create(data: Partial<PermissionModel>): PermissionModel {
    return this.repo.create(data);
  }

  updateById(id: string, data: Partial<PermissionModel>): Promise<void> {
    return this.repo.update(id, data).then(() => undefined);
  }
}
