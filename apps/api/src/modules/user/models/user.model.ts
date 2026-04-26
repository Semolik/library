import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleModel } from '../../security/models/role.model';
import { UserRoleModel } from '../../security/models/user-role.model';

@Entity({ name: 'users', schema: 'public' })
export class UserModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => RoleModel, (role) => role.users)
  roles: RoleModel[];

  @OneToMany(() => UserRoleModel, (userRole) => userRole.user)
  userRoles: UserRoleModel[];
}

