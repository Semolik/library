import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserModel } from '../../user/models/user.model';
import { PermissionModel } from './permission.model';

@Entity({ name: 'roles', schema: 'security' })
export class RoleModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_roles_name')
  @Column({ type: 'varchar', length: 225, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 225, nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => UserModel, (user) => user.roles, {
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'roles_x_users',
    schema: 'security',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  users: UserModel[];

  @ManyToMany(() => PermissionModel, (permission) => permission.roles, {
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'roles_x_permissions',
    schema: 'security',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: PermissionModel[];
}

