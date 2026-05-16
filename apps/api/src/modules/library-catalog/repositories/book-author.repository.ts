import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookAuthorModel } from '../../library-data/models/book-author.model';

@Injectable()
export class BookAuthorRepository {
  constructor(
    @InjectRepository(BookAuthorModel)
    private readonly repo: Repository<BookAuthorModel>,
  ) {}

  saveManyForBook(bookId: string, authorIds: string[]): Promise<BookAuthorModel[]> {
    if (authorIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.repo.save(
      authorIds.map((authorId) => this.repo.create({ bookId, authorId })),
    );
  }

  deleteByBookId(bookId: string): Promise<void> {
    return this.repo.delete({ bookId }).then(() => undefined);
  }
}
