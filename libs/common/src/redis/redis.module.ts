import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

interface RedisModuleOptions {
  name: string;
}

@Module({})
export class RedisModule {
  static register({name}: RedisModuleOptions): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: name,
          useFactory: (configService: ConfigService) => {
            return new Redis({
              host: configService.get<string>('REDIS_HOST'),
              port: parseInt(configService.get<string>('REDIS_PORT'), 10),
              password: configService.get<string>('REDIS_PASSWORD'),
              db: parseInt(configService.get<string>('REDIS_DB'), 10) || 0,
            });
          },
          inject: [ConfigService],
        },
        {
          provide: RedisService,
          useFactory: (client: Redis) => new RedisService(client),
          inject: [name],
        },
      ],
      exports: [name, RedisService],
    };
  }
}
