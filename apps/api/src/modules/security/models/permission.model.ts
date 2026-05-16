import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleModel } from './role.model';

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
}

