import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { RentedBookModel } from '../../library-data/models/rented-book.model';

@Injectable()
export class RentedBookRepository {
  constructor(
    @InjectRepository(RentedBookModel)
    private readonly repo: Repository<RentedBookModel>,
  ) {}

  findById(id: string): Promise<RentedBookModel | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Активные выдачи (нет строки возврата), с книгой, залом и читателем. */
  findAllActiveWithRelations(filterUserId?: string): Promise<RentedBookModel[]> {
    const qb = this.repo
      .createQueryBuilder('rent')
      .innerJoinAndSelect('rent.copy', 'copy')
      .innerJoinAndSelect('copy.book', 'book')
      .innerJoinAndSelect('copy.storage', 'storage')
      .innerJoinAndSelect('rent.user', 'user')
      .leftJoin('rent.returnBook', 'ret')
      .where('ret.rent_id IS NULL');

    if (filterUserId?.trim()) {
      qb.andWhere('rent.user_id = :uid', { uid: filterUserId.trim() });
    }

    qb.addOrderBy('rent.due_date IS NULL', 'ASC').addOrderBy('rent.due_date', 'ASC').addOrderBy('rent.rented_at', 'DESC');

    return qb.getMany();
  }

  /** Активные выдачи с оплатой штрафа (для сумм «на руках»). */
  findAllActiveWithRelationsAndPaidFine(filterUserId?: string): Promise<RentedBookModel[]> {
    const qb = this.repo
      .createQueryBuilder('rent')
      .innerJoinAndSelect('rent.copy', 'copy')
      .innerJoinAndSelect('copy.book', 'book')
      .innerJoinAndSelect('copy.storage', 'storage')
      .innerJoinAndSelect('rent.user', 'user')
      .leftJoinAndSelect('rent.paidFine', 'paidFine')
      .leftJoin('rent.returnBook', 'ret')
      .where('ret.rent_id IS NULL');

    if (filterUserId?.trim()) {
      qb.andWhere('rent.user_id = :uid', { uid: filterUserId.trim() });
    }

    qb.addOrderBy('rent.due_date IS NULL', 'ASC').addOrderBy('rent.due_date', 'ASC').addOrderBy('rent.rented_at', 'DESC');

    return qb.getMany();
  }

  findByIdWithFineLedger(id: string): Promise<RentedBookModel | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        copy: { book: true, storage: true },
        user: true,
        returnBook: true,
        paidFine: true,
      },
    });
  }

  /** Выдачи с плановой датой возврата — для ежедневного пересчёта штрафа. */
  findAllWithDueDateForAccrual(): Promise<RentedBookModel[]> {
    return this.repo.find({
      where: { dueDate: Not(IsNull()) },
      relations: { returnBook: true },
    });
  }

  /** Журнал штрафов: есть начисление или была оплата. */
  findAllFineLedgerRows(): Promise<RentedBookModel[]> {
    return this.repo
      .createQueryBuilder('rent')
      .innerJoinAndSelect('rent.copy', 'copy')
      .innerJoinAndSelect('copy.book', 'book')
      .innerJoinAndSelect('copy.storage', 'storage')
      .innerJoinAndSelect('rent.user', 'user')
      .leftJoinAndSelect('rent.returnBook', 'returnBook')
      .leftJoinAndSelect('rent.paidFine', 'paidFine')
      .where('rent.accrued_fine_amount > 0 OR paidFine.rent_id IS NOT NULL')
      .orderBy('rent.accrued_fine_amount', 'DESC')
      .addOrderBy('rent.due_date', 'DESC')
      .getMany();
  }

  async updateAccruedFineBatch(
    updates: Array<{ id: string; accruedFineAmount: number; accruedFineUpdatedAt: Date }>,
  ): Promise<void> {
    if (updates.length === 0) {
      return;
    }
    await this.repo.manager.transaction(async (em) => {
      for (const u of updates) {
        await em.update(
          RentedBookModel,
          { id: u.id },
          {
            accruedFineAmount: u.accruedFineAmount,
            accruedFineUpdatedAt: u.accruedFineUpdatedAt,
          },
        );
      }
    });
  }

  create(params: {
    copyId: string;
    userId: string;
    dueDate: string | null;
  }): Promise<RentedBookModel> {
    return this.repo.save(this.repo.create(params));
  }

  /** Завершённые выдачи (есть возврат) для читателя — новее сверху. */
  findReturnedHistoryForUser(userId: string): Promise<RentedBookModel[]> {
    return this.repo
      .createQueryBuilder('rent')
      .innerJoinAndSelect('rent.copy', 'copy')
      .innerJoinAndSelect('copy.book', 'book')
      .innerJoinAndSelect('copy.storage', 'storage')
      .innerJoinAndSelect('rent.returnBook', 'returnBook')
      .leftJoinAndSelect('rent.paidFine', 'paidFine')
      .where('rent.user_id = :uid', { uid: userId })
      .orderBy('returnBook.returnedAt', 'DESC')
      .addOrderBy('rent.rentedAt', 'DESC')
      .getMany();
  }
}
