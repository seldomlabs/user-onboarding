import { AbstractEntity } from '@app/common';
import { Entity, Column } from 'typeorm';

@Entity('user')
export class User extends AbstractEntity{

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({select: false})
  password: string;

  @Column()
  phoneNumber: string;

  @Column()
  gender: string;

  @Column()
  latitude: string;

  @Column()
  longitude: string;

  @Column("simple-array")
  interests: string[];

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column()
  ip: string

  @Column()
  matchRadius: number
}
