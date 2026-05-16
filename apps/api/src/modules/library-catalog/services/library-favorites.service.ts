import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BookFavoriteRepository } from '../repositories/book-favorite.repository';
import { BookRepository } from '../repositories/book.repository';
import { BookModel } from '../../library-data/models/book.model';

@Injectable()
export class LibraryFavoritesService {
  constructor(
    private readonly bookFavoriteRepository: BookFavoriteRepository,
    private readonly bookRepository: BookRepository,
  ) {}

  async listForUser(userId: string, page: number, limit: number) {
    const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
    const rawLimit = Number.isFinite(limit) ? Math.floor(limit) : 20;
    const safeLimit = Math.min(50, Math.max(1, rawLimit));
    const { rows, total } = await this.bookFavoriteRepository.findByUserWithBooksPage(
      userId,
      safePage,
      safeLimit,
    );
    return {
      items: rows.map((row) => ({
        favoriteId: row.id,
        bookId: row.bookId,
        addedAt:
          row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        book: row.book ? LibraryFavoritesService.mapBookBrief(row.book) : null,
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async isFavorited(userId: string, bookId: string): Promise<boolean> {
    return this.bookFavoriteRepository.exists(userId, bookId);
  }

  async addFavorite(userId: string, bookId: string): Promise<{ bookId: string; favorited: true }> {
    const book = await this.bookRepository.findOneById(bookId);
    if (!book) {
      throw new NotFoundException('Книга не найдена.');
    }
    if (await this.bookFavoriteRepository.exists(userId, bookId)) {
      throw new ConflictException('Книга уже в избранном.');
    }
    await this.bookFavoriteRepository.add(userId, bookId);
    return { bookId, favorited: true };
  }

  async removeFavorite(userId: string, bookId: string): Promise<void> {
    await this.bookFavoriteRepository.remove(userId, bookId);
  }

  private static mapBookBrief(book: BookModel) {
    const authors = book.bookAuthors
      ?.map((ba) => ba.author)
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
      .sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`,
          'ru',
        ),
      )
      .map((a) => ({
        id: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        middleName: a.middleName,
        hasPhoto: a.hasPhoto,
      }));
    return {
      id: book.id,
      title: book.title,
      publicationYear: book.publicationYear,
      pages: book.pages,
      isbn: book.isbn,
      hasCover: book.hasCover,
      ...(book.category
        ? { category: { id: book.category.id, name: book.category.name } }
        : {}),
      ...(book.publishingHouse
        ? { publishingHouse: { id: book.publishingHouse.id, name: book.publishingHouse.name } }
        : {}),
      ...(book.city ? { city: { id: book.city.id, name: book.city.name } } : {}),
      ...(authors?.length ? { authors } : {}),
    };
  }
}
