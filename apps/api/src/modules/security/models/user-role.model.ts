import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserModel } from '../../user/models/user.model';
import { RoleModel } from './role.model';

@Entity({ name: 'roles_x_users', schema: 'security' })
export class UserRoleModel {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string;

  @PrimaryColumn({ type: 'uuid', name: 'role_id' })
  roleId: string;

  @ManyToOne(() => UserModel, (user) => user.userRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserModel;

  @ManyToOne(() => RoleModel, (role) => role.userRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  role: RoleModel;
}

