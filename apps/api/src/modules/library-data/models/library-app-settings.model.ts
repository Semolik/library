import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'library_app_settings', schema: 'public' })
export class LibraryAppSettingsModel {
  @PrimaryColumn({ type: 'smallint' })
  id: number;

  @Column({ type: 'int', name: 'default_loan_days' })
  defaultLoanDays: number;

  /** Штраф за каждый календарный день просрочки после льготного периода (целые рубли). */
  @Column({ type: 'int', name: 'fine_per_overdue_day', default: 10 })
  finePerOverdueDay: number;

  /** Дней после планового возврата без начисления штрафа. */
  @Column({ type: 'int', name: 'fine_grace_days', default: 0 })
  fineGraceDays: number;
}
