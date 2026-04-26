import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModel } from './models/role.model';
import { PermissionModel } from './models/permission.model';
import { UserRoleModel } from './models/user-role.model';
import { PermissionRoleModel } from './models/permission-role.model';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleModel,
      PermissionModel,
      UserRoleModel,
      PermissionRoleModel,
    ]),
  ],
  providers: [RoleService, PermissionService],
  exports: [RoleService, PermissionService],
})
export class SecurityModule {}

