import { Controller, Post, UseInterceptors, UseGuards, Req, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';
import { createSuccessResponse, handleHttpException } from '../utils/error.utils';
import { JwtAuthGuard } from '../jwt-auth-guard';
import { UserRequest } from '../types/request.types';

@Controller('api/v1/users/upload-media')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files',10))
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[], @Req() req: UserRequest) {
    try {
      const userId = req.user.id
      const fileUrls = await this.s3Service.uploadFiles(files,userId);
      
      return createSuccessResponse({
        files: fileUrls.map((url, index) => ({
          key: url,
          filename: files[index].originalname,
          mimetype: files[index].mimetype,
          size: files[index].size,
          uploadedAt: new Date().toISOString()
        }))
      }, 'Files uploaded successfully');
    } catch (error) {
      throw handleHttpException(error);
    }
  }
}