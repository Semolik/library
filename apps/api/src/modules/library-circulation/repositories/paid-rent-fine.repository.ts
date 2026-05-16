import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaidRentFineModel } from '../../library-data/models/paid-rent-fine.model';

@Injectable()
export class PaidRentFineRepository {
  constructor(
    @InjectRepository(PaidRentFineModel)
    private readonly repo: Repository<PaidRentFineModel>,
  ) {}

  findByRentId(rentId: string): Promise<PaidRentFineModel | null> {
    return this.repo.findOne({ where: { rentId } });
  }

  /** Добавляет сумму к уже учтённой оплате по этой выдаче (накопительный платёж). */
  async addPaidAmount(rentId: string, additionalAmount: number, paidAt: Date): Promise<PaidRentFineModel> {
    const existing = await this.findByRentId(rentId);
    if (!existing) {
      return this.repo.save(
        this.repo.create({
          rentId,
          fineAmount: additionalAmount,
          paidAt,
        }),
      );
    }
    existing.fineAmount += additionalAmount;
    existing.paidAt = paidAt;
    return this.repo.save(existing);
  }
}
