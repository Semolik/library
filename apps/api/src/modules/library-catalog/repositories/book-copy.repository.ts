import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookCopyModel } from '../../library-data/models/book-copy.model';

@Injectable()
export class BookCopyRepository {
  constructor(
    @InjectRepository(BookCopyModel)
    private readonly repo: Repository<BookCopyModel>,
  ) {}

  countByBookId(bookId: string): Promise<number> {
    return this.repo.count({ where: { bookId } });
  }

  countByStorageId(storageId: string): Promise<number> {
    return this.repo.count({ where: { storageId } });
  }

  create(params: {
    bookId: string;
    storageId: string;
    inventoryNumber: string;
  }): Promise<BookCopyModel> {
    return this.repo.save(this.repo.create(params));
  }

  /** Есть ли экземпляр с тем же инвентарным номером (без учёта регистра и пробелов по краям). */
  async existsByInventoryNumberLoose(inventoryNumber: string): Promise<boolean> {
    const t = inventoryNumber.trim();
    if (!t) {
      return false;
    }
    const key = t.toLowerCase();
    const cnt = await this.repo
      .createQueryBuilder('bc')
      .where('LOWER(TRIM(bc.inventoryNumber)) = :key', { key })
      .getCount();
    return cnt > 0;
  }

  /** То же, но игнорируем указанный экземпляр (для обновления записи). */
  async existsByInventoryNumberLooseExcept(
    inventoryNumber: string,
    exceptCopyId: string,
  ): Promise<boolean> {
    const t = inventoryNumber.trim();
    if (!t) {
      return false;
    }
    const key = t.toLowerCase();
    const cnt = await this.repo
      .createQueryBuilder('bc')
      .where('LOWER(TRIM(bc.inventoryNumber)) = :key', { key })
      .andWhere('bc.id != :exceptId', { exceptId: exceptCopyId })
      .getCount();
    return cnt > 0;
  }

  findOneWithBookStorageAndRents(id: string): Promise<BookCopyModel | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        book: {
          category: true,
          publishingHouse: true,
          city: true,
          bookAuthors: {
            author: true,
          },
        },
        storage: true,
        rents: {
          user: true,
          returnBook: true,
        },
      },
    });
  }

  save(copy: BookCopyModel): Promise<BookCopyModel> {
    return this.repo.save(copy);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  findByIdWithRents(id: string): Promise<BookCopyModel | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        rents: {
          returnBook: true,
        },
      },
    });
  }

  /** Выдачи с пользователем и фактом возврата — чтобы определить активную аренду. */
  findAllWithBookStorageAndRents(): Promise<BookCopyModel[]> {
    return this.repo.find({
      relations: {
        book: {
          category: true,
          publishingHouse: true,
          city: true,
          bookAuthors: {
            author: true,
          },
        },
        storage: true,
        rents: {
          user: true,
          returnBook: true,
        },
      },
      order: { inventoryNumber: 'ASC' },
    });
  }

  /**
   * По филиалам (залам): всего экземпляров и сколько сейчас в фонде (нет активной выдачи).
   */
  async findAvailabilityByBookGrouped(bookId: string): Promise<
    Array<{
      storageId: string;
      storageName: string;
      totalCopies: number;
      availableCopies: number;
    }>
  > {
    const rows: Array<{
      storageId: string;
      storageName: string;
      totalCopies: string;
      availableCopies: string;
    }> = await this.repo.query(
      `
      SELECT
        s.id AS "storageId",
        s.name AS "storageName",
        COUNT(bc.id)::int AS "totalCopies",
        COUNT(bc.id) FILTER (
          WHERE NOT EXISTS (
            SELECT 1
            FROM public.rented_books rb
            WHERE rb.copy_id = bc.id
              AND NOT EXISTS (
                SELECT 1 FROM public.return_books ret WHERE ret.rent_id = rb.id
              )
          )
        )::int AS "availableCopies"
      FROM public.book_copies bc
      INNER JOIN public.storage s ON s.id = bc.storage_id
      WHERE bc.book_id = $1
      GROUP BY s.id, s.name
      ORDER BY s.name ASC
      `,
      [bookId],
    );
    return rows.map((r) => ({
      storageId: r.storageId,
      storageName: r.storageName,
      totalCopies: Number(r.totalCopies),
      availableCopies: Number(r.availableCopies),
    }));
  }
}
