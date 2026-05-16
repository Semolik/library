import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookFavoriteModel } from '../../library-data/models/book-favorite.model';

@Injectable()
export class BookFavoriteRepository {
  constructor(
    @InjectRepository(BookFavoriteModel)
    private readonly repo: Repository<BookFavoriteModel>,
  ) {}

  findByUserWithBooksPage(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ rows: BookFavoriteModel[]; total: number }> {
    return this.repo
      .findAndCount({
        where: { userId },
        relations: {
          book: {
            category: true,
            publishingHouse: true,
            city: true,
            bookAuthors: { author: true },
          },
        },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      })
      .then(([rows, total]) => ({ rows, total }));
  }

  async exists(userId: string, bookId: string): Promise<boolean> {
    const n = await this.repo.count({ where: { userId, bookId } });
    return n > 0;
  }

  async add(userId: string, bookId: string): Promise<BookFavoriteModel> {
    return this.repo.save(this.repo.create({ userId, bookId }));
  }

  async remove(userId: string, bookId: string): Promise<void> {
    await this.repo.delete({ userId, bookId });
  }
}
