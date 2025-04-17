import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '@app/common';

@Entity('user')
export class User extends AbstractEntity {
  @Column({ unique: true })
  phoneNumber: string;

  @Column()
  ip: string;

  @Column()
  userAgent: string;
}
