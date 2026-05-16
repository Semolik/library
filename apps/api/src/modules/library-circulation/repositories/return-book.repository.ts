import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReturnBookModel } from '../../library-data/models/return-book.model';

@Injectable()
export class ReturnBookRepository {
  constructor(
    @InjectRepository(ReturnBookModel)
    private readonly repo: Repository<ReturnBookModel>,
  ) {}

  findByRentId(rentId: string): Promise<ReturnBookModel | null> {
    return this.repo.findOne({ where: { rentId } });
  }

  create(params: { rentId: string; returnedAt: Date }): Promise<ReturnBookModel> {
    return this.repo.save(this.repo.create(params));
  }
}
