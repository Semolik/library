import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AuthorModel,
  BookAuthorModel,
  BookCopyModel,
  BookFavoriteModel,
  BookModel,
  CategoryModel,
  CityModel,
  PublishingHouseModel,
  StorageModel,
} from '../library-data/models';
import { LibraryCatalogController } from './controllers/library-catalog.controller';
import { LibraryFavoritesController } from './controllers/library-favorites.controller';
import { LibraryPublicCatalogController } from './controllers/library-public-catalog.controller';
import { AuthorRepository } from './repositories/author.repository';
import { BookAuthorRepository } from './repositories/book-author.repository';
import { BookCopyRepository } from './repositories/book-copy.repository';
import { BookFavoriteRepository } from './repositories/book-favorite.repository';
import { BookRepository } from './repositories/book.repository';
import { CategoryRepository } from './repositories/category.repository';
import { CityRepository } from './repositories/city.repository';
import { PublishingHouseRepository } from './repositories/publishing-house.repository';
import { StorageRepository } from './repositories/storage.repository';
import { CatalogService } from './services/catalog.service';
import { LibraryFavoritesService } from './services/library-favorites.service';
import { MinioService } from '../../common/minio/minio.service';
import { EnvironmentVariables } from '../../config/env.validation';

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
      BookFavoriteModel,
      StorageModel,
    ]),
  ],
  controllers: [LibraryCatalogController, LibraryPublicCatalogController, LibraryFavoritesController],
  providers: [
    CategoryRepository,
    PublishingHouseRepository,
    CityRepository,
    AuthorRepository,
    BookRepository,
    BookAuthorRepository,
    BookCopyRepository,
    BookFavoriteRepository,
    StorageRepository,
    CatalogService,
    LibraryFavoritesService,
    MinioService,
    {
      provide: EnvironmentVariables,
      useFactory: () => new EnvironmentVariables(),
    },
  ],
  exports: [CatalogService, BookCopyRepository],
})
export class LibraryCatalogModule {}
