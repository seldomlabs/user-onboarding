import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SnsService {
  private snsClient: SNSClient;

  constructor(private configService: ConfigService) {
    this.snsClient = new SNSClient({ 
        region: this.configService.get('AWS_REGION'),
        credentials: {
            accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
          },
    });
  }

  async sendSms(phoneNumber: string, message: string): Promise<void> {
    const command = new PublishCommand({
      Message: message,
      PhoneNumber: phoneNumber,
    });

    try {
      await this.snsClient.send(command);
    } catch (error) {
      console.error("SNS sendSms error:", error);
      throw new Error("Failed to send SMS via AWS SNS");
    }
  }
}
