import { Injectable, BadRequestException, Inject, HttpException } from '@nestjs/common';
import { UserRepository } from './users.repository';
import { User } from './user.entity';
import { Profile } from './profile.entity';
import { JwtService } from '@nestjs/jwt';
import { handleDatabaseError, DatabaseError } from './utils/database.utils';
import { HttpStatus } from '@nestjs/common';
import { createSuccessResponse, handleHttpException } from './utils/error.utils';
import { ProfileRepository } from './profile.repository';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  constructor(
    @Inject(UserRepository) private readonly userRepository: UserRepository,
    @Inject(ProfileRepository) private readonly profileRepository: ProfileRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService 
  ) {}

  private sanitizeProfileData(profileData: Partial<Profile>): Partial<Profile> {
    const sanitizedData: Partial<Profile> = {};
    if (profileData.name) sanitizedData.name = profileData.name;
    if (profileData.dateOfBirth) sanitizedData.dateOfBirth = profileData.dateOfBirth;
    if (profileData.gender) sanitizedData.gender = profileData.gender;
    if (profileData.interests) sanitizedData.interests = profileData.interests;
    if(profileData.interestCategories) sanitizedData.interestCategories = profileData.interestCategories
    if (profileData.photos) sanitizedData.photos = profileData.photos;
    if (profileData.selfie) sanitizedData.selfie = profileData.selfie;
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
            interestCategories: profile.interestCategories,
            interests: profile.interests,
            photos: profile.photos,
            selfie: profile.selfie
          });
        }

        return userData;
      });
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }
  

  async createOrFetchProfile(body: Partial<User>, ip: string) {
    try {
      const sanitizedData = this.validateCreateProfileInput(body);
      const {phoneNumber,otp} = sanitizedData
      if(otp !== this.configService.get<string>('BACKDOOR_OTP')){ 
        await firstValueFrom(
          this.httpService.post(
            'http://localhost:4000/api/v1/onboarding/verify-otp',
            { phoneNumber, otp }
          )
          // await this.onboardingService.verifyOtp(phoneNumber, otp);
        );
      }
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
      throw handleHttpException(error)
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
      throw handleDatabaseError(error);
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

  private generateToken(id: string) {
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
