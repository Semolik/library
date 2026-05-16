import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BookCopyModel } from './book-copy.model';

@Entity({ name: 'storage', schema: 'public' })
export class StorageModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @OneToMany(() => BookCopyModel, (bookCopy) => bookCopy.storage)
  bookCopies: BookCopyModel[];
}
