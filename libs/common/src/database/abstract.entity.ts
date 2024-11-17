import { PrimaryGeneratedColumn, BaseEntity, Column, PrimaryColumn } from 'typeorm';

export abstract class AbstractEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string | number;
}
