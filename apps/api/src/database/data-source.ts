import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { EnvironmentVariables } from '../config/env.validation';
import { UserModel } from '../modules/user/models/user.model';
import { RoleModel } from '../modules/security/models/role.model';
import { PermissionModel } from '../modules/security/models/permission.model';
import { UserRoleModel } from '../modules/security/models/user-role.model';
import { PermissionRoleModel } from '../modules/security/models/permission-role.model';

dotenv.config();

const env = new EnvironmentVariables();

export default new DataSource({
  type: 'postgres',
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  username: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  entities: [
    UserModel,
    RoleModel,
    PermissionModel,
    UserRoleModel,
    PermissionRoleModel,
  ],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: env.isDevelopment,
  ssl: env.isProduction ? { rejectUnauthorized: false } : false,
});
