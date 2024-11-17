import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { RedisModule } from '@app/common/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { RmqModule } from '@app/common/rmq/rmq.module';
import { REDIS_CLIENT } from './constants/service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        ONBOARDING_SERVICE_PORT: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().required()
      }),
      envFilePath: './apps/onboarding/.env'
    }),
    RmqModule,
    RedisModule.register({ name: REDIS_CLIENT })
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule { }
