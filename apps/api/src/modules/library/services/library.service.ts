import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuthorModel,
  BookAuthorModel,
  BookCopyModel,
  BookModel,
  CategoryModel,
  CityModel,
  PaidRentFineModel,
  PublishingHouseModel,
  RentedBookModel,
  ReturnBookModel,
  StorageModel,
} from '../models';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(CategoryModel)
    private readonly categoryRepository: Repository<CategoryModel>,
    @InjectRepository(PublishingHouseModel)
    private readonly publishingHouseRepository: Repository<PublishingHouseModel>,
    @InjectRepository(CityModel)
    private readonly cityRepository: Repository<CityModel>,
    @InjectRepository(AuthorModel)
    private readonly authorRepository: Repository<AuthorModel>,
    @InjectRepository(BookModel)
    private readonly bookRepository: Repository<BookModel>,
    @InjectRepository(BookAuthorModel)
    private readonly bookAuthorRepository: Repository<BookAuthorModel>,
    @InjectRepository(BookCopyModel)
    private readonly bookCopyRepository: Repository<BookCopyModel>,
    @InjectRepository(StorageModel)
    private readonly storageRepository: Repository<StorageModel>,
    @InjectRepository(RentedBookModel)
    private readonly rentedBookRepository: Repository<RentedBookModel>,
    @InjectRepository(ReturnBookModel)
    private readonly returnBookRepository: Repository<ReturnBookModel>,
    @InjectRepository(PaidRentFineModel)
    private readonly paidRentFineRepository: Repository<PaidRentFineModel>,
  ) {}

  createCategory(name: string) {
    return this.categoryRepository.save(this.categoryRepository.create({ name }));
  }

  createPublishingHouse(name: string) {
    return this.publishingHouseRepository.save(this.publishingHouseRepository.create({ name }));
  }

  createCity(name: string) {
    return this.cityRepository.save(this.cityRepository.create({ name }));
  }

  createAuthor(firstName: string, lastName: string, middleName?: string | null) {
    return this.authorRepository.save(
      this.authorRepository.create({
        firstName,
        lastName,
        middleName: middleName ?? null,
      }),
    );
  }

  async createBook(data: {
    categoryId: string;
    publishingHouseId: string;
    cityId: string;
    title: string;
    publicationYear: number;
    pages: number;
    isbn: string;
    authorIds: string[];
  }) {
    const book = await this.bookRepository.save(
      this.bookRepository.create({
        categoryId: data.categoryId,
        publishingHouseId: data.publishingHouseId,
        cityId: data.cityId,
        title: data.title,
        publicationYear: data.publicationYear,
        pages: data.pages,
        isbn: data.isbn,
      }),
    );

    if (data.authorIds.length > 0) {
      await this.bookAuthorRepository.save(
        data.authorIds.map((authorId) =>
          this.bookAuthorRepository.create({ bookId: book.id, authorId }),
        ),
      );
    }

    return this.getBook(book.id);
  }

  async getBook(id: string) {
    const book = await this.bookRepository.findOne({
      where: { id },
      relations: [
        'category',
        'publishingHouse',
        'city',
        'bookAuthors',
        'bookAuthors.author',
        'copies',
      ],
    });
    if (!book) {
      throw new NotFoundException('Книга не найдена.');
    }
    return book;
  }

  async markBookHasCover(bookId: string) {
    const book = await this.getBook(bookId);
    book.hasCover = true;
    return this.bookRepository.save(book);
  }

  createStorage(name: string) {
    return this.storageRepository.save(this.storageRepository.create({ name }));
  }

  createBookCopy(bookId: string, storageId: string, inventoryNumber: string) {
    return this.bookCopyRepository.save(
      this.bookCopyRepository.create({ bookId, storageId, inventoryNumber }),
    );
  }

  createRent(copyId: string, userId: string) {
    return this.rentedBookRepository.save(this.rentedBookRepository.create({ copyId, userId }));
  }

  async returnRent(rentId: string) {
    const rent = await this.rentedBookRepository.findOne({ where: { id: rentId } });
    if (!rent) {
      throw new NotFoundException('Выдача не найдена.');
    }
    const existing = await this.returnBookRepository.findOne({ where: { rentId } });
    if (existing) {
      return existing;
    }
    return this.returnBookRepository.save(
      this.returnBookRepository.create({ rentId, returnedAt: new Date() }),
    );
  }

  async payFine(rentId: string, fineAmount: number) {
    const rent = await this.rentedBookRepository.findOne({ where: { id: rentId } });
    if (!rent) {
      throw new NotFoundException('Выдача не найдена.');
    }
    return this.paidRentFineRepository.save(
      this.paidRentFineRepository.create({ rentId, fineAmount, paidAt: new Date() }),
    );
  }
}
