import { Entity, Column, JoinColumn, Unique, OneToOne } from 'typeorm';
import { AbstractEntity } from '@app/common';
import { User } from './user.entity';
import { Gender } from './enums/gender.enum';

@Entity('user_profile')
@Unique(['user'])
export class Profile extends AbstractEntity {
  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ nullable: true })
  interestCategory: string;

  @Column('simple-array', { nullable: true })
  interests: string[];

  @Column('simple-array', { nullable: true })
  images: string[];

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
} 