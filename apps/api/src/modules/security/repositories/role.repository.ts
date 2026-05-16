import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleModel } from '../models/role.model';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(RoleModel)
    private readonly repo: Repository<RoleModel>,
  ) {}

  findByIdWithRelations(id: string): Promise<RoleModel | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['permissions', 'users'],
    });
  }

  findByNameWithRelations(name: string): Promise<RoleModel | null> {
    return this.repo.findOne({
      where: { name },
      relations: ['permissions', 'users'],
    });
  }

  findAllWithRelations(): Promise<RoleModel[]> {
    return this.repo.find({
      relations: ['permissions', 'users'],
    });
  }

  save(role: RoleModel): Promise<RoleModel> {
    return this.repo.save(role);
  }

  create(data: Partial<RoleModel>): RoleModel {
    return this.repo.create(data);
  }

  updateById(id: string, data: Partial<RoleModel>): Promise<void> {
    return this.repo.update(id, data).then(() => undefined);
  }

  addPermission(roleId: string, permissionId: string): Promise<void> {
    return this.repo
      .createQueryBuilder()
      .relation(RoleModel, 'permissions')
      .of(roleId)
      .add(permissionId);
  }
}
