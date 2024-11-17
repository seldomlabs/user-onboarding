import { Body, Controller, Post } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { RmqService } from '@app/common/rmq/rmq.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ONBOARDING_DL_SERVICE, ONBOARDING_SERVICE } from './constants/service';

@Controller()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService,
    private readonly rmqService: RmqService,
  ) 
  {}

  @EventPattern('user_registered')
  async handleUserRegistration(@Payload() data: any, @Ctx() context: RmqContext) {
    const message = context.getMessage();
    // const retryCount = message.properties.headers['x-retry'] || 0; 
    // const maxRetries = 1;
    try{
    await this.onboardingService.sendOtp(data);
    this.rmqService.ack(context);
    }
    catch(err){
      console.log('Error handling user_registered event:', err);
      // if (retryCount < maxRetries) {
      //   const updatedHeaders = {
      //     ...message.properties.headers,
      //   'x-retry': retryCount + 1, 
      //   };
      //   await this.rmqService.republishWithRetry(context, updatedHeaders);
      // } else {
      //   console.error(
      //     `Max retries reached for message: ${JSON.stringify(data)}. Sending to DLQ.`,
      //   );
      //   await this.rmqService.sendToDLQ(ONBOARDING_DL_SERVICE,context);
      // }
    }
  }

  @Post('send-otp')
  async sendOtp(@Body() { phoneNumber }: { phoneNumber: string }) {
    try {
      await this.onboardingService.sendOtp({ phoneNumber });
      return {status: "SUCCESS", message: 'OTP sent successfully' };
    } catch (err) {
      throw err;
    }
  }


  @Post('verify-otp')
  async verifyOtp(@Body() { phoneNumber, otp }: { phoneNumber: string, otp: string }) {
    try{
    await this.onboardingService.verifyOtp(phoneNumber, otp);
    return { status: "SUCCESS", message: 'Phone number verified' };
    }
    catch(err){
        throw err
    }
  }


}
