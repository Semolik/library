import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BookAuthorModel } from './book-author.model';

@Entity({ name: 'authors', schema: 'public' })
export class AuthorModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', name: 'first_name' })
  firstName: string;

  @Column({ type: 'text', name: 'last_name' })
  lastName: string;

  @Column({ type: 'text', name: 'middle_name', nullable: true })
  middleName: string | null;

  @OneToMany(() => BookAuthorModel, (bookAuthor) => bookAuthor.author)
  bookAuthors: BookAuthorModel[];
}
