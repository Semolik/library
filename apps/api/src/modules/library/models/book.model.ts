import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CategoryModel } from './category.model';
import { PublishingHouseModel } from './publishing-house.model';
import { CityModel } from './city.model';
import { BookAuthorModel } from './book-author.model';
import { BookCopyModel } from './book-copy.model';

@Entity({ name: 'books', schema: 'public' })
export class BookModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @Column({ type: 'uuid', name: 'publishing_house_id' })
  publishingHouseId: string;

  @Column({ type: 'uuid', name: 'city_id' })
  cityId: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'int', name: 'publication_year' })
  publicationYear: number;

  @Column({ type: 'int' })
  pages: number;

  @Column({ type: 'text', name: 'isbn' })
  isbn: string;

  @Column({ type: 'boolean', name: 'has_cover', default: false })
  hasCover: boolean;

  @ManyToOne(() => CategoryModel, (category) => category.books, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category: CategoryModel;

  @ManyToOne(() => PublishingHouseModel, (publishingHouse) => publishingHouse.books, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'publishing_house_id', referencedColumnName: 'id' })
  publishingHouse: PublishingHouseModel;

  @ManyToOne(() => CityModel, (city) => city.books, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'city_id', referencedColumnName: 'id' })
  city: CityModel;

  @OneToMany(() => BookAuthorModel, (bookAuthor) => bookAuthor.book)
  bookAuthors: BookAuthorModel[];

  @OneToMany(() => BookCopyModel, (bookCopy) => bookCopy.book)
  copies: BookCopyModel[];
}
