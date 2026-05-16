import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RoleEnum } from '@workspace/shared-types';
import { MinioService } from '../../../common/minio/minio.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CatalogService } from '../services/catalog.service';

const CATALOG_ADMIN_ROLES = [RoleEnum.SUPERUSER, RoleEnum.ADMIN];

@UseGuards(JwtAuthGuard)
@Controller('library')
export class LibraryCatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly minioService: MinioService,
  ) {}

  @Get('categories')
  listCategories() {
    return this.catalogService.listCategories();
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  createCategory(@Body('name') name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Укажите название категории.');
    }
    return this.catalogService.createCategory(name.trim());
  }

  @Patch('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  updateCategory(@Param('id') id: string, @Body('name') name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Укажите название категории.');
    }
    return this.catalogService.updateCategory(id, name.trim());
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  deleteCategory(@Param('id') id: string) {
    return this.catalogService.deleteCategory(id);
  }

  @Get('publishing-houses')
  listPublishingHouses() {
    return this.catalogService.listPublishingHouses();
  }

  @Post('publishing-houses')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  createPublishingHouse(@Body('name') name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Укажите название издательства.');
    }
    return this.catalogService.createPublishingHouse(name.trim());
  }

  @Patch('publishing-houses/:id')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  updatePublishingHouse(@Param('id') id: string, @Body('name') name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Укажите название издательства.');
    }
    return this.catalogService.updatePublishingHouse(id, name.trim());
  }

  @Delete('publishing-houses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  deletePublishingHouse(@Param('id') id: string) {
    return this.catalogService.deletePublishingHouse(id);
  }

  @Get('cities')
  listCities() {
    return this.catalogService.listCities();
  }

  @Post('cities')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  createCity(@Body('name') name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Укажите название города.');
    }
    return this.catalogService.createCity(name.trim());
  }

  @Patch('cities/:id')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  updateCity(@Param('id') id: string, @Body('name') name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Укажите название города.');
    }
    return this.catalogService.updateCity(id, name.trim());
  }

  @Delete('cities/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  deleteCity(@Param('id') id: string) {
    return this.catalogService.deleteCity(id);
  }

  @Get('authors')
  listAuthors() {
    return this.catalogService.listAuthors();
  }

  @Get('authors/:id/photo-url')
  async getAuthorPhotoUrl(@Param('id') id: string) {
    return this.catalogService.getAuthorPhotoUrlForStaff(id.trim());
  }

  @Post('authors/:id/photo')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAuthorPhoto(
    @Param('id') id: string,
    @UploadedFile()
    file?: { originalname: string; mimetype: string; buffer: Buffer },
  ) {
    if (!file) {
      throw new BadRequestException('Файл обязателен.');
    }
    const objectName = await this.minioService.uploadAuthorPhoto(id.trim(), file);
    await this.catalogService.markAuthorHasPhoto(id.trim());
    const url = await this.minioService.getPresignedUrl(objectName);
    return { objectName, url };
  }

  @Post('authors')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  createAuthor(
    @Body('firstName') firstName: string,
    @Body('lastName') lastName: string,
    @Body('middleName') middleName?: string,
  ) {
    if (!firstName?.trim() || !lastName?.trim()) {
      throw new BadRequestException('Укажите имя и фамилию автора.');
    }
    return this.catalogService.createAuthor(
      firstName.trim(),
      lastName.trim(),
      middleName?.trim() ? middleName.trim() : null,
    );
  }

  @Patch('authors/:id')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  updateAuthor(
    @Param('id') id: string,
    @Body('firstName') firstName: string,
    @Body('lastName') lastName: string,
    @Body('middleName') middleName?: string | null,
  ) {
    if (!firstName?.trim() || !lastName?.trim()) {
      throw new BadRequestException('Укажите имя и фамилию автора.');
    }
    return this.catalogService.updateAuthor(id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleName: middleName?.trim() ? middleName.trim() : null,
    });
  }

  @Delete('authors/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  deleteAuthor(@Param('id') id: string) {
    return this.catalogService.deleteAuthor(id);
  }

  @Post('books')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  createBook(
    @Body('categoryId') categoryId: string,
    @Body('publishingHouseId') publishingHouseId: string,
    @Body('cityId') cityId: string,
    @Body('title') title: string,
    @Body('publicationYear', ParseIntPipe) publicationYear: number,
    @Body('pages', ParseIntPipe) pages: number,
    @Body('isbn') isbn: string,
    @Body('description') description?: string | null,
    @Body('authorIds') authorIds: string[] = [],
  ) {
    return this.catalogService.createBook({
      categoryId,
      publishingHouseId,
      cityId,
      title,
      publicationYear,
      pages,
      isbn,
      description: description ?? undefined,
      authorIds,
    });
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
    return this.catalogService.listBooks(q, page, limit, {
      categoryId: categoryId?.trim() || undefined,
      publishingHouseId: publishingHouseId?.trim() || undefined,
      cityId: cityId?.trim() || undefined,
      authorId: authorId?.trim() || undefined,
      hasCover: hasCoverFlag,
    });
  }

  @Get('books/:id')
  getBook(@Param('id') id: string) {
    return this.catalogService.getBook(id);
  }

  @Patch('books/:id')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  updateBook(
    @Param('id') id: string,
    @Body()
    body: {
      categoryId?: string;
      publishingHouseId?: string;
      cityId?: string;
      title?: string;
      publicationYear?: number;
      pages?: number;
      isbn?: string;
      description?: string | null;
      authorIds?: string[];
    },
  ) {
    return this.catalogService.updateBook(id, body);
  }

  @Delete('books/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  deleteBook(@Param('id') id: string) {
    return this.catalogService.deleteBook(id);
  }

  @Post('storage')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  createStorage(@Body('name') name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Укажите название зала.');
    }
    return this.catalogService.createStorage(name.trim());
  }

  @Get('storage')
  listStorages() {
    return this.catalogService.listStorages();
  }

  @Patch('storage/:id')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  updateStorage(@Param('id') id: string, @Body('name') name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Укажите название зала.');
    }
    return this.catalogService.updateStorage(id, name.trim());
  }

  @Delete('storage/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  deleteStorage(@Param('id') id: string) {
    return this.catalogService.deleteStorage(id);
  }

  @Get('book-copies')
  listBookCopies() {
    return this.catalogService.listBookCopies();
  }

  @Post('book-copies')
  createBookCopy(
    @Body('bookId') bookId: string,
    @Body('storageId') storageId: string,
    @Body('inventoryNumber') inventoryNumber: string,
  ) {
    return this.catalogService.createBookCopy(bookId, storageId, inventoryNumber);
  }

  @Patch('book-copies/:id')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  updateBookCopy(
    @Param('id') id: string,
    @Body('storageId') storageId: string,
    @Body('inventoryNumber') inventoryNumber: string,
  ) {
    return this.catalogService.updateBookCopy(id, storageId, inventoryNumber);
  }

  @Delete('book-copies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  deleteBookCopy(@Param('id') id: string) {
    return this.catalogService.deleteBookCopy(id);
  }

  @Post('book-copies/import')
  importBookCopies(@Body() body: { rows?: Record<string, unknown>[] }) {
    return this.catalogService.importBookCopies(body?.rows ?? []);
  }

  @Post('books/:id/cover')
  @UseGuards(RolesGuard)
  @Roles(...CATALOG_ADMIN_ROLES)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadCover(
    @Param('id') id: string,
    @UploadedFile()
    file?: { originalname: string; mimetype: string; buffer: Buffer },
  ) {
    if (!file) {
      throw new BadRequestException('Файл обязателен.');
    }
    const objectName = await this.minioService.uploadBookCover(id, file);
    await this.catalogService.markBookHasCover(id);
    const url = await this.minioService.getPresignedUrl(objectName);
    return { objectName, url };
  }

  @Get('books/:id/cover-url')
  async getCoverUrl(@Param('id') id: string) {
    const objectName = await this.minioService.findBookCoverObjectName(id);
    if (!objectName) {
      throw new NotFoundException('Обложка не найдена.');
    }
    const url = await this.minioService.getPresignedUrl(objectName);
    return { url };
  }
}
