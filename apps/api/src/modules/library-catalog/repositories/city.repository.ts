import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CityModel } from '../../library-data/models/city.model';

@Injectable()
export class CityRepository {
  constructor(
    @InjectRepository(CityModel)
    private readonly repo: Repository<CityModel>,
  ) {}

  create(name: string): Promise<CityModel> {
    return this.repo.save(this.repo.create({ name }));
  }

  findAllOrderedByName(): Promise<CityModel[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findAllOrderedWithBookCount(): Promise<CityModel[]> {
    return this.repo
      .createQueryBuilder('city')
      .loadRelationCountAndMap('city.bookCount', 'city.books')
      .orderBy('city.name', 'ASC')
      .getMany();
  }

  findById(id: string): Promise<CityModel | null> {
    return this.repo.findOne({ where: { id } });
  }

  save(entity: CityModel): Promise<CityModel> {
    return this.repo.save(entity);
  }

  deleteById(id: string): Promise<void> {
    return this.repo.delete(id).then(() => undefined);
  }
}
