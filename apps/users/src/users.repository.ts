import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './user.entity';
import { Profile } from './profile.entity';
import { AbstractRepository } from '@app/common';
import { DatabaseError, handleDatabaseError } from './utils/database.utils';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class UserRepository extends AbstractRepository<User> {
  protected readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly profileRepository: ProfileRepository
  ) {
    super(userRepository);
  }

  async createOrFetchProfile(userData: Partial<User>): Promise<any> {
    try {
      const existingProfile = await this.profileRepository.findProfileByPhoneNumber(userData.phoneNumber);
      if (existingProfile) {
        return {
          user: existingProfile,
          returningUser: true
        };
      }
      const user = this.userRepository.create(userData);
      const savedUser = await this.userRepository.save(user);
      if(!savedUser){
        throw new DatabaseError("Failed to create the user",
        "USER_CREATION_FAILED",
        HttpStatus.INTERNAL_SERVER_ERROR)
      }
      await this.profileRepository.createEmptyProfile(savedUser);

      const {id, phoneNumber, createdAt, updatedAt} = savedUser;
      
      return {
        user: {
        user_id: id,phoneNumber,createdAt,updatedAt
        },
        returningUser: false
      };
    } catch (error) {
      return handleDatabaseError(error);
    }
  }

  async findUsers(ids?: string[], select?: string[]): Promise<User[]> {
    try {
      const where = ids ? { id: In(ids) } : {};
      const options = select ? { select: select as (keyof User)[] } : {};
      const users = await this.userRepository.find({ where, ...options });
      
      if (ids && users.length !== ids.length) {
        const foundIds = new Set(users.map(user => user.id));
        const missingIds = ids.filter(id => !foundIds.has(id));
        throw new DatabaseError(
          `Users not found: ${missingIds.join(', ')}`,
          'USERS_NOT_FOUND',
          HttpStatus.NOT_FOUND
        );
      }
      
      return users;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      return handleDatabaseError(error);
    }
  }

  async findUsersWithProfiles(ids?: string[]): Promise<{ user: User; profile: Profile | null }[]> {
    try {
      return await this.profileRepository.findProfilesWithUsers(ids);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      return handleDatabaseError(error);
    }
  }
}
