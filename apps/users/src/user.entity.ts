import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '@app/common';

@Entity('user')
export class User extends AbstractEntity {

  @Column({ unique: true })
  phoneNumber: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  deviceId: string;

  @Column({ nullable: true })
  deviceType: string;

  @Column({ nullable: true })
  deviceModel: string;

  @Column({ nullable: true })
  os: string;

  @Column({ nullable: true })
  osVersion: string;

  @Column({ nullable: true })
  appVersion: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ nullable: true })
  locale: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  screenResolution: string;
}
