import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { RentedBookModel } from './rented-book.model';

@Entity({ name: 'paid_rent_fines', schema: 'public' })
export class PaidRentFineModel {
  @PrimaryColumn({ type: 'uuid', name: 'rent_id' })
  rentId: string;

  @Column({ type: 'int', name: 'fine_amount' })
  fineAmount: number;

  @Column({ type: 'timestamp', name: 'paid_at' })
  paidAt: Date;

  @OneToOne(() => RentedBookModel, (rent) => rent.paidFine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rent_id', referencedColumnName: 'id' })
  rent: RentedBookModel;
}
