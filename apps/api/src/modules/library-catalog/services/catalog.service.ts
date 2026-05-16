import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { MinioService } from '../../../common/minio/minio.service';
import { AuthorRepository } from '../repositories/author.repository';
import { BookAuthorRepository } from '../repositories/book-author.repository';
import { BookCopyRepository } from '../repositories/book-copy.repository';
import { BookRepository } from '../repositories/book.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { CityRepository } from '../repositories/city.repository';
import { PublishingHouseRepository } from '../repositories/publishing-house.repository';
import { StorageRepository } from '../repositories/storage.repository';
import { BookModel } from '../../library-data/models/book.model';
import { BookCopyModel } from '../../library-data/models/book-copy.model';

/**
 * SQLSTATE PostgreSQL: foreign_key_violation (ссылка на несуществующую строку).
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const PG_FOREIGN_KEY_VIOLATION = '23503';

@Injectable()
export class CatalogService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly publishingHouseRepository: PublishingHouseRepository,
    private readonly cityRepository: CityRepository,
    private readonly authorRepository: AuthorRepository,
    private readonly bookRepository: BookRepository,
    private readonly bookAuthorRepository: BookAuthorRepository,
    private readonly bookCopyRepository: BookCopyRepository,
    private readonly storageRepository: StorageRepository,
    private readonly minioService: MinioService,
  ) {}

  private static readonly BOOK_DESCRIPTION_MAX_LEN = 20000;

  private static normalizeBookDescription(
    value: string | null | undefined,
  ): string | null {
    if (value == null) {
      return null;
    }
    const t = String(value).trim();
    if (!t) {
      return null;
    }
    return t.slice(0, CatalogService.BOOK_DESCRIPTION_MAX_LEN);
  }

  createCategory(name: string) {
    return this.categoryRepository.create(name);
  }

  createPublishingHouse(name: string) {
    return this.publishingHouseRepository.create(name);
  }

  createCity(name: string) {
    return this.cityRepository.create(name);
  }

  createAuthor(firstName: string, lastName: string, middleName?: string | null) {
    return this.authorRepository.create({ firstName, lastName, middleName });
  }

  listCategories() {
    return this.categoryRepository.findAllOrderedWithBookCount();
  }

  listPublishingHouses(search?: string, opts?: { searchLimit?: number }) {
    const q = search?.trim();
    if (!q) {
      return this.publishingHouseRepository.findAllOrderedWithBookCount();
    }
    const lim = Math.min(50, Math.max(1, opts?.searchLimit ?? 20));
    return this.publishingHouseRepository.findOrderedWithBookCountSearch(q, lim);
  }

  listCities() {
    return this.cityRepository.findAllOrderedWithBookCount();
  }

  listAuthors(search?: string, opts?: { searchLimit?: number }) {
    const q = search?.trim();
    if (!q) {
      return this.authorRepository.findAllOrderedWithBookCount();
    }
    const lim = Math.min(50, Math.max(1, opts?.searchLimit ?? 20));
    return this.authorRepository.findOrderedWithBookCountSearch(q, lim);
  }

  async updateCategory(id: string, name: string) {
    const row = await this.categoryRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Категория не найдена.');
    }
    row.name = name;
    return this.categoryRepository.save(row);
  }

  async deleteCategory(id: string) {
    const row = await this.categoryRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Категория не найдена.');
    }
    const linked = await this.bookRepository.countByCategoryId(id);
    if (linked > 0) {
      throw new ConflictException(
        `Нельзя удалить категорию: с ней связано книг (${linked}). Сначала измените категорию у книг.`,
      );
    }
    await this.categoryRepository.deleteById(id);
  }

  async updatePublishingHouse(id: string, name: string) {
    const row = await this.publishingHouseRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Издательство не найдено.');
    }
    row.name = name;
    return this.publishingHouseRepository.save(row);
  }

  async deletePublishingHouse(id: string) {
    const row = await this.publishingHouseRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Издательство не найдено.');
    }
    const linked = await this.bookRepository.countByPublishingHouseId(id);
    if (linked > 0) {
      throw new ConflictException(
        `Нельзя удалить издательство: с ним связано книг (${linked}). Сначала измените данные у книг.`,
      );
    }
    await this.publishingHouseRepository.deleteById(id);
  }

  async updateCity(id: string, name: string) {
    const row = await this.cityRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Город не найден.');
    }
    row.name = name;
    return this.cityRepository.save(row);
  }

  async deleteCity(id: string) {
    const row = await this.cityRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Город не найден.');
    }
    const linked = await this.bookRepository.countByCityId(id);
    if (linked > 0) {
      throw new ConflictException(
        `Нельзя удалить город: с ним связано книг (${linked}). Сначала измените город издания у книг.`,
      );
    }
    await this.cityRepository.deleteById(id);
  }

  async updateAuthor(
    id: string,
    data: { firstName: string; lastName: string; middleName: string | null },
  ) {
    const row = await this.authorRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Автор не найден.');
    }
    row.firstName = data.firstName;
    row.lastName = data.lastName;
    row.middleName = data.middleName;
    return this.authorRepository.save(row);
  }

  async deleteAuthor(id: string) {
    const row = await this.authorRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Автор не найден.');
    }
    await this.minioService.removeAuthorObjects(id);
    await this.authorRepository.deleteById(id);
  }

  async markAuthorHasPhoto(authorId: string) {
    const row = await this.authorRepository.findById(authorId);
    if (!row) {
      throw new NotFoundException('Автор не найден.');
    }
    await this.authorRepository.setHasPhoto(authorId, true);
  }

  private async resolveAuthorPhotoUrl(authorId: string): Promise<{ url: string }> {
    const row = await this.authorRepository.findById(authorId);
    if (!row?.hasPhoto) {
      throw new NotFoundException('Портрет не найден.');
    }
    const objectName = await this.minioService.findAuthorPhotoObjectName(authorId);
    if (!objectName) {
      throw new NotFoundException('Портрет не найден.');
    }
    const url = await this.minioService.getPresignedUrl(objectName);
    return { url };
  }

  async listBooks(
    search?: string,
    page = 1,
    limit = 20,
    filters?: {
      categoryId?: string;
      publishingHouseId?: string;
      cityId?: string;
      authorId?: string;
      hasCover?: boolean;
    },
  ) {
    const safeLimit = Math.min(5000, Math.max(1, limit));
    const safePage = Math.max(1, page);
    const { items, total } = await this.bookRepository.findManyListedPaged(
      search,
      safePage,
      safeLimit,
      filters,
    );
    return {
      items: items.map((b) => CatalogService.mapBookDetailResponse(b, { forList: true })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async createBook(data: {
    categoryId: string;
    publishingHouseId: string;
    cityId: string;
    title: string;
    publicationYear: number;
    pages: number;
    isbn: string;
    description?: string | null;
    authorIds: string[];
  }) {
    const descriptionNorm = CatalogService.normalizeBookDescription(
      data.description,
    );
    const book = await this.bookRepository.insert({
      categoryId: data.categoryId,
      publishingHouseId: data.publishingHouseId,
      cityId: data.cityId,
      title: data.title,
      publicationYear: data.publicationYear,
      pages: data.pages,
      isbn: data.isbn,
      description: descriptionNorm,
    });

    if (data.authorIds.length > 0) {
      await this.bookAuthorRepository.saveManyForBook(book.id, data.authorIds);
    }

    return this.getBook(book.id);
  }

  async updateBook(
    id: string,
    data: {
      categoryId?: string;
      publishingHouseId?: string;
      cityId?: string;
      title?: string;
      publicationYear?: number;
      pages?: number;
      isbn?: string;
      description?: string | null;
      authorIds?: string[];
    },
  ) {
    const book = await this.bookRepository.findOneById(id);
    if (!book) {
      throw new NotFoundException('Книга не найдена.');
    }

    if (data.categoryId !== undefined) {
      book.categoryId = data.categoryId;
    }
    if (data.publishingHouseId !== undefined) {
      book.publishingHouseId = data.publishingHouseId;
    }
    if (data.cityId !== undefined) {
      book.cityId = data.cityId;
    }
    if (data.title !== undefined) {
      book.title = data.title;
    }
    if (data.publicationYear !== undefined) {
      book.publicationYear = data.publicationYear;
    }
    if (data.pages !== undefined) {
      book.pages = data.pages;
    }
    if (data.isbn !== undefined) {
      book.isbn = data.isbn;
    }
    if (data.description !== undefined) {
      book.description = CatalogService.normalizeBookDescription(data.description);
    }

    await this.bookRepository.save(book);

    if (data.authorIds !== undefined) {
      await this.bookAuthorRepository.deleteByBookId(id);
      if (data.authorIds.length > 0) {
        await this.bookAuthorRepository.saveManyForBook(id, data.authorIds);
      }
    }

    return this.getBook(id);
  }

  async deleteBook(id: string) {
    const book = await this.bookRepository.findOneById(id);
    if (!book) {
      throw new NotFoundException('Книга не найдена.');
    }

    const copies = await this.bookCopyRepository.countByBookId(id);
    if (copies > 0) {
      throw new ConflictException(
        'Нельзя удалить книгу: есть экземпляры в каталоге. Сначала удалите или перенесите экземпляры.',
      );
    }

    await this.minioService.removeBookObjects(id);
    await this.bookRepository.deleteById(id);
  }

  async getBook(id: string) {
    const book = await this.bookRepository.findByIdWithFullRelations(id);
    if (!book) {
      throw new NotFoundException('Книга не найдена.');
    }
    return CatalogService.mapBookDetailResponse(book);
  }

  async markBookHasCover(bookId: string) {
    const book = await this.bookRepository.findByIdWithFullRelations(bookId);
    if (!book) {
      throw new NotFoundException('Книга не найдена.');
    }
    await this.bookRepository.setHasCover(bookId, true);
    const updated = await this.bookRepository.findByIdWithFullRelations(bookId);
    if (!updated) {
      throw new NotFoundException('Книга не найдена.');
    }
    return CatalogService.mapBookDetailResponse(updated);
  }

  createStorage(name: string) {
    return this.storageRepository.create(name);
  }

  listStorages() {
    return this.storageRepository.findAllOrderedWithBookCount();
  }

  async updateStorage(id: string, name: string) {
    const row = await this.storageRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Зал хранения не найден.');
    }
    row.name = name;
    return this.storageRepository.save(row);
  }

  async deleteStorage(id: string) {
    const row = await this.storageRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Зал хранения не найден.');
    }
    const linked = await this.bookCopyRepository.countByStorageId(id);
    if (linked > 0) {
      throw new ConflictException(
        `Нельзя удалить зал: в нём числятся экземпляры книг (${linked}). Сначала перенесите или удалите экземпляры.`,
      );
    }
    await this.storageRepository.deleteById(id);
  }

  async listBookCopies() {
    const rows = await this.bookCopyRepository.findAllWithBookStorageAndRents();
    return rows.map((copy) => this.mapBookCopyToListItem(copy));
  }

  private mapBookCopyToListItem(copy: BookCopyModel) {
    const activeRent = copy.rents?.find((r) => !r.returnBook) ?? null;
    return {
      id: copy.id,
      bookId: copy.bookId,
      storageId: copy.storageId,
      inventoryNumber: copy.inventoryNumber,
      book: CatalogService.mapBookForBookCopyList(copy.book),
      storage: copy.storage ? { id: copy.storage.id, name: copy.storage.name } : undefined,
      activeRent: activeRent
        ? {
            rentId: activeRent.id,
            rentedAt:
              activeRent.rentedAt instanceof Date
                ? activeRent.rentedAt.toISOString()
                : String(activeRent.rentedAt),
            dueDate: CatalogService.formatDueDate(activeRent.dueDate),
            user: {
              id: activeRent.user.id,
              email: activeRent.user.email,
              firstName: activeRent.user.firstName,
              lastName: activeRent.user.lastName,
            },
          }
        : null,
    };
  }

  async updateBookCopy(id: string, storageId: string, inventoryNumber: string) {
    const inv = inventoryNumber?.trim() ?? '';
    if (!inv) {
      throw new BadRequestException('Укажите инвентарный номер.');
    }
    if (!storageId?.trim()) {
      throw new BadRequestException('Укажите зал хранения.');
    }
    const storage = await this.storageRepository.findById(storageId);
    if (!storage) {
      throw new NotFoundException('Зал хранения не найден.');
    }
    const copy = await this.bookCopyRepository.findOneWithBookStorageAndRents(id);
    if (!copy) {
      throw new NotFoundException('Экземпляр не найден.');
    }
    if (await this.bookCopyRepository.existsByInventoryNumberLooseExcept(inv, id)) {
      throw new ConflictException('Экземпляр с таким инвентарным номером уже есть.');
    }
    copy.storageId = storageId;
    copy.inventoryNumber = inv;
    await this.bookCopyRepository.save(copy);
    const reloaded = await this.bookCopyRepository.findOneWithBookStorageAndRents(id);
    if (!reloaded) {
      throw new NotFoundException('Экземпляр не найден.');
    }
    return this.mapBookCopyToListItem(reloaded);
  }

  async deleteBookCopy(id: string): Promise<void> {
    const copy = await this.bookCopyRepository.findByIdWithRents(id);
    if (!copy) {
      throw new NotFoundException('Экземпляр не найден.');
    }
    const rents = copy.rents ?? [];
    if (rents.length > 0) {
      const active = rents.some((r) => !r.returnBook);
      if (active) {
        throw new ConflictException(
          'Нельзя удалить экземпляр с активной выдачей. Сначала оформите возврат.',
        );
      }
      throw new ConflictException(
        'Нельзя удалить экземпляр с историей выдачи: запись зарезервирована для учёта.',
      );
    }
    await this.bookCopyRepository.deleteById(id);
  }

  createBookCopy(bookId: string, storageId: string, inventoryNumber: string) {
    return this.bookCopyRepository.create({ bookId, storageId, inventoryNumber });
  }

  private static bookCopyImportRowMessage(err: unknown): string {
    if (err instanceof QueryFailedError) {
      const code = (err as { driverError?: { code?: string } }).driverError?.code;
      if (code === PG_FOREIGN_KEY_VIOLATION) {
        return 'Нарушение связи с книгой или залом (проверьте данные в строке).';
      }
    }
    if (err instanceof Error) return err.message;
    return 'Не удалось сохранить строку.';
  }

  private static readonly UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private static rowImportStr(v: unknown): string {
    if (v == null) return '';
    if (typeof v === 'string') return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) {
      return String(Math.trunc(v));
    }
    return String(v).trim();
  }

  private static rowImportYear(v: unknown): number | null {
    if (v == null || v === '') return null;
    if (typeof v === 'number' && Number.isFinite(v)) {
      return Math.trunc(v);
    }
    const n = parseInt(String(v).trim(), 10);
    return Number.isFinite(n) ? n : null;
  }

  private static normalizeIsbnForMatch(isbn: string): string {
    return isbn
      .toLowerCase()
      .replace(/[^0-9x]/g, '')
      .trim();
  }

  private static inventoryImportDedupKey(inventoryNumber: string): string {
    return inventoryNumber.trim().toLowerCase();
  }

  /**
   * Пакетное создание экземпляров по человекочитаемым полям экспорта (зал и книга — по справочнику)
   * либо по UUID (поля bookId, storageId) для обратной совместимости.
   * Повтор инвентарного номера: уже есть в БД или успешно импортирован из более ранней строки — пропуск без ошибки.
   */
  async importBookCopies(
    rows: Array<Record<string, unknown>>,
  ): Promise<{
    created: number;
    skipped: Array<{ row: number; message: string }>;
    errors: Array<{ row: number; message: string }>;
  }> {
    if (!Array.isArray(rows)) {
      throw new BadRequestException('Тело запроса должно содержать массив rows.');
    }
    if (rows.length === 0) {
      throw new BadRequestException('Передайте хотя бы одну строку для импорта.');
    }
    if (rows.length > 5000) {
      throw new BadRequestException('За один запрос можно импортировать не более 5000 строк.');
    }
    const errors: Array<{ row: number; message: string }> = [];
    const skipped: Array<{ row: number; message: string }> = [];
    let created = 0;
    const importedInventoryKeys = new Set<string>();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;

      let inventoryNumber = CatalogService.rowImportStr(r.inventoryNumber);
      if (!inventoryNumber && r.inv != null) {
        inventoryNumber = CatalogService.rowImportStr(r.inv);
      }

      let bookId = CatalogService.rowImportStr(r.bookId);
      let storageId = CatalogService.rowImportStr(r.storageId);

      const storageName = CatalogService.rowImportStr(r.storageName);
      const isbnRaw = CatalogService.rowImportStr(r.isbn);
      let bookTitle = CatalogService.rowImportStr(r.bookTitle);
      if (!bookTitle) bookTitle = CatalogService.rowImportStr(r.title);

      let publicationYear = CatalogService.rowImportYear(r.publicationYear);
      if (publicationYear == null) publicationYear = CatalogService.rowImportYear(r.year);

      if (!inventoryNumber) {
        errors.push({
          row: i + 1,
          message: 'Укажите inventoryNumber (инвентарный номер).',
        });
        continue;
      }

      const invKey = CatalogService.inventoryImportDedupKey(inventoryNumber);
      if (importedInventoryKeys.has(invKey)) {
        skipped.push({
          row: i + 1,
          message: `Номер «${inventoryNumber}» уже встречался выше в этом файле — повтор не добавлен.`,
        });
        continue;
      }

      if (!storageId || !CatalogService.UUID_RE.test(storageId)) {
        if (!storageName) {
          errors.push({
            row: i + 1,
            message: 'Укажите storageName (название зала) или storageId (UUID).',
          });
          continue;
        }
        const storages = await this.storageRepository.findByNameTrimmedCi(storageName);
        if (storages.length === 0) {
          errors.push({
            row: i + 1,
            message: `Зал «${storageName}» не найден.`,
          });
          continue;
        }
        if (storages.length > 1) {
          errors.push({
            row: i + 1,
            message: `Несколько залов с названием «${storageName}» — устраните неоднозначность в справочнике.`,
          });
          continue;
        }
        storageId = storages[0]!.id;
      }

      if (!bookId || !CatalogService.UUID_RE.test(bookId)) {
        const normIsbn = CatalogService.normalizeIsbnForMatch(isbnRaw);
        if (normIsbn) {
          const byIsbn = await this.bookRepository.findByNormalizedIsbn(normIsbn);
          if (byIsbn.length === 0) {
            errors.push({
              row: i + 1,
              message: `Книга с ISBN «${isbnRaw}» не найдена.`,
            });
            continue;
          }
          if (byIsbn.length > 1) {
            errors.push({
              row: i + 1,
              message: `Несколько книг с ISBN «${isbnRaw}» — уточните каталог.`,
            });
            continue;
          }
          bookId = byIsbn[0]!.id;
        } else if (bookTitle && publicationYear != null) {
          const byTitle = await this.bookRepository.findByTitleTrimmedCiAndYear(
            bookTitle,
            publicationYear,
          );
          if (byTitle.length === 0) {
            errors.push({
              row: i + 1,
              message: `Книга «${bookTitle}» (${publicationYear}) не найдена.`,
            });
            continue;
          }
          if (byTitle.length > 1) {
            errors.push({
              row: i + 1,
              message: `Несколько книг «${bookTitle}» за ${publicationYear} г. — уточните ISBN в файле.`,
            });
            continue;
          }
          bookId = byTitle[0]!.id;
        } else {
          errors.push({
            row: i + 1,
            message:
              'Укажите isbn или пару bookTitle + year/publicationYear, либо bookId (UUID).',
          });
          continue;
        }
      }

      if (await this.bookCopyRepository.existsByInventoryNumberLoose(inventoryNumber)) {
        skipped.push({
          row: i + 1,
          message: `Номер «${inventoryNumber}» уже есть в каталоге — дубликат не создан.`,
        });
        continue;
      }

      try {
        await this.bookCopyRepository.create({
          bookId,
          storageId,
          inventoryNumber,
        });
        created++;
        importedInventoryKeys.add(invKey);
      } catch (err) {
        errors.push({
          row: i + 1,
          message: CatalogService.bookCopyImportRowMessage(err),
        });
      }
    }
    return { created, skipped, errors };
  }

  /**
   * Стабильный JSON для карточки книги (админка и публичный каталог):
   * явные FK + вложенные справочники + авторы, без циклических relation tree (`copies.book` и т.п.).
   */
  private static mapBookDetailResponse(
    book: BookModel,
    options?: { forList?: boolean },
  ) {
    const bookAuthors = book.bookAuthors?.map((ba) => ({
      authorId: ba.authorId,
      author: ba.author
        ? {
            id: ba.author.id,
            firstName: ba.author.firstName,
            lastName: ba.author.lastName,
            middleName: ba.author.middleName,
            hasPhoto: ba.author.hasPhoto,
          }
        : undefined,
    }));

    const copyCount =
      typeof (book as BookModel & { copyCount?: number }).copyCount === 'number'
        ? (book as BookModel & { copyCount: number }).copyCount
        : (book.copies?.length ?? 0);

    const base = {
      id: book.id,
      categoryId: book.categoryId,
      publishingHouseId: book.publishingHouseId,
      cityId: book.cityId,
      title: book.title,
      publicationYear: book.publicationYear,
      pages: book.pages,
      isbn: book.isbn,
      hasCover: book.hasCover,
      copyCount,
      ...(book.category
        ? { category: { id: book.category.id, name: book.category.name } }
        : {}),
      ...(book.publishingHouse
        ? {
            publishingHouse: {
              id: book.publishingHouse.id,
              name: book.publishingHouse.name,
            },
          }
        : {}),
      ...(book.city ? { city: { id: book.city.id, name: book.city.name } } : {}),
      ...(bookAuthors?.length ? { bookAuthors } : {}),
    };

    if (options?.forList) {
      return base;
    }

    return {
      ...base,
      description:
        book.description != null && book.description.trim() !== ''
          ? book.description.trim()
          : null,
    };
  }

  private static mapBookForBookCopyList(book: BookModel | null | undefined) {
    if (!book) {
      return undefined;
    }
    const authors = book.bookAuthors
      ?.map((ba) => ba.author)
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
      .sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`,
          'ru',
        ),
      )
      .map((a) => ({
        id: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        middleName: a.middleName,
        hasPhoto: a.hasPhoto,
      }));
    return {
      id: book.id,
      title: book.title,
      publicationYear: book.publicationYear,
      pages: book.pages,
      isbn: book.isbn,
      hasCover: book.hasCover,
      ...(book.category
        ? { category: { id: book.category.id, name: book.category.name } }
        : {}),
      ...(book.publishingHouse
        ? {
            publishingHouse: {
              id: book.publishingHouse.id,
              name: book.publishingHouse.name,
            },
          }
        : {}),
      ...(book.city ? { city: { id: book.city.id, name: book.city.name } } : {}),
      ...(authors?.length ? { authors } : {}),
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

  // --- Публичный каталог (без JWT) --- //

  async publicListBooks(
    search?: string,
    page = 1,
    limit = 20,
    filters?: {
      categoryId?: string;
      publishingHouseId?: string;
      cityId?: string;
      authorId?: string;
      hasCover?: boolean;
    },
  ) {
    return this.listBooks(search, page, limit, filters);
  }

  async publicGetBook(id: string) {
    return this.getBook(id);
  }

  async publicGetCoverUrl(bookId: string) {
    const objectName = await this.minioService.findBookCoverObjectName(bookId);
    if (!objectName) {
      throw new NotFoundException('Обложка не найдена.');
    }
    const url = await this.minioService.getPresignedUrl(objectName);
    return { url };
  }

  publicGetBookAvailability(bookId: string) {
    return this.bookCopyRepository.findAvailabilityByBookGrouped(bookId);
  }

  async publicGetBookAvailabilityOr404(bookId: string) {
    const book = await this.bookRepository.findOneById(bookId);
    if (!book) {
      throw new NotFoundException('Книга не найдена.');
    }
    return this.bookCopyRepository.findAvailabilityByBookGrouped(bookId);
  }

  async publicPopularByCategory(limitPerCategory: number) {
    const safe = Math.min(20, Math.max(1, Math.floor(limitPerCategory)));
    const rows = await this.bookRepository.findPopularRowsByCategory(safe);
    const sectionMap = new Map<
      string,
      {
        category: { id: string; name: string };
        books: Array<{
          id: string;
          title: string;
          publicationYear: number;
          pages: number;
          isbn: string;
          hasCover: boolean;
          rentCount: number;
        }>;
      }
    >();
    for (const row of rows) {
      const cid = row.category_id;
      if (!sectionMap.has(cid)) {
        sectionMap.set(cid, {
          category: { id: cid, name: row.category_name },
          books: [],
        });
      }
      sectionMap.get(cid)!.books.push({
        id: row.book_id,
        title: row.title,
        publicationYear: row.publication_year,
        pages: row.pages,
        isbn: row.isbn,
        hasCover: row.has_cover,
        rentCount: Number(row.rent_count),
      });
    }
    return { sections: [...sectionMap.values()] };
  }

  publicListCategories() {
    return this.listCategories();
  }

  publicListPublishingHouses(q?: string, limit = 20) {
    const safe = Math.min(50, Math.max(1, Math.floor(limit)));
    return this.listPublishingHouses(q?.trim() || undefined, { searchLimit: safe });
  }

  publicListCities() {
    return this.listCities();
  }

  publicListAuthors(q?: string, limit = 20) {
    const safe = Math.min(50, Math.max(1, Math.floor(limit)));
    return this.listAuthors(q?.trim() || undefined, { searchLimit: safe });
  }

  async publicGetCategory(id: string) {
    const row = await this.categoryRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Категория не найдена.');
    }
    const bookCount = await this.bookRepository.countByCategoryId(id);
    return { id: row.id, name: row.name, bookCount };
  }

  async publicGetPublishingHouse(id: string) {
    const row = await this.publishingHouseRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Издательство не найдено.');
    }
    const bookCount = await this.bookRepository.countByPublishingHouseId(id);
    return { id: row.id, name: row.name, bookCount };
  }

  /** Авторы с книгами этого издательства (для публичной карточки издательства). */
  async publicListAuthorsForPublishingHouse(publishingHouseId: string) {
    await this.publicGetPublishingHouse(publishingHouseId);
    return this.authorRepository.findForPublishingHouseWithBookCount(
      publishingHouseId,
    );
  }

  async publicGetAuthor(id: string) {
    const row = await this.authorRepository.findByIdWithBookCount(id);
    if (!row) {
      throw new NotFoundException('Автор не найден.');
    }
    const withCount = row as typeof row & { bookCount?: number };
    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      middleName: row.middleName,
      hasPhoto: row.hasPhoto,
      bookCount: withCount.bookCount ?? 0,
    };
  }

  async publicGetAuthorPhotoUrl(authorId: string) {
    return this.resolveAuthorPhotoUrl(authorId);
  }

  getAuthorPhotoUrlForStaff(authorId: string) {
    return this.resolveAuthorPhotoUrl(authorId);
  }
}
