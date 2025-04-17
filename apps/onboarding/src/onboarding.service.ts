import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';
import { RedisService } from '@app/common/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { DatabaseError } from './utils/database.utils';
import { HttpStatus } from '@nestjs/common';

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

  async sendOtp(data: { phoneNumber: string, ip: string }): Promise<void> {
    const { phoneNumber, ip } = data;
    
    if (!phoneNumber || !ip) {
      throw new DatabaseError(
        "Phone number and IP are required",
        "MISSING_REQUIRED_FIELDS",
        HttpStatus.BAD_REQUEST
      );
    }

    if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
      throw new DatabaseError(
        "Invalid phone number format",
        "INVALID_PHONE_FORMAT",
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      await this.redisClient.ping();
    } catch (err) {
      console.error('Redis connection error:', err);
      throw new DatabaseError(
        "Unable to connect to Redis server",
        "REDIS_CONNECTION_ERROR",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:${phoneNumber}`;
    const ttl = 300;

    try {
      await this.redisClient.set(key, JSON.stringify({ otp, ip }), ttl);
      // await this.twilioClient.messages.create({
      //   body: `Your OTP is: ${otp}`,
      //   to: phoneNumber,
      //   from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
      // });
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new DatabaseError(
        "Failed to send OTP",
        "OTP_SEND_FAILED",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<any> {
    if (!phoneNumber || !otp) {
      throw new DatabaseError(
        "Phone number and OTP are required",
        "MISSING_REQUIRED_FIELDS",
        HttpStatus.BAD_REQUEST
      );
    }

    const key = `otp:${phoneNumber}`;
    try {
      const storedData = await this.redisClient.get(key);
      if (!storedData) {
        throw new DatabaseError(
          "OTP expired or not found",
          "OTP_EXPIRED",
          HttpStatus.BAD_REQUEST
        );
      }

      const { otp: storedOtp } = JSON.parse(storedData);
      if (storedOtp !== otp) {
        throw new DatabaseError(
          "Invalid OTP",
          "INVALID_OTP",
          HttpStatus.UNAUTHORIZED
        );
      }

      // Delete the OTP after successful verification
      await this.redisClient.del(key);

      return {
        status: "SUCCESS",
        message: "OTP verified successfully"
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        "Failed to verify OTP",
        "OTP_VERIFICATION_FAILED",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
