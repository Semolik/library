import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayloadDto } from '@workspace/shared-types';
import { UpdateLibrarySettingsDto } from '@workspace/shared-types';
import { UserRepository } from '../../user/repositories/user.repository';
import { RentedBookModel } from '../../library-data/models/rented-book.model';
import { BookCopyRepository } from '../../library-catalog/repositories/book-copy.repository';
import { LibraryAppSettingsRepository } from '../repositories/library-app-settings.repository';
import { PaidRentFineRepository } from '../repositories/paid-rent-fine.repository';
import { RentedBookRepository } from '../repositories/rented-book.repository';
import { ReturnBookRepository } from '../repositories/return-book.repository';

@Injectable()
export class CirculationService {
  constructor(
    private readonly bookCopyRepository: BookCopyRepository,
    private readonly rentedBookRepository: RentedBookRepository,
    private readonly returnBookRepository: ReturnBookRepository,
    private readonly paidRentFineRepository: PaidRentFineRepository,
    private readonly libraryAppSettingsRepository: LibraryAppSettingsRepository,
    private readonly userRepository: UserRepository,
  ) {}

  getLibrarySettings() {
    return this.libraryAppSettingsRepository.getSingleton();
  }

  patchLibrarySettings(dto: UpdateLibrarySettingsDto) {
    if (
      dto.defaultLoanDays === undefined &&
      dto.finePerOverdueDay === undefined &&
      dto.fineGraceDays === undefined
    ) {
      throw new BadRequestException('Укажите хотя бы один параметр для сохранения.');
    }
    return this.libraryAppSettingsRepository.patchSettings({
      defaultLoanDays: dto.defaultLoanDays,
      finePerOverdueDay: dto.finePerOverdueDay,
      fineGraceDays: dto.fineGraceDays,
    });
  }

  async createRent(copyId: string, userId: string, dueDateInput?: string | null) {
    const copy = await this.bookCopyRepository.findByIdWithRents(copyId);
    if (!copy) {
      throw new NotFoundException('Экземпляр не найден.');
    }
    const active = copy.rents?.find((r) => !r.returnBook);
    if (active) {
      throw new ConflictException('Экземпляр уже выдан.');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден.');
    }

    let dueDate: string | null = null;
    const trimmed = dueDateInput?.trim();
    if (trimmed) {
      dueDate = CirculationService.parseDueDateOrThrow(trimmed);
    } else {
      const settings = await this.libraryAppSettingsRepository.getSingleton();
      dueDate = CirculationService.addCalendarDaysIsoLocal(new Date(), settings.defaultLoanDays);
    }

    const saved = await this.rentedBookRepository.create({ copyId, userId, dueDate });
    return CirculationService.mapRentResponse(saved);
  }

  async returnRent(rentId: string) {
    const rent = await this.rentedBookRepository.findById(rentId);
    if (!rent) {
      throw new NotFoundException('Выдача не найдена.');
    }
    const existing = await this.returnBookRepository.findByRentId(rentId);
    if (existing) {
      await this.accrueOverdueFines(new Date());
      return existing;
    }
    const created = await this.returnBookRepository.create({ rentId, returnedAt: new Date() });
    await this.accrueOverdueFines(new Date());
    return created;
  }

  async payFine(rentId: string, fineAmount: number) {
    await this.accrueOverdueFines(new Date());
    const rent = await this.rentedBookRepository.findByIdWithFineLedger(rentId);
    if (!rent) {
      throw new NotFoundException('Выдача не найдена.');
    }
    const accrued = rent.accruedFineAmount ?? 0;
    const paidSoFar = rent.paidFine?.fineAmount ?? 0;
    const outstanding = Math.max(0, accrued - paidSoFar);
    if (outstanding <= 0) {
      throw new BadRequestException('Нет задолженности по этой выдаче.');
    }
    if (fineAmount > outstanding) {
      throw new BadRequestException(`Сумма не может превышать долг ${outstanding} ₽.`);
    }
    const saved = await this.paidRentFineRepository.addPaidAmount(rentId, fineAmount, new Date());
    return {
      rentId,
      paidAmountThisTransaction: fineAmount,
      paidTotal: saved.fineAmount,
      outstandingAfter: Math.max(0, accrued - saved.fineAmount),
      accruedFineAmount: accrued,
      paidAt: saved.paidAt instanceof Date ? saved.paidAt.toISOString() : String(saved.paidAt),
    };
  }

  /** Пересчёт начислений по всем выдачам с датой возврата; число строк, где сумма изменилась. */
  async accrueOverdueFines(asOf: Date = new Date()): Promise<number> {
    const settings = await this.libraryAppSettingsRepository.getSingleton();
    const todayIso = CirculationService.toIsoDateLocal(asOf);
    const rents = await this.rentedBookRepository.findAllWithDueDateForAccrual();
    const updates: Array<{ id: string; accruedFineAmount: number; accruedFineUpdatedAt: Date }> =
      [];

    for (const rent of rents) {
      const dueIso = CirculationService.formatDueDate(rent.dueDate);
      if (!dueIso) {
        continue;
      }

      let endIso = todayIso;
      if (rent.returnBook?.returnedAt) {
        const retAt =
          rent.returnBook.returnedAt instanceof Date
            ? rent.returnBook.returnedAt
            : new Date(String(rent.returnBook.returnedAt));
        const retIso = CirculationService.toIsoDateLocal(retAt);
        endIso =
          CirculationService.compareIsoDates(retIso, todayIso) <= 0 ? retIso : todayIso;
      }

      const accrued = CirculationService.computeAccruedFineRub({
        dueDateIso: dueIso,
        graceDays: settings.fineGraceDays,
        rubPerDay: settings.finePerOverdueDay,
        endDateIso: endIso,
      });

      const prev = rent.accruedFineAmount ?? 0;
      if (prev !== accrued) {
        updates.push({
          id: rent.id,
          accruedFineAmount: accrued,
          accruedFineUpdatedAt: asOf,
        });
      }
    }

    await this.rentedBookRepository.updateAccruedFineBatch(updates);
    return updates.length;
  }

  async listFinesLedger() {
    await this.accrueOverdueFines(new Date());
    const rows = await this.rentedBookRepository.findAllFineLedgerRows();
    const items = rows.map((row) => CirculationService.mapFineLedgerRow(row));
    items.sort((a, b) => {
      const d = b.outstandingFineAmount - a.outstandingFineAmount;
      if (d !== 0) return d;
      return (b.accruedFineAmount ?? 0) - (a.accruedFineAmount ?? 0);
    });
    const summary = {
      count: items.length,
      outstandingTotalRub: items.reduce((s, x) => s + x.outstandingFineAmount, 0),
      accruedTotalRub: items.reduce((s, x) => s + x.accruedFineAmount, 0),
      paidTotalRub: items.reduce((s, x) => s + x.paidFineAmount, 0),
    };
    return { items, summary };
  }

  async getRentFineSnapshot(rentId: string, currentUser: JwtPayloadDto) {
    await this.accrueOverdueFines(new Date());
    const rent = await this.rentedBookRepository.findByIdWithFineLedger(rentId);
    if (!rent) {
      throw new NotFoundException('Выдача не найдена.');
    }
    if (!CirculationService.isLibraryStaff(currentUser.roles) && rent.userId !== currentUser.sub) {
      throw new ForbiddenException('Нет доступа к этой выдаче.');
    }
    return CirculationService.mapFineLedgerRow(rent);
  }

  /** История возвратов текущего пользователя (для личного кабинета). */
  async listRentHistoryForUser(userId: string) {
    await this.accrueOverdueFines(new Date());
    const rows = await this.rentedBookRepository.findReturnedHistoryForUser(userId);
    const items = rows.map((row) => CirculationService.mapFineLedgerRow(row));
    return { items };
  }

  private static isLibraryStaff(roles: string[] | undefined): boolean {
    const staff = new Set(['SUPERUSER', 'ADMIN', 'LIBRARIAN']);
    return Boolean(roles?.some((r) => staff.has(r)));
  }

  /**
   * Журнал книг на руках: активные выдачи с датой возврата и признаками просрочки / «скоро срок».
   */
  async listBorrowedBooks(filterUserId: string | undefined, soonDays: number) {
    await this.accrueOverdueFines(new Date());
    const rows = await this.rentedBookRepository.findAllActiveWithRelationsAndPaidFine(filterUserId);
    const today = new Date();

    type Urgency = 'overdue' | 'due_soon' | 'ok' | 'no_due_date';

    const items = rows.map((row) => {
      const dueDate = CirculationService.formatDueDate(row.dueDate);
      const rentedAt =
        row.rentedAt instanceof Date ? row.rentedAt.toISOString() : String(row.rentedAt);

      let daysUntilDue: number | null = null;
      let urgency: Urgency;

      if (!dueDate) {
        urgency = 'no_due_date';
      } else {
        daysUntilDue = CirculationService.calendarDaysDiffFromToday(today, dueDate);
        if (daysUntilDue < 0) {
          urgency = 'overdue';
        } else if (daysUntilDue <= soonDays) {
          urgency = 'due_soon';
        } else {
          urgency = 'ok';
        }
      }

      const copy = row.copy;
      const book = copy?.book;
      const storage = copy?.storage;
      const u = row.user;

      const accruedFineAmount = row.accruedFineAmount ?? 0;
      const paidFineAmount = row.paidFine?.fineAmount ?? 0;
      const outstandingFineAmount = Math.max(0, accruedFineAmount - paidFineAmount);

      return {
        rentId: row.id,
        copyId: row.copyId,
        bookId: book?.id ?? copy?.bookId ?? '',
        bookTitle: book?.title ?? 'Книга',
        inventoryNumber: copy?.inventoryNumber ?? '',
        storageName: storage?.name ?? '',
        userId: row.userId,
        userEmail: u?.email ?? '',
        userFirstName: u?.firstName ?? null,
        userLastName: u?.lastName ?? null,
        rentedAt,
        dueDate,
        daysUntilDue,
        urgency,
        accruedFineAmount,
        paidFineAmount,
        outstandingFineAmount,
      };
    });

    items.sort((a, b) => {
      const rank = (x: (typeof items)[0]): number =>
        x.urgency === 'overdue' ? 0 : x.urgency === 'due_soon' ? 1 : x.urgency === 'ok' ? 2 : 3;
      const dr = rank(a) - rank(b);
      if (dr !== 0) return dr;
      if (a.daysUntilDue !== null && b.daysUntilDue !== null) return a.daysUntilDue - b.daysUntilDue;
      if (a.daysUntilDue !== null) return -1;
      if (b.daysUntilDue !== null) return 1;
      return b.rentedAt.localeCompare(a.rentedAt);
    });

    const summary = {
      total: items.length,
      overdue: items.filter((i) => i.urgency === 'overdue').length,
      dueSoon: items.filter((i) => i.urgency === 'due_soon').length,
      ok: items.filter((i) => i.urgency === 'ok').length,
      noDueDate: items.filter((i) => i.urgency === 'no_due_date').length,
      soonDays,
      outstandingTotalRub: items.reduce((s, x) => s + x.outstandingFineAmount, 0),
    };

    return { items, summary };
  }

  private static mapFineLedgerRow(row: RentedBookModel) {
    const dueDate = CirculationService.formatDueDate(row.dueDate);
    const rentedAt =
      row.rentedAt instanceof Date ? row.rentedAt.toISOString() : String(row.rentedAt);
    const returnedAt = row.returnBook?.returnedAt
      ? row.returnBook.returnedAt instanceof Date
        ? row.returnBook.returnedAt.toISOString()
        : String(row.returnBook.returnedAt)
      : null;
    const copy = row.copy;
    const book = copy?.book;
    const storage = copy?.storage;
    const u = row.user;
    const accrued = row.accruedFineAmount ?? 0;
    const paid = row.paidFine?.fineAmount ?? 0;
    const outstanding = Math.max(0, accrued - paid);

    return {
      rentId: row.id,
      copyId: row.copyId,
      bookId: book?.id ?? copy?.bookId ?? '',
      bookTitle: book?.title ?? 'Книга',
      inventoryNumber: copy?.inventoryNumber ?? '',
      storageName: storage?.name ?? '',
      userId: row.userId,
      userEmail: u?.email ?? '',
      userFirstName: u?.firstName ?? null,
      userLastName: u?.lastName ?? null,
      rentedAt,
      dueDate,
      returnedAt,
      isActive: !row.returnBook,
      accruedFineAmount: accrued,
      paidFineAmount: paid,
      outstandingFineAmount: outstanding,
      paidAt: row.paidFine?.paidAt
        ? row.paidFine.paidAt instanceof Date
          ? row.paidFine.paidAt.toISOString()
          : String(row.paidFine.paidAt)
        : null,
      accruedFineUpdatedAt: row.accruedFineUpdatedAt
        ? row.accruedFineUpdatedAt instanceof Date
          ? row.accruedFineUpdatedAt.toISOString()
          : String(row.accruedFineUpdatedAt)
        : null,
    };
  }

  private static mapRentResponse(row: RentedBookModel): {
    id: string;
    copyId: string;
    userId: string;
    rentedAt: string;
    dueDate: string | null;
  } {
    const rentedAt =
      row.rentedAt instanceof Date ? row.rentedAt.toISOString() : String(row.rentedAt);
    return {
      id: row.id,
      copyId: row.copyId,
      userId: row.userId,
      rentedAt,
      dueDate: CirculationService.formatDueDate(row.dueDate),
    };
  }

  private static formatDueDate(value: string | Date | null | undefined): string | null {
    if (value == null || value === '') {
      return null;
    }
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return String(value).slice(0, 10);
  }

  private static parseDueDateOrThrow(raw: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      throw new BadRequestException('Некорректная дата возврата (ожидается YYYY-MM-DD).');
    }
    const parts = raw.split('-');
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
      throw new BadRequestException('Некорректная дата возврата.');
    }
    const check = new Date(y, m - 1, d);
    if (check.getFullYear() !== y || check.getMonth() !== m - 1 || check.getDate() !== d) {
      throw new BadRequestException('Некорректная дата возврата.');
    }
    return raw;
  }

  private static addCalendarDaysIsoLocal(from: Date, days: number): string {
    const base = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    base.setDate(base.getDate() + days);
    const y = base.getFullYear();
    const mo = String(base.getMonth() + 1).padStart(2, '0');
    const da = String(base.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }

  private static toIsoDateLocal(d: Date): string {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }

  private static compareIsoDates(a: string, b: string): number {
    if (a === b) return 0;
    return a < b ? -1 : 1;
  }

  private static addCalendarDaysIso(iso: string, deltaDays: number): string {
    const parts = iso.split('-').map(Number);
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    if (
      y === undefined ||
      m === undefined ||
      d === undefined ||
      !Number.isFinite(y) ||
      !Number.isFinite(m) ||
      !Number.isFinite(d)
    ) {
      return iso;
    }
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + deltaDays);
    return CirculationService.toIsoDateLocal(dt);
  }

  /** Число календарных дней начисления включительно от первого штрафного дня до конца периода. */
  private static inclusiveChargeDays(firstFineDayIso: string, endIso: string): number {
    if (CirculationService.compareIsoDates(endIso, firstFineDayIso) < 0) {
      return 0;
    }
    const partsA = firstFineDayIso.split('-').map(Number);
    const partsB = endIso.split('-').map(Number);
    const ay = partsA[0];
    const am = partsA[1];
    const ad = partsA[2];
    const by = partsB[0];
    const bm = partsB[1];
    const bd = partsB[2];
    if (
      ay === undefined ||
      am === undefined ||
      ad === undefined ||
      by === undefined ||
      bm === undefined ||
      bd === undefined
    ) {
      return 0;
    }
    const start = new Date(ay, am - 1, ad).getTime();
    const end = new Date(by, bm - 1, bd).getTime();
    return Math.round((end - start) / 86400000) + 1;
  }

  private static computeAccruedFineRub(params: {
    dueDateIso: string;
    graceDays: number;
    rubPerDay: number;
    endDateIso: string;
  }): number {
    const { dueDateIso, graceDays, rubPerDay, endDateIso } = params;
    if (rubPerDay <= 0) {
      return 0;
    }
    const firstFine = CirculationService.addCalendarDaysIso(dueDateIso, graceDays + 1);
    const days = CirculationService.inclusiveChargeDays(firstFine, endDateIso);
    return days * rubPerDay;
  }

  /** Разница в календарных днях: положительно — день возврата позже «сегодня». */
  private static calendarDaysDiffFromToday(fromDate: Date, isoYyyyMmDd: string): number {
    const parts = isoYyyyMmDd.split('-');
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
      return 0;
    }
    const end = new Date(y, m - 1, d);
    const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    return Math.round((end.getTime() - start.getTime()) / 86400000);
  }
}
