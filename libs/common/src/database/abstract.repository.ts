import { Logger, NotFoundException } from '@nestjs/common';
import {
  Repository,
  DeepPartial,
  FindOptionsWhere,
  SaveOptions,
} from 'typeorm';
import { AbstractEntity } from './abstract.entity';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export abstract class AbstractRepository<T extends AbstractEntity> {
  protected abstract readonly logger: Logger;

  constructor(
    protected readonly repository: Repository<T>
  ) {}

  async create(
    entity: DeepPartial<T>,
    options?: SaveOptions,
  ): Promise<T> {
    const newEntity = this.repository.create(entity);
    return await this.repository.save(newEntity, options);
  }

  async findOne(filter: FindOptionsWhere<T>,select? : any): Promise<T> {
    const entity = await this.repository.findOne({ where: filter, select: select ? ["id", ...select] : undefined  });

    if (!entity) {
      this.logger.warn('Entity not found with filter:', filter);
    }

    return entity;
  }

  async findOneAndUpdate(
    id: any,
    updateData: QueryDeepPartialEntity<T>,
  ): Promise<T> {
    await this.repository.update(id, updateData);
    const updatedEntity = await this.repository.findOne({ where: { id } });

    if (!updatedEntity) {
      this.logger.warn(`Entity not found with ID:`, id);
    }

    return updatedEntity;
  }

  async upsert(
    filter: FindOptionsWhere<T>,
    entity: any,
  ): Promise<T> {
    const existingEntity: any = await this.repository.findOne({ where: filter });

    if (existingEntity) {
      await this.repository.update(existingEntity.id, entity);
      return this.repository.findOne({ where: { id: existingEntity.id } });
    } else {
      return await this.create(entity);
    }
  }

  async find(filter: FindOptionsWhere<T>,select? : any): Promise<T[]> {
    return await this.repository.find({ where: filter, select: select ? ["id", ...select] : undefined });
  }
}
