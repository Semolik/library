import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BookCopyModel } from './book-copy.model';
import { UserModel } from '../../user/models/user.model';
import { ReturnBookModel } from './return-book.model';
import { PaidRentFineModel } from './paid-rent-fine.model';

@Entity({ name: 'rented_books', schema: 'public' })
export class RentedBookModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'copy_id' })
  copyId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'rented_at' })
  rentedAt: Date;

  /** Плановая дата возврата (календарный день). */
  @Column({ type: 'date', name: 'due_date', nullable: true })
  dueDate: string | Date | null;

  /** Начислено штрафа по правилам библиотеки (обновляется cron и при оплате учитывается к доплате). */
  @Column({ type: 'int', name: 'accrued_fine_amount', default: 0 })
  accruedFineAmount: number;

  @Column({ type: 'timestamp', name: 'accrued_fine_updated_at', nullable: true })
  accruedFineUpdatedAt: Date | null;

  @ManyToOne(() => BookCopyModel, (bookCopy) => bookCopy.rents, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'copy_id', referencedColumnName: 'id' })
  copy: BookCopyModel;

  @ManyToOne(() => UserModel, (user) => user.rents, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserModel;

  @OneToOne(() => ReturnBookModel, (returnBook) => returnBook.rent)
  returnBook: ReturnBookModel | null;

  @OneToOne(() => PaidRentFineModel, (fine) => fine.rent)
  paidFine: PaidRentFineModel | null;
}
