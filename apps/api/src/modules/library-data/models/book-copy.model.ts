import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BookModel } from './book.model';
import { StorageModel } from './storage.model';
import { RentedBookModel } from './rented-book.model';

@Entity({ name: 'book_copies', schema: 'public' })
export class BookCopyModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'book_id' })
  bookId: string;

  @Column({ type: 'uuid', name: 'storage_id' })
  storageId: string;

  @Column({ type: 'text', name: 'inventory_number' })
  inventoryNumber: string;

  @ManyToOne(() => BookModel, (book) => book.copies, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'book_id', referencedColumnName: 'id' })
  book: BookModel;

  @ManyToOne(() => StorageModel, (storage) => storage.bookCopies, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'storage_id', referencedColumnName: 'id' })
  storage: StorageModel;

  @OneToMany(() => RentedBookModel, (rentedBook) => rentedBook.copy)
  rents: RentedBookModel[];
}
