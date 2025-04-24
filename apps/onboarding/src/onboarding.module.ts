import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { RedisModule } from '@app/common/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { REDIS_CLIENT } from './constants/service';
import { SnsService } from './sns.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        ONBOARDING_SERVICE_PORT: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
        TWILIO_ACCOUNT_SID: Joi.string().required(),
        TWILIO_AUTH_TOKEN: Joi.string().required(),
        TWILIO_PHONE_NUMBER: Joi.string().required()
      }),
      envFilePath: './apps/onboarding/.env'
    }),
    RedisModule.register({ name: REDIS_CLIENT })
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService,SnsService],
  exports: [OnboardingService, SnsService]
})
export class OnboardingModule { }
