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
    if(profileData.interestCategory) sanitizedData.interestCategory = profileData.interestCategory
    if (profileData.images) sanitizedData.images = profileData.images;
    return sanitizedData;
  }

  private sanitizeUserData(userData: any): any {
    const sanitizedData: any = {};
    if (userData.phoneNumber) sanitizedData.phoneNumber = userData.phoneNumber;
    if(userData.otp) sanitizedData.otp = userData.otp
    if (userData.ip) sanitizedData.ip = userData.ip;
    if (userData.userAgent) sanitizedData.userAgent = userData.userAgent;
  
    if (userData.deviceId) sanitizedData.deviceId = userData.deviceId;
    if (userData.deviceType) sanitizedData.deviceType = userData.deviceType;
    if (userData.deviceModel) sanitizedData.deviceModel = userData.deviceModel;
    if (userData.os) sanitizedData.os = userData.os;
    if (userData.osVersion) sanitizedData.osVersion = userData.osVersion;
    if (userData.appVersion) sanitizedData.appVersion = userData.appVersion;
    if (userData.manufacturer) sanitizedData.manufacturer = userData.manufacturer;
    if (userData.locale) sanitizedData.locale = userData.locale;
    if (userData.timezone) sanitizedData.timezone = userData.timezone;
    if (userData.screenResolution) sanitizedData.screenResolution = userData.screenResolution;
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
            interestCategory: profile.interestCategory,
            interests: profile.interests,
            images: profile.images
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
  

  async createOrFetchProfile(body: Partial<User>, ip: string) {
    try {
      const sanitizedData = this.validateCreateProfileInput(body);
    //   await this.onboardingService.verifyOtp(phoneNumber, otp);
    sanitizedData.ip = ip
    const {user,returningUser} = await this.userRepository.createOrFetchProfile(sanitizedData)
    
      const token = this.generateToken(user?.user_id);

      return createSuccessResponse({
        ...user,
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
      return createSuccessResponse({
        ...profile
      },"Profile updated successfully")
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      return handleDatabaseError(error);
    }
  }


  async sendOtp(phoneNumber: string, ip: string, userAgent: string) {
    try {
      if (!/^\+\d{2}[0-9]{10}$/.test(phoneNumber)) {
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

  private validateCreateProfileInput(body: Partial<User>): any {
    const sanitizedData = this.sanitizeUserData(body)
    const {phoneNumber, otp} = sanitizedData
    if (!phoneNumber || !otp) {
      throw new BadRequestException({
        status: "ERROR",
        message: "All fields are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    if (!/^\+\d{2}[0-9]{10}$/.test(phoneNumber)) {
      throw new BadRequestException({
        status: "ERROR",
        message: "Invalid phone number format",
        code: "INVALID_PHONE_FORMAT",
      });
    }
    return sanitizedData
  }

  private generateToken(id: string): string {
    try {
      if (!id) {
        throw new HttpException({
          status: "ERROR",
          message: 'User ID is required for token generation',
          code: 'MISSING_USER_ID',
        }, HttpStatus.BAD_REQUEST);
      }
  
      const token = this.jwtService.sign({ 
        id
      });
  
      if (!token) {
        throw new HttpException({
          status: "ERROR",
          message: 'Failed to generate token',
          code: 'TOKEN_GENERATION_FAILED',
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  
      return token;
    } catch (error) {
      throw handleHttpException(error);
    }
  }
}
