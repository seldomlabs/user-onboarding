import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { DatabaseModule } from '@app/common';
import { User } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './users.repository';
import { RmqModule } from '@app/common/rmq/rmq.module';
import { ONBOARDING_SERVICE } from './constants/services';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        USERS_SERVICE_PORT: Joi.number().required()
      }),
      envFilePath: './apps/users/.env'
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([User]),
    RmqModule.register({
      name: ONBOARDING_SERVICE,
    }),

  ],
  controllers: [UserController],
  providers: [UserService,UserRepository],
})
export class UsersModule {}
