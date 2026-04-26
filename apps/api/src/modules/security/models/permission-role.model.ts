import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { PermissionModel } from './permission.model';
import { RoleModel } from './role.model';

@Entity({ name: 'roles_x_permissions', schema: 'security' })
export class PermissionRoleModel {
  @PrimaryColumn({ type: 'uuid', name: 'permission_id' })
  permissionId: string;

  @PrimaryColumn({ type: 'uuid', name: 'role_id' })
  roleId: string;

  @ManyToOne(() => PermissionModel, (permission) => permission.permissionRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id', referencedColumnName: 'id' })
  permission: PermissionModel;

  @ManyToOne(() => RoleModel, (role) => role.permissionRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  role: RoleModel;
}

