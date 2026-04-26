import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PermissionModel } from './permission.model';
import { RoleModel } from './role.model';

@Entity({ name: 'permission_role', schema: 'security' })
export class PermissionRoleModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  permissionId: string;

  @Column({ type: 'uuid' })
  roleId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => PermissionModel, (permission) => permission.permissionRoles, {
    onDelete: 'CASCADE',
  })
  permission: PermissionModel;

  @ManyToOne(() => RoleModel, (role) => role.permissionRoles, {
    onDelete: 'CASCADE',
  })
  role: RoleModel;
}

