import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserModel } from '../../user/models/user.model';
import { BookModel } from './book.model';

@Entity({ name: 'book_favorites', schema: 'public' })
@Unique('uq_book_favorites_user_book', ['userId', 'bookId'])
export class BookFavoriteModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'book_id' })
  bookId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserModel;

  @ManyToOne(() => BookModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id', referencedColumnName: 'id' })
  book: BookModel;
}
