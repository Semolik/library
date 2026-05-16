import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CatalogService } from '../services/catalog.service';

/** Публичные методы читательского каталога без JWT. */
@Controller('library/public')
export class LibraryPublicCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('popular-by-category')
  popularByCategory(
    @Query('limitPerCategory', new DefaultValuePipe(5), ParseIntPipe) limitPerCategory: number,
  ) {
    if (!Number.isFinite(limitPerCategory) || limitPerCategory < 1 || limitPerCategory > 20) {
      throw new BadRequestException('limitPerCategory: от 1 до 20.');
    }
    return this.catalogService.publicPopularByCategory(limitPerCategory);
  }

  @Get('categories')
  listCategories() {
    return this.catalogService.publicListCategories();
  }

  @Get('publishing-houses')
  listPublishingHouses(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('q') q?: string,
  ) {
    return this.catalogService.publicListPublishingHouses(q, limit);
  }

  @Get('cities')
  listCities() {
    return this.catalogService.publicListCities();
  }

  @Get('authors')
  listAuthors(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('q') q?: string,
  ) {
    return this.catalogService.publicListAuthors(q, limit);
  }

  @Get('authors/:id/photo-url')
  async publicAuthorPhotoUrl(@Param('id') id: string) {
    return this.catalogService.publicGetAuthorPhotoUrl(id.trim());
  }

  @Get('authors/:id')
  getAuthor(@Param('id') id: string) {
    return this.catalogService.publicGetAuthor(id.trim());
  }

  @Get('categories/:id')
  getCategory(@Param('id') id: string) {
    return this.catalogService.publicGetCategory(id.trim());
  }

  @Get('publishing-houses/:id/authors')
  listAuthorsForPublishingHouse(@Param('id') id: string) {
    return this.catalogService.publicListAuthorsForPublishingHouse(id.trim());
  }

  @Get('publishing-houses/:id')
  getPublishingHouse(@Param('id') id: string) {
    return this.catalogService.publicGetPublishingHouse(id.trim());
  }

  @Get('books')
  listBooks(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('publishingHouseId') publishingHouseId?: string,
    @Query('cityId') cityId?: string,
    @Query('authorId') authorId?: string,
    @Query('hasCover') hasCover?: string,
  ) {
    const hasCoverFlag =
      hasCover === 'true' ? true : hasCover === 'false' ? false : undefined;
    return this.catalogService.publicListBooks(q, page, limit, {
      categoryId: categoryId?.trim() || undefined,
      publishingHouseId: publishingHouseId?.trim() || undefined,
      cityId: cityId?.trim() || undefined,
      authorId: authorId?.trim() || undefined,
      hasCover: hasCoverFlag,
    });
  }

  @Get('books/:id/availability')
  getAvailability(@Param('id') id: string) {
    return this.catalogService.publicGetBookAvailabilityOr404(id.trim());
  }

  @Get('books/:id/cover-url')
  async getCoverUrl(@Param('id') id: string) {
    return this.catalogService.publicGetCoverUrl(id.trim());
  }

  @Get('books/:id')
  getBook(@Param('id') id: string) {
    return this.catalogService.publicGetBook(id.trim());
  }
}
