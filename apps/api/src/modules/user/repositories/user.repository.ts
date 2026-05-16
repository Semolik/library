import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserModel } from '../models/user.model';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserModel)
    private readonly repo: Repository<UserModel>,
  ) {}

  findByIdWithRolesAndPermissions(id: string): Promise<UserModel | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
  }

  findById(id: string): Promise<UserModel | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmailWithRolesAndPermissions(email: string): Promise<UserModel | null> {
    return this.repo.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });
  }

  countUsersHavingRoleName(roleName: string): Promise<number> {
    return this.repo
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.name = :roleName', { roleName })
      .getCount();
  }

  findAllWithRolesOrderedByCreatedAt(): Promise<UserModel[]> {
    return this.repo.find({
      relations: ['roles'],
      order: { createdAt: 'ASC' },
    });
  }

  save(user: UserModel): Promise<UserModel> {
    return this.repo.save(user);
  }

  create(data: Partial<UserModel>): UserModel {
    return this.repo.create(data);
  }

  updateById(id: string, data: Partial<UserModel>): Promise<void> {
    return this.repo.update(id, data).then(() => undefined);
  }

  deleteById(id: string): Promise<void> {
    return this.repo.delete(id).then(() => undefined);
  }

  replaceRoles(userId: string, toAdd: string[], toRemove: string[]): Promise<void> {
    return this.repo
      .createQueryBuilder()
      .relation(UserModel, 'roles')
      .of(userId)
      .addAndRemove(toAdd, toRemove);
  }

  addRole(userId: string, roleId: string): Promise<void> {
    return this.repo.createQueryBuilder().relation(UserModel, 'roles').of(userId).add(roleId);
  }
}
