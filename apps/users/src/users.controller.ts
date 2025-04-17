import { Body, Controller, Get, HttpException, Post, Req, UseGuards, Headers, Ip, Query, InternalServerErrorException, Patch } from '@nestjs/common';
import { UserService } from './users.service';
import { JwtAuthGuard } from './jwt-auth-guard';
import { UserRequest } from './types/request.types';
import { handleHttpException, createSuccessResponse } from './utils/error.utils';
import { User } from './user.entity';
import { Profile } from './profile.entity';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  @Get()
  async getUsers(@Query('select') select?: string, @Query('ids') ids?: string) {
    try {
      let selectFields: string[] | undefined;
      let userIds: string[] | undefined;

      if (select) {
        try {
          selectFields = JSON.parse(select);
          if (!Array.isArray(selectFields)) {
            throw new Error('Select parameter must be a JSON array');
          }
        } catch (error) {
          throw new HttpException({
            status: "ERROR",
            message: "Invalid select parameter format",
            code: "INVALID_SELECT_FORMAT",
            statusCode: 400
          }, 400);
        }
      }

      if (ids) {
        try {
          userIds = JSON.parse(ids);
          if (!Array.isArray(userIds)) {
            throw new Error('Ids parameter must be a JSON array');
          }
        } catch (error) {
          throw new HttpException({
            status: "ERROR",
            message: "Invalid ids parameter format",
            code: "INVALID_IDS_FORMAT",
            statusCode: 400
          }, 400);
        }
      }

      const users = await this.userService.findUsersWithProfiles(userIds,selectFields);
      
      const userDetails = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      return {
        status: "SUCCESS",
        message: "User details fetched successfully",
        userDetails
      };
    } catch (error) {
      throw handleHttpException(error);
    }
  }

  @Post('create-profile')
  async createProfile(
    @Body() body: { phoneNumber: string, otp: string },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    return this.userService.createOrFetchProfile(
      body.phoneNumber,
      ip,
      userAgent,
      body.otp
    );
  }

  @Post('update-profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Body() profileData: Profile, @Req() request: UserRequest) {
    const user = request.user;
    return this.userService.updateProfile(profileData, user.id);
  }

  @Post('send-otp')
  async sendOtp(@Body() body: { phoneNumber: string }, @Ip() ip: string, @Headers('user-agent') userAgent: string) {
    try {
      if (!body.phoneNumber) {
        throw new HttpException({
          status: "ERROR",
          message: "Phone number is required",
          code: "MISSING_PHONE_NUMBER",
          statusCode: 400
        }, 400);
      }

      if (!userAgent) {
        throw new HttpException({
          status: "ERROR",
          message: "User agent is required",
          code: "MISSING_USER_AGENT",
          statusCode: 400
        }, 400);
      }

      const result = await this.userService.sendOtp(body.phoneNumber, ip, userAgent);
      return createSuccessResponse(result);
    } catch (error) {
      throw handleHttpException(error);
    }
  }
}
