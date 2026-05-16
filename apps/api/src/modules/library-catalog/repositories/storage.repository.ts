import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageModel } from '../../library-data/models/storage.model';

@Injectable()
export class StorageRepository {
  constructor(
    @InjectRepository(StorageModel)
    private readonly repo: Repository<StorageModel>,
  ) {}

  create(name: string): Promise<StorageModel> {
    return this.repo.save(this.repo.create({ name }));
  }

  /** Список с числом экземпляров в зале (`bookCount` в ответе API). */
  findAllOrderedWithBookCount(): Promise<StorageModel[]> {
    return this.repo
      .createQueryBuilder('storage')
      .loadRelationCountAndMap('storage.bookCount', 'storage.bookCopies')
      .orderBy('storage.name', 'ASC')
      .getMany();
  }

  findById(id: string): Promise<StorageModel | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Точное совпадение имени без учёта регистра и пробелов по краям. */
  findByNameTrimmedCi(name: string): Promise<StorageModel[]> {
    const t = name.trim();
    if (!t) {
      return Promise.resolve([]);
    }
    return this.repo
      .createQueryBuilder('s')
      .where('LOWER(TRIM(s.name)) = LOWER(TRIM(:t))', { t })
      .getMany();
  }

  save(entity: StorageModel): Promise<StorageModel> {
    return this.repo.save(entity);
  }

  deleteById(id: string): Promise<void> {
    return this.repo.delete(id).then(() => undefined);
  }
}
