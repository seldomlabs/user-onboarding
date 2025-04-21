import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRequest } from './types/express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new  HttpException({
        status: 'ERROR',
        message: 'Missing token',
        code: 'MISSING_TOKEN',
      }, HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = this.jwtService.verify(token);
      request.user = decoded; 
      return true;
    } catch (error) {
      throw new HttpException({
        status: 'ERROR',
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      }, HttpStatus.UNAUTHORIZED);
    }
  }
}
