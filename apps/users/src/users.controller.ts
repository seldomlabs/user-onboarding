import { Body, Controller, Get, InternalServerErrorException, Ip, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserService } from './users.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth-guard';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(@Body() userDto: any, @Ip() ip) {
    try {
      const user = await this.userService.createUser(userDto, ip);
      user.password = undefined
      const token = await this.authService.login(user);
      return { status: "SUCCESS", message: 'User registered successfully', token };
    } catch (err) {
      return { error: err };
    }
  }

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) throw new InternalServerErrorException('Invalid credentials');
    
    const token = await this.authService.login(user);
    return { status: "SUCCESS", message: 'User logged in successfully', token };
  }

  @Get()
  async getUsers(@Query('ids') ids: string, @Query('select') selection: string) {
    try {
      const users = await this.userService.findUsers(ids && JSON.parse(ids), selection && JSON.parse(selection));
      return { status: "SUCCESS", message: "User details fetched successfully", userDetails: users };
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() request: any) {
    return { status: "SUCCESS", user: request.user };
  }

}
