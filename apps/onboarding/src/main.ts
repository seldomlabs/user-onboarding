import { NestFactory } from '@nestjs/core';
import { OnboardingModule } from './onboarding.module';
import { ConfigService } from '@nestjs/config';
import { RmqService } from '@app/common/rmq/rmq.service';
import { ONBOARDING_SERVICE } from 'apps/users/src/constants/services';

async function bootstrap() {
  const app = await NestFactory.create(OnboardingModule);
  const configService = app.get(ConfigService);
  // const rmqService = app.get<RmqService>(RmqService);
  // app.connectMicroservice(rmqService.getOptions(ONBOARDING_SERVICE));
  await app.startAllMicroservices();
  await app.listen(configService.get('ONBOARDING_SERVICE_PORT'));
}
bootstrap();
