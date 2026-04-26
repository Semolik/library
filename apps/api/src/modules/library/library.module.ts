import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentVariables } from '../../config/env.validation';
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
} from './models';
import { LibraryService } from './services/library.service';
import { LibraryController } from './controllers/library.controller';
import { MinioService } from '../../common/minio/minio.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
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
    ]),
  ],
  providers: [
    LibraryService,
    MinioService,
    {
      provide: EnvironmentVariables,
      useFactory: () => new EnvironmentVariables(),
    },
  ],
  controllers: [LibraryController],
  exports: [LibraryService],
})
export class LibraryModule {}
