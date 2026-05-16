import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BookModel } from './book.model';

@Entity({ name: 'publishing_houses', schema: 'public' })
export class PublishingHouseModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @OneToMany(() => BookModel, (book) => book.publishingHouse)
  books: BookModel[];
}
