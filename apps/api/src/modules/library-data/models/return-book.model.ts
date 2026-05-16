import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { RentedBookModel } from './rented-book.model';

@Entity({ name: 'return_books', schema: 'public' })
export class ReturnBookModel {
  @PrimaryColumn({ type: 'uuid', name: 'rent_id' })
  rentId: string;

  @Column({ type: 'timestamp', name: 'returned_at' })
  returnedAt: Date;

  @OneToOne(() => RentedBookModel, (rent) => rent.returnBook, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rent_id', referencedColumnName: 'id' })
  rent: RentedBookModel;
}
