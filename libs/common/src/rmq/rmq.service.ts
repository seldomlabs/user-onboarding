import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqContext, RmqOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class RmqService {
  constructor(private readonly configService: ConfigService) {}

  getOptions(queue: string, noAck = false): RmqOptions {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.configService.get<string>('RABBIT_MQ_URI')],
        queue: this.configService.get<string>(`RABBIT_MQ_${queue}_QUEUE`),
        noAck,
        persistent: true,
      },
    };
  }

  ack(context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    channel.ack(originalMessage);
  }

  async republishWithRetry(context: RmqContext, updatedHeaders: Record<string, any>) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    
    channel.nack(originalMessage, false, false);
    
    await channel.publish(
      originalMessage.fields.exchange,
      originalMessage.fields.routingKey,
      originalMessage.content,
      {
        ...originalMessage.properties,
        headers: updatedHeaders, 
      },
    );
  }


  async sendToDLQ(queue: string, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    console.log('dead letter queue',this.configService.get<string>(`RABBIT_MQ_${queue}_DL_QUEUE`))
    await channel.publish(
      '',
      this.configService.get<string>(`RABBIT_MQ_${queue}_QUEUE`),
      originalMessage.content,
      originalMessage.properties,
    );
    channel.ack(originalMessage);
  }

}