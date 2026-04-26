import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleModel } from './role.model';
import { PermissionRoleModel } from './permission-role.model';

@Entity({ name: 'permissions', schema: 'security' })
export class PermissionModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_permissions_name')
  @Column({ type: 'varchar', length: 225, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 225, nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => RoleModel, (role) => role.permissions, {
    onDelete: 'CASCADE',
  })
  roles: RoleModel[];

  @OneToMany(() => PermissionRoleModel, (permissionRole) => permissionRole.permission)
  permissionRoles: PermissionRoleModel[];
}

