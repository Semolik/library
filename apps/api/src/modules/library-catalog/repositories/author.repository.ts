import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ilikeContainsPattern } from '../../../common/utils/ilike-contains';
import { AuthorModel } from '../../library-data/models/author.model';

@Injectable()
export class AuthorRepository {
  constructor(
    @InjectRepository(AuthorModel)
    private readonly repo: Repository<AuthorModel>,
  ) {}

  create(params: {
    firstName: string;
    lastName: string;
    middleName?: string | null;
  }): Promise<AuthorModel> {
    return this.repo.save(
      this.repo.create({
        firstName: params.firstName,
        lastName: params.lastName,
        middleName: params.middleName ?? null,
      }),
    );
  }

  findAllOrderedByName(): Promise<AuthorModel[]> {
    return this.repo.find({
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  /** Количество связей «книга–автор» (обычно совпадает с числом книг автора). */
  findAllOrderedWithBookCount(): Promise<AuthorModel[]> {
    return this.repo
      .createQueryBuilder('author')
      .loadRelationCountAndMap('author.bookCount', 'author.bookAuthors')
      .orderBy('author.lastName', 'ASC')
      .addOrderBy('author.firstName', 'ASC')
      .getMany();
  }

  /** Поиск по ФИО (публичный каталог, лимит результатов). */
  findOrderedWithBookCountSearch(
    searchTrimmed: string,
    limit: number,
  ): Promise<AuthorModel[]> {
    const pattern = ilikeContainsPattern(searchTrimmed);
    return this.repo
      .createQueryBuilder('author')
      .loadRelationCountAndMap('author.bookCount', 'author.bookAuthors')
      .where(
        `(
          author.lastName ILIKE :pattern ESCAPE '\\'
          OR author.firstName ILIKE :pattern ESCAPE '\\'
          OR author.middleName ILIKE :pattern ESCAPE '\\'
          OR CONCAT_WS(' ', author.lastName, author.firstName, COALESCE(author.middleName, '')) ILIKE :pattern ESCAPE '\\'
        )`,
        { pattern },
      )
      .orderBy('author.lastName', 'ASC')
      .addOrderBy('author.firstName', 'ASC')
      .take(limit)
      .getMany();
  }

  findById(id: string): Promise<AuthorModel | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByIdWithBookCount(id: string): Promise<AuthorModel | null> {
    return this.repo
      .createQueryBuilder('author')
      .loadRelationCountAndMap('author.bookCount', 'author.bookAuthors')
      .where('author.id = :id', { id })
      .getOne();
  }

  async setHasPhoto(id: string, hasPhoto: boolean): Promise<void> {
    await this.repo.update({ id }, { hasPhoto });
  }

  save(entity: AuthorModel): Promise<AuthorModel> {
    return this.repo.save(entity);
  }

  deleteById(id: string): Promise<void> {
    return this.repo.delete(id).then(() => undefined);
  }

  /**
   * Авторы, у которых есть хотя бы одна книга этого издательства, с числом таких книг.
   */
  async findForPublishingHouseWithBookCount(publishingHouseId: string): Promise<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      middleName: string | null;
      hasPhoto: boolean;
      booksAtPublisher: number;
    }>
  > {
    return this.repo.query(
      `
      SELECT
        a.id,
        a.first_name AS "firstName",
        a.last_name AS "lastName",
        a.middle_name AS "middleName",
        a.has_photo AS "hasPhoto",
        COUNT(DISTINCT b.id)::int AS "booksAtPublisher"
      FROM public.authors a
      INNER JOIN public.books_authors ba ON ba.author_id = a.id
      INNER JOIN public.books b ON b.id = ba.book_id AND b.publishing_house_id = $1
      GROUP BY a.id, a.first_name, a.last_name, a.middle_name, a.has_photo
      ORDER BY a.last_name ASC, a.first_name ASC
      `,
      [publishingHouseId],
    );
  }
}
