import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EnvironmentVariables } from './env.validation';
import { UserModel } from '../modules/user/models/user.model';
import { RoleModel } from '../modules/security/models/role.model';
import { PermissionModel } from '../modules/security/models/permission.model';
import { UserRoleModel } from '../modules/security/models/user-role.model';
import { PermissionRoleModel } from '../modules/security/models/permission-role.model';
import {
  AuthorModel,
  BookAuthorModel,
  BookCopyModel,
  BookModel,
  CategoryModel,
  CityModel,
  PaidRentFineModel,
  PublishingHouseModel,
  RentedBookModel,
  ReturnBookModel,
  StorageModel,
} from '../modules/library/models';

export function getDatabaseConfig(env: EnvironmentVariables): TypeOrmModuleOptions {
  return {
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
      CategoryModel,
      PublishingHouseModel,
      CityModel,
      BookModel,
      BookAuthorModel,
      AuthorModel,
      BookCopyModel,
      StorageModel,
      RentedBookModel,
      ReturnBookModel,
      PaidRentFineModel,
    ],
    // Do not mutate schema on app startup; use explicit migration scripts.
    synchronize: false,
    logging: env.isDevelopment,
    ssl: env.isProduction ? { rejectUnauthorized: false } : false,
  };
}

