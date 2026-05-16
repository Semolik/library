import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookModel } from '../../library-data/models/book.model';

const BOOK_FULL_RELATIONS = [
  'category',
  'publishingHouse',
  'city',
  'bookAuthors',
  'bookAuthors.author',
  'copies',
] as const;

@Injectable()
export class BookRepository {
  constructor(
    @InjectRepository(BookModel)
    private readonly repo: Repository<BookModel>,
  ) {}

  findByIdWithFullRelations(id: string): Promise<BookModel | null> {
    return this.repo.findOne({
      where: { id },
      relations: [...BOOK_FULL_RELATIONS],
    });
  }

  private listedBooksQueryBuilder(
    search?: string,
    filters?: {
      categoryId?: string;
      publishingHouseId?: string;
      cityId?: string;
      authorId?: string;
      hasCover?: boolean;
    },
  ) {
    const qb = this.repo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.category', 'category')
      .leftJoinAndSelect('book.publishingHouse', 'publishingHouse')
      .leftJoinAndSelect('book.city', 'city')
      .leftJoinAndSelect('book.bookAuthors', 'ba')
      .leftJoinAndSelect('ba.author', 'author')
      .loadRelationCountAndMap('book.copyCount', 'book.copies');

    const trimmed = search?.trim();
    if (trimmed) {
      const q = `%${trimmed}%`;
      qb.andWhere(
        '(book.title ILIKE :q OR book.isbn ILIKE :q OR book.description ILIKE :q)',
        { q },
      );
    }

    if (filters?.categoryId) {
      qb.andWhere('book.categoryId = :categoryId', { categoryId: filters.categoryId });
    }
    if (filters?.publishingHouseId) {
      qb.andWhere('book.publishingHouseId = :publishingHouseId', {
        publishingHouseId: filters.publishingHouseId,
      });
    }
    if (filters?.cityId) {
      qb.andWhere('book.cityId = :cityId', { cityId: filters.cityId });
    }
    if (filters?.authorId) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM public.books_authors ba_f WHERE ba_f.book_id = book.id AND ba_f.author_id = :authorId)`,
        { authorId: filters.authorId },
      );
    }
    if (filters?.hasCover !== undefined) {
      qb.andWhere('book.hasCover = :hasCover', { hasCover: filters.hasCover });
    }

    return qb.orderBy('book.title', 'ASC');
  }

  /** Постраничная выборка и общее число записей с теми же фильтрами. */
  async findManyListedPaged(
    search: string | undefined,
    page: number,
    pageSize: number,
    filters?: {
      categoryId?: string;
      publishingHouseId?: string;
      cityId?: string;
      authorId?: string;
      hasCover?: boolean;
    },
  ): Promise<{ items: BookModel[]; total: number }> {
    const qb = this.listedBooksQueryBuilder(search, filters);
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  insert(params: {
    categoryId: string;
    publishingHouseId: string;
    cityId: string;
    title: string;
    publicationYear: number;
    pages: number;
    isbn: string;
    description?: string | null;
  }): Promise<BookModel> {
    return this.repo.save(this.repo.create(params));
  }

  save(book: BookModel): Promise<BookModel> {
    return this.repo.save(book);
  }

  findOneById(id: string): Promise<BookModel | null> {
    return this.repo.findOne({ where: { id } });
  }

  /**
   * Поиск по ISBN без учёта дефисов, пробелов и регистра (в БД и в строке импорта).
   */
  findByNormalizedIsbn(normalized: string): Promise<BookModel[]> {
    const norm = normalized.trim().toLowerCase();
    if (!norm) {
      return Promise.resolve([]);
    }
    return this.repo
      .createQueryBuilder('b')
      .where(
        `regexp_replace(lower(trim(b.isbn)), '[^0-9x]', '', 'g') = :norm`,
        { norm },
      )
      .getMany();
  }

  findByTitleTrimmedCiAndYear(title: string, year: number): Promise<BookModel[]> {
    const t = title.trim();
    if (!t) {
      return Promise.resolve([]);
    }
    return this.repo
      .createQueryBuilder('b')
      .where('b.publicationYear = :year', { year })
      .andWhere('LOWER(TRIM(b.title)) = LOWER(TRIM(:title))', { title: t })
      .getMany();
  }

  deleteById(id: string): Promise<void> {
    return this.repo.delete(id).then(() => undefined);
  }

  setHasCover(bookId: string, hasCover: boolean): Promise<void> {
    return this.repo.update({ id: bookId }, { hasCover }).then(() => undefined);
  }

  countByCategoryId(categoryId: string): Promise<number> {
    return this.repo.count({ where: { categoryId } });
  }

  countByPublishingHouseId(publishingHouseId: string): Promise<number> {
    return this.repo.count({ where: { publishingHouseId } });
  }

  countByCityId(cityId: string): Promise<number> {
    return this.repo.count({ where: { cityId } });
  }

  /**
   * Топ книг по числу выдач (все записи rented_books, включая возвращённые) внутри каждой категории.
   * Только книги с rent_count > 0.
   */
  async findPopularRowsByCategory(limitPerCategory: number): Promise<
    Array<{
      book_id: string;
      title: string;
      publication_year: number;
      pages: number;
      isbn: string;
      has_cover: boolean;
      category_id: string;
      category_name: string;
      rent_count: number;
    }>
  > {
    return this.repo.manager.query(
      `
      WITH rent_counts AS (
        SELECT bc.book_id, COUNT(rb.id)::int AS rent_count
        FROM public.rented_books rb
        INNER JOIN public.book_copies bc ON bc.id = rb.copy_id
        GROUP BY bc.book_id
      ),
      ranked AS (
        SELECT
          b.id AS book_id,
          b.title,
          b.publication_year,
          b.pages,
          b.isbn,
          b.has_cover,
          b.category_id,
          c.name AS category_name,
          COALESCE(rc.rent_count, 0)::int AS rent_count,
          ROW_NUMBER() OVER (
            PARTITION BY b.category_id
            ORDER BY COALESCE(rc.rent_count, 0) DESC, b.title ASC
          ) AS rn
        FROM public.books b
        INNER JOIN public.categories c ON c.id = b.category_id
        LEFT JOIN rent_counts rc ON rc.book_id = b.id
        WHERE COALESCE(rc.rent_count, 0) > 0
      )
      SELECT book_id, title, publication_year, pages, isbn, has_cover, category_id, category_name, rent_count
      FROM ranked
      WHERE rn <= $1
      ORDER BY category_name ASC, rn ASC
      `,
      [limitPerCategory],
    );
  }
}
