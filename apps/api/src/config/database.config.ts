import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EnvironmentVariables } from './env.validation';
import { UserModel } from '../modules/user/models/user.model';
import { RoleModel } from '../modules/security/models/role.model';
import { PermissionModel } from '../modules/security/models/permission.model';
import {
  AuthorModel,
  BookAuthorModel,
  BookCopyModel,
  BookFavoriteModel,
  BookModel,
  CategoryModel,
  CityModel,
  PaidRentFineModel,
  PublishingHouseModel,
  RentedBookModel,
  ReturnBookModel,
  StorageModel,
  LibraryAppSettingsModel,
} from '../modules/library-data/models';

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
      CategoryModel,
      PublishingHouseModel,
      CityModel,
      BookModel,
      BookAuthorModel,
      AuthorModel,
      BookCopyModel,
      BookFavoriteModel,
      StorageModel,
      RentedBookModel,
      ReturnBookModel,
      PaidRentFineModel,
      LibraryAppSettingsModel,
    ],
    // Do not mutate schema on app startup; use explicit migration scripts.
    synchronize: false,
    logging: env.isDevelopment,
    ssl: env.isProduction ? { rejectUnauthorized: false } : false,
  };
}

