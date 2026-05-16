import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtPayloadDto } from '@workspace/shared-types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LibraryFavoritesService } from '../services/library-favorites.service';

@UseGuards(JwtAuthGuard)
@Controller('library/favorites')
export class LibraryFavoritesController {
  constructor(private readonly favoritesService: LibraryFavoritesService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayloadDto,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.favoritesService.listForUser(user.sub, page, limit);
  }

  @Get('check/:bookId')
  status(@CurrentUser() user: JwtPayloadDto, @Param('bookId') bookId: string) {
    return this.favoritesService
      .isFavorited(user.sub, bookId.trim())
      .then((favorited) => ({ favorited }));
  }

  @Post()
  add(@CurrentUser() user: JwtPayloadDto, @Body('bookId') bookId: string) {
    if (!bookId?.trim()) {
      throw new BadRequestException('Укажите книгу.');
    }
    return this.favoritesService.addFavorite(user.sub, bookId.trim());
  }

  @Delete(':bookId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtPayloadDto, @Param('bookId') bookId: string) {
    return this.favoritesService.removeFavorite(user.sub, bookId.trim());
  }
}
