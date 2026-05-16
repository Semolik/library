import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BookModel } from './book.model';

@Entity({ name: 'cities', schema: 'public' })
export class CityModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @OneToMany(() => BookModel, (book) => book.city)
  books: BookModel[];
}
