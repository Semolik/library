import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BookModel } from './book.model';

@Entity({ name: 'categories', schema: 'public' })
export class CategoryModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @OneToMany(() => BookModel, (book) => book.category)
  books: BookModel[];
}
