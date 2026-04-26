import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserModel } from '../../user/models/user.model';
import { RoleModel } from './role.model';

@Entity({ name: 'user_role', schema: 'security' })
export class UserRoleModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  roleId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserModel, (user) => user.userRoles, {
    onDelete: 'CASCADE',
  })
  user: UserModel;

  @ManyToOne(() => RoleModel, (role) => role.userRoles, {
    onDelete: 'CASCADE',
  })
  role: RoleModel;
}

