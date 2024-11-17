import { Body, Controller, Get, InternalServerErrorException, Ip, Post, Query } from '@nestjs/common';
import { UserService } from './users.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() userDto: any, @Ip() ip) {
    try{
    const user = await this.userService.createUser(userDto,ip);
    return {status: "SUCCESS", message: 'User registered successfully',userDetails: user};
    }catch(err){
      return {error: err}
    }
  }

  @Get('users')
  async getUsers(@Query('ids') ids: string,@Query('select') selection: string) {
      try {
          const users = await this.userService.findUsers(ids && JSON.parse(ids), selection && JSON.parse(selection));
          return {
            status: "SUCCESS",
            message: "User details fetched successfully",
            userDetails: users
          };
      } catch (err) {
        throw new InternalServerErrorException(err.message);
      }
  }
}
