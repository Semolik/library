import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModel } from './models/role.model';
import { PermissionModel } from './models/permission.model';
import { PermissionRepository } from './repositories/permission.repository';
import { RoleRepository } from './repositories/role.repository';
import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoleModel, PermissionModel]),
  ],
  providers: [RoleRepository, PermissionRepository, RoleService, PermissionService],
  exports: [RoleService, PermissionService],
})
export class SecurityModule {}

