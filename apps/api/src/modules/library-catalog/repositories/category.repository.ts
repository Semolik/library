import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryModel } from '../../library-data/models/category.model';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(CategoryModel)
    private readonly repo: Repository<CategoryModel>,
  ) {}

  create(name: string): Promise<CategoryModel> {
    return this.repo.save(this.repo.create({ name }));
  }

  findAllOrderedByName(): Promise<CategoryModel[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  /** Список с числом связанных книг (поле `bookCount` на сущности). */
  findAllOrderedWithBookCount(): Promise<CategoryModel[]> {
    return this.repo
      .createQueryBuilder('category')
      .loadRelationCountAndMap('category.bookCount', 'category.books')
      .orderBy('category.name', 'ASC')
      .getMany();
  }

  findById(id: string): Promise<CategoryModel | null> {
    return this.repo.findOne({ where: { id } });
  }

  save(entity: CategoryModel): Promise<CategoryModel> {
    return this.repo.save(entity);
  }

  deleteById(id: string): Promise<void> {
    return this.repo.delete(id).then(() => undefined);
  }
}
