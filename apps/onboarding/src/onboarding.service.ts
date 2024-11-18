import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Twilio } from 'twilio';
import { RedisService } from '@app/common/redis/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OnboardingService {
  private readonly twilioClient: Twilio;
    constructor(
        private readonly redisClient: RedisService,
        private readonly configService: ConfigService
    ) { 
      this.twilioClient = new Twilio(
        this.configService.get<string>('TWILIO_ACCOUNT_SID'),
        this.configService.get<string>('TWILIO_AUTH_TOKEN')
      );
    }

    async sendOtp(data): Promise<void> {
      const {phoneNumber,ip} = data?.user || {}
      if(!phoneNumber || !ip){
        throw new BadRequestException('Unable to send the OTP, phoneNumber or IP are missing!');
      }
      try {
        await this.redisClient.ping(); // Assuming the RedisService has a ping() method
      } catch (err) {
        console.error('Redis connection error:', err);
        throw new InternalServerErrorException('Unable to connect to Redis server');
      }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        try {
            const otpRequestKey = `otp-requests:${ip + phoneNumber}`;
            const requestCount = await this.redisClient.incr(otpRequestKey);

            if (requestCount > 1) {
                throw new BadRequestException('Too many OTP requests. Please try again later.');
            }

            else {
                await this.redisClient.expire(otpRequestKey, 60 * 10); // 10 minutes
            }

            const key = `otp:${phoneNumber}`;
            await this.redisClient.set(key, otp, 300);

            // await this.twilioClient.messages.create({
            //     body: `Your verification code is ${otp}`,
            //     from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
            //     to: phoneNumber,
            // });
        } catch (err) {
          console.log(err)
            throw new BadRequestException('Unable to send the OTP',err);
        }
    }

    async verifyOtp(phoneNumber: string, otp: string): Promise<any> {
        const key = `otp:${phoneNumber}`;
        const storedOtp = await this.redisClient.get(key);

        if (!storedOtp) {
            throw new BadRequestException('OTP expired or invalid');
        }

        if (storedOtp !== otp) {
            throw new BadRequestException('Invalid OTP');
        }

        await this.redisClient.del(key);

        return {status: "SUCCESS", message: "OTP Verified successfully"};
    }
}
