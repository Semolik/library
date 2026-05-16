import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ilikeContainsPattern } from '../../../common/utils/ilike-contains';
import { PublishingHouseModel } from '../../library-data/models/publishing-house.model';

@Injectable()
export class PublishingHouseRepository {
  constructor(
    @InjectRepository(PublishingHouseModel)
    private readonly repo: Repository<PublishingHouseModel>,
  ) {}

  create(name: string): Promise<PublishingHouseModel> {
    return this.repo.save(this.repo.create({ name }));
  }

  findAllOrderedByName(): Promise<PublishingHouseModel[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findAllOrderedWithBookCount(): Promise<PublishingHouseModel[]> {
    return this.repo
      .createQueryBuilder('publishingHouse')
      .loadRelationCountAndMap('publishingHouse.bookCount', 'publishingHouse.books')
      .orderBy('publishingHouse.name', 'ASC')
      .getMany();
  }

  findOrderedWithBookCountSearch(
    searchTrimmed: string,
    limit: number,
  ): Promise<PublishingHouseModel[]> {
    const pattern = ilikeContainsPattern(searchTrimmed);
    return this.repo
      .createQueryBuilder('publishingHouse')
      .loadRelationCountAndMap('publishingHouse.bookCount', 'publishingHouse.books')
      .where("publishingHouse.name ILIKE :pattern ESCAPE '\\'", {
        pattern,
      })
      .orderBy('publishingHouse.name', 'ASC')
      .take(limit)
      .getMany();
  }

  findById(id: string): Promise<PublishingHouseModel | null> {
    return this.repo.findOne({ where: { id } });
  }

  save(entity: PublishingHouseModel): Promise<PublishingHouseModel> {
    return this.repo.save(entity);
  }

  deleteById(id: string): Promise<void> {
    return this.repo.delete(id).then(() => undefined);
  }
}
