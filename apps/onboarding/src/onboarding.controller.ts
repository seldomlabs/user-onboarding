import { Body, Controller, Post, Ip, HttpException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { handleHttpException } from './utils/error.utils';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('send-otp')
  async sendOtp(@Body() data: { phoneNumber: string }, @Ip() ip: string) {
    try {
      if (!data.phoneNumber) {
        throw new HttpException({
          status: "ERROR",
          message: "Phone number is required",
          code: "MISSING_PHONE_NUMBER",
          statusCode: 400
        }, 400);
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
          statusCode: 400
        }, 400);
      }

      const result = await this.onboardingService.verifyOtp(data.phoneNumber, data.otp);
      return result;
    } catch (error) {
      throw handleHttpException(error);
    }
  }
}
