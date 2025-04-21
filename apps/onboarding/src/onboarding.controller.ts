import { Body, Controller, Post, Ip, HttpException, HttpStatus } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { handleHttpException } from './utils/error.utils';
import { DatabaseError } from './utils/database.utils';

@Controller('api/v1/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('send-otp')
  async sendOtp(@Body() data: { phoneNumber: string, appHash: string}, @Ip() ip: string) {
    try {
      if (!data.phoneNumber) {
        throw new HttpException({
          status: "ERROR",
          message: "Phone number is required",
          code: "MISSING_PHONE_NUMBER"
        }, HttpStatus.BAD_REQUEST);
      }

      if (!data.appHash) {
        throw new HttpException({
          status: "ERROR",
          message: "App hash is required",
          code: "MISSING_APP_HASH"
        }, HttpStatus.BAD_REQUEST);
      }

      if (!/^\+\d{2}[0-9]{10}$/.test(data.phoneNumber)) {
        throw new DatabaseError(
          "Invalid phone number format",
          "INVALID_PHONE_FORMAT",
          HttpStatus.BAD_REQUEST
        );
      }

      await this.onboardingService.sendOtp({ phoneNumber: data.phoneNumber, ip });
      return { status: "SUCCESS", message: 'OTP sent successfully' };
    } catch (error) {
      throw handleHttpException(error);
    }
  }

  @Post('verify-otp')
  async verifyOtp(@Body() data: { phoneNumber: string, otp: string }) {
    try {
      if (!data.phoneNumber || !data.otp) {
        throw new HttpException({
          status: "ERROR",
          message: "Phone number and OTP are required",
          code: "MISSING_REQUIRED_FIELDS",
        }, HttpStatus.BAD_REQUEST);
      }

      const result = await this.onboardingService.verifyOtp(data.phoneNumber, data.otp);
      return result;
    } catch (error) {
      throw handleHttpException(error);
    }
  }
}
