import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { handleHttpException } from '../utils/error.utils';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
  }

   extractS3KeyFromUrl(url) {
    if (typeof url !== 'string') return null;
  
    try {
      const { pathname } = new URL(url);
      return pathname.length > 1 ? decodeURIComponent(pathname.slice(1)) : null;
    } catch {
      return null;
    }
  }
  
  async uploadFile(file: Express.Multer.File, userId: string): Promise<string> {
    try {
      if (!file) {
        throw new HttpException({
          status: 'ERROR',
          message: 'No file provided',
          code: 'MISSING_FILE',
        }, HttpStatus.BAD_REQUEST);
      }
      if(!userId){
        throw new HttpException({
          status: 'ERROR',
          message: 'Invalid Request or Token',
          code: 'INVALID_REQUEST',
        }, HttpStatus.BAD_REQUEST);
      }

      if (file.size > 10 * 1024 * 1024) { 
        throw new HttpException({
          status: 'ERROR',
          message: 'File size exceeds 10MB limit',
          code: 'FILE_TOO_LARGE',
        }, HttpStatus.BAD_REQUEST);
      }

      const key = `profiles/${userId}/photos/${Date.now()}-${file.originalname}`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);
      

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 604800 });
      const s3KeyUrl = this.extractS3KeyFromUrl(signedUrl)
      return s3KeyUrl
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error.name === 'NoSuchBucket') {
        throw new HttpException({
          status: 'ERROR',
          message: 'S3 bucket does not exist',
          code: 'BUCKET_NOT_FOUND',
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
        throw new HttpException({
          status: 'ERROR',
          message: 'Invalid AWS credentials',
          code: 'INVALID_AWS_CREDENTIALS',
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      throw handleHttpException(error);
    }
  }

  async uploadFiles(files: Express.Multer.File[], userId: string): Promise<string[]> {
    const uploadPromises = files.map(file => 
      this.uploadFile(file, userId)
    );
    return Promise.all(uploadPromises);
  }

} 