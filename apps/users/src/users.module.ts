import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { DatabaseModule } from '@app/common';
import { User} from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './users.repository';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth-guard';
import { OnboardingModule } from '../../onboarding/src/onboarding.module';
import { ProfileRepository } from './profile.repository';
import { Profile } from './profile.entity';

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
        USERS_SERVICE_PORT: Joi.number().required(),
        JWT_SECRET: Joi.string().required()
      }),
      envFilePath: './apps/users/.env'
    }),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([User,Profile]),
    OnboardingModule
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, ProfileRepository, JwtAuthGuard],
  exports: [JwtAuthGuard]
})
export class UsersModule {}
