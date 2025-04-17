import { Injectable, BadRequestException, Inject, HttpException } from '@nestjs/common';
import { UserRepository } from './users.repository';
import { User } from './user.entity';
import { Profile } from './profile.entity';
import { OnboardingService } from '../../onboarding/src/onboarding.service';
import { JwtService } from '@nestjs/jwt';
import { handleDatabaseError, DatabaseError } from './utils/database.utils';
import { HttpStatus } from '@nestjs/common';
import { createSuccessResponse, handleHttpException } from './utils/error.utils';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class UserService {
  constructor(
    @Inject(UserRepository) private readonly userRepository: UserRepository,
    @Inject(ProfileRepository) private readonly profileRepository: ProfileRepository,
    private readonly onboardingService: OnboardingService,
    private readonly jwtService: JwtService,
  ) {}

  private sanitizeProfileData(profileData: Partial<Profile>): Partial<Profile> {
    const sanitizedData: Partial<Profile> = {};
    if (profileData.name) sanitizedData.name = profileData.name;
    if (profileData.dateOfBirth) sanitizedData.dateOfBirth = profileData.dateOfBirth;
    if (profileData.gender) sanitizedData.gender = profileData.gender;
    if (profileData.interests) sanitizedData.interests = profileData.interests;
    if (profileData.imageUrls) sanitizedData.imageUrls = profileData.imageUrls;
    return sanitizedData;
  }

  async findUsersWithProfiles(ids?: string[], selectFields?: string[]): Promise<Array<Partial<User & Profile>>> {
    try {
      const users = await this.userRepository.findUsersWithProfiles(ids);
      return users.map(({ user, profile }) => {
        const userData: Partial<User & Profile> = {};

        (userData as any).id = user.id;
        if (selectFields) {
          selectFields.forEach(field => {
            if (field in user) {
              (userData as any)[field] = user[field as keyof User];
            }
          });
        } else {
          Object.assign(userData, {
            phoneNumber: user.phoneNumber,
            ip: user.ip,
            userAgent: user.userAgent
          });
        }

        if (profile) {
          Object.assign(userData, {
            name: profile.name,
            dateOfBirth: profile.dateOfBirth,
            gender: profile.gender,
            interests: profile.interests,
            imageUrls: profile.imageUrls
          });
        }

        return userData;
      });
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      return handleDatabaseError(error);
    }
  }
  

  async createOrFetchProfile(phoneNumber: string, ip: string, userAgent: string, otp: string) {
    try {
      this.validateCreateProfileInput(phoneNumber, ip, userAgent, otp);
    //   await this.onboardingService.verifyOtp(phoneNumber, otp);

    const {user,profile,returningUser} = await this.userRepository.createOrFetchProfile({phoneNumber,ip,userAgent})
    
      const token = this.generateToken(user);

      return createSuccessResponse({
        user,
        profile,
        returningUser,
        token
      },returningUser ? "User fetched successfully!" : "User created successfully")
      
    } catch (error) {
    console.log(error)
      if (error instanceof DatabaseError) {
        throw error;
      }
      else if(error instanceof HttpException){
        throw error
      }
      return handleDatabaseError(error);
    }
  }

  async updateProfile(profileData: Profile, userId: string) {
    try {
      const sanitizedData = this.sanitizeProfileData(profileData);
      const profile = await this.profileRepository.updateProfile(userId, sanitizedData);
      return {
        status: "SUCCESS",
        message: "Profile updated successfully",
        profile
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      return handleDatabaseError(error);
    }
  }


  async sendOtp(phoneNumber: string, ip: string, userAgent: string) {
    try {
      if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
        throw new DatabaseError(
          'Invalid phone number format',
          'INVALID_PHONE_FORMAT',
          HttpStatus.BAD_REQUEST
        );
      }

      let user: User;
      try {
        user = await this.userRepository.findOne({ phoneNumber });
        user.ip = ip;
        user.userAgent = userAgent;
        await this.userRepository.create(user);
      } catch (error) {
        if (error instanceof DatabaseError && error.getStatus() === HttpStatus.NOT_FOUND) {
          user = await this.userRepository.create({ phoneNumber, ip, userAgent });
        } else {
          throw error;
        }
      }

      return await this.onboardingService.sendOtp({ phoneNumber, ip });
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      return handleDatabaseError(error);
    }
  }

  private validateCreateProfileInput(phoneNumber: string, ip: string, userAgent: string, otp: string): void {
    if (!phoneNumber || !ip || !userAgent || !otp) {
      throw new BadRequestException({
        status: "ERROR",
        message: "All fields are required",
        code: "MISSING_REQUIRED_FIELDS",
        statusCode: 400
      });
    }

    if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
      throw new BadRequestException({
        status: "ERROR",
        message: "Invalid phone number format",
        code: "INVALID_PHONE_FORMAT",
        statusCode: 400
      });
    }
  }

  private generateToken(user: any): string {
    try {
      if (!user?.id) {
        throw new HttpException({
          status: "ERROR",
          message: 'User ID is required for token generation',
          code: 'MISSING_USER_ID',
          statusCode: HttpStatus.BAD_REQUEST
        }, HttpStatus.BAD_REQUEST);
      }
  
      const token = this.jwtService.sign({ 
        userId: user.id,
        phoneNumber: user.phoneNumber
      });
  
      if (!token) {
        throw new HttpException({
          status: "ERROR",
          message: 'Failed to generate token',
          code: 'TOKEN_GENERATION_FAILED',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  
      return token;
    } catch (error) {
      throw handleHttpException(error);
    }
  }
}
