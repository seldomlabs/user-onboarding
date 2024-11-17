import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { UserRepository } from './users.repository';
import * as bcrypt from 'bcrypt';
import { In } from 'typeorm';
import { ONBOARDING_SERVICE } from './constants/services';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class UserService {

    constructor(
        @Inject(UserRepository) private readonly userRepository: UserRepository,
        @Inject(ONBOARDING_SERVICE) private onboardingClient: ClientProxy,
    ) {

    }

    async createUser(userDto: any,ip: any): Promise<any> {
        const { name, email, password, phoneNumber, gender, interests,latitude,longitude,matchRadius } = userDto;

        const hashedPassword = await bcrypt.hash(password, 10);
      try{
        const user = await this.userRepository.create({
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            gender,
            interests,
            latitude,
            longitude,
            ip,
            matchRadius
        });
        try{
        await lastValueFrom(
          this.onboardingClient.emit('user_registered', {
            user,
          }),
        );
        return user
        }
        catch(err){
          console.log(err);
          return user
        }
      }
      catch(err){
        console.log(err)
        throw err
      }
    }

  async findUsers(userIds: string[], select?: string[]): Promise<any> {
    const users = await this.userRepository.find(userIds ? {id: In(userIds)} : {},select);
    const result = {};
    users.forEach(user => {
        result[user.id] = user
    });
    
    return result;
}


    async markPhoneAsVerified(phoneNumber: string): Promise<void> {
        const user = await this.userRepository.findOne({ phoneNumber });
        if (!user) throw new BadRequestException('User not found');

        user.isPhoneVerified = true;
    }
}
