import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './profile.entity';
import { AbstractRepository } from '@app/common';
import { DatabaseError, handleDatabaseError } from './utils/database.utils';
import { User } from './user.entity';

@Injectable()
export class ProfileRepository extends AbstractRepository<Profile> {
  protected readonly logger = new Logger(ProfileRepository.name);

  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>
  ) {
    super(profileRepository);
  }

   sanitizeProfile(profile: any): any {
    if (!profile) return null;
  
    const {name, gender, dateOfBirth, interestCategories, interests, photos, selfie, user,createdAt,updatedAt} = profile;
    return {
      ...(user && {
        user_id: user.id,
        phoneNumber: user.phoneNumber,
      }),
      name,
      dateOfBirth,
      gender,
      interestCategories,
      interests,
      photos,
      selfie,
      createdAt,
      updatedAt
    };
  }
  async findProfileByPhoneNumber(phoneNumber: string): Promise<Profile | null> {
    try {
      const profile = await this.profileRepository.findOne({
        where: { user: {
          phoneNumber,
        }},
        relations: ['user'],
      });
      return this.sanitizeProfile(profile)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      return handleDatabaseError(error);
    }
  }

  async findProfileByUserId(userId: string): Promise<Profile | null> {
    try {
      const profile =  await this.profileRepository.findOne({
        where: { user: { id: userId } }
      });
      return profile
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      return handleDatabaseError(error);
    }
  }

  async createEmptyProfile(user: User): Promise<Profile> {
    try {
      const profile = this.profileRepository.create({
        user,
        name: null,
        dateOfBirth: null,
        gender: null,
        interestCategories: [],
        interests: [],
        photos: [],
        selfie: null
      });
      return await this.profileRepository.save(profile);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      return handleDatabaseError(error);
    }
  }

  async updateProfile(userId: string, profileData: Partial<Profile>): Promise<Profile> {
    try {
      const profile = await this.findProfileByUserId(userId);
      if (!profile) {
        throw new DatabaseError(
          `Profile not found for user: ${userId}`,
          'PROFILE_NOT_FOUND',
          HttpStatus.NOT_FOUND
        );
      }
      Object.assign(profile, profileData);
      const updatedProfile = await this.profileRepository.save(profile);
      return this.sanitizeProfile(updatedProfile)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      return handleDatabaseError(error);
    }
  }

  async findProfilesWithUsers(ids?: string[]): Promise<{ user: User; profile: Profile | null }[]> {
    try {
      const query = this.profileRepository
        .createQueryBuilder('profile')
        .leftJoinAndSelect('profile.user', 'user');

      if (ids) {
        query.where('user.id IN (:...ids)', { ids });
      }

      const profiles = await query.getMany();
      
      if (ids && profiles.length !== ids.length) {
        const foundIds = new Set(profiles.map(p => p.user.id));
        const missingIds = ids.filter(id => !foundIds.has(id));
        throw new DatabaseError(
          `Users not found: ${missingIds.join(', ')}`,
          'USERS_NOT_FOUND',
          HttpStatus.NOT_FOUND
        );
      }

      return profiles.map(profile => ({
        user: profile.user,
        profile
      }));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      return handleDatabaseError(error);
    }
  }
} 