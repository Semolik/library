import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { LibraryService } from '../services/library.service';
import { MinioService } from '../../../common/minio/minio.service';

@Controller('library')
export class LibraryController {
  constructor(
    private readonly libraryService: LibraryService,
    private readonly minioService: MinioService,
  ) {}

  @Post('categories')
  createCategory(@Body('name') name: string) {
    return this.libraryService.createCategory(name);
  }

  @Post('publishing-houses')
  createPublishingHouse(@Body('name') name: string) {
    return this.libraryService.createPublishingHouse(name);
  }

  @Post('cities')
  createCity(@Body('name') name: string) {
    return this.libraryService.createCity(name);
  }

  @Post('authors')
  createAuthor(
    @Body('firstName') firstName: string,
    @Body('lastName') lastName: string,
    @Body('middleName') middleName?: string,
  ) {
    return this.libraryService.createAuthor(firstName, lastName, middleName ?? null);
  }

  @Post('books')
  createBook(
    @Body('categoryId') categoryId: string,
    @Body('publishingHouseId') publishingHouseId: string,
    @Body('cityId') cityId: string,
    @Body('title') title: string,
    @Body('publicationYear', ParseIntPipe) publicationYear: number,
    @Body('pages', ParseIntPipe) pages: number,
    @Body('isbn') isbn: string,
    @Body('authorIds') authorIds: string[] = [],
  ) {
    return this.libraryService.createBook({
      categoryId,
      publishingHouseId,
      cityId,
      title,
      publicationYear,
      pages,
      isbn,
      authorIds,
    });
  }

  @Get('books/:id')
  getBook(@Param('id') id: string) {
    return this.libraryService.getBook(id);
  }

  @Post('storage')
  createStorage(@Body('name') name: string) {
    return this.libraryService.createStorage(name);
  }

  @Post('book-copies')
  createBookCopy(
    @Body('bookId') bookId: string,
    @Body('storageId') storageId: string,
    @Body('inventoryNumber') inventoryNumber: string,
  ) {
    return this.libraryService.createBookCopy(bookId, storageId, inventoryNumber);
  }

  @Post('rents')
  createRent(@Body('copyId') copyId: string, @Body('userId') userId: string) {
    return this.libraryService.createRent(copyId, userId);
  }

  @Post('rents/:id/return')
  returnRent(@Param('id') id: string) {
    return this.libraryService.returnRent(id);
  }

  @Post('rents/:id/fine')
  payFine(@Param('id') id: string, @Body('fineAmount', ParseIntPipe) fineAmount: number) {
    return this.libraryService.payFine(id, fineAmount);
  }

  @Post('books/:id/cover')
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
    await this.libraryService.markBookHasCover(id);
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
