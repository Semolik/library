import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BookModel } from './book.model';
import { AuthorModel } from './author.model';

@Entity({ name: 'books_authors', schema: 'public' })
export class BookAuthorModel {
  @PrimaryColumn({ type: 'uuid', name: 'book_id' })
  bookId: string;

  @PrimaryColumn({ type: 'uuid', name: 'author_id' })
  authorId: string;

  @ManyToOne(() => BookModel, (book) => book.bookAuthors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id', referencedColumnName: 'id' })
  book: BookModel;

  @ManyToOne(() => AuthorModel, (author) => author.bookAuthors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id', referencedColumnName: 'id' })
  author: AuthorModel;
}
