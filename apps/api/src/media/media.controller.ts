import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Query,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@pet/shared';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import {
  ConfirmMediaDto,
  IssueUploadCredentialDto,
} from './dto/media.dto';
import { MediaService } from './media.service';

@ApiTags('media')
@Controller('api/v1/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('sts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue upload credential (local dev or OSS STS)' })
  issueCredential(
    @CurrentUser() user: JwtPayload,
    @Body() dto: IssueUploadCredentialDto,
  ) {
    if (user.type !== 'user') {
      throw new UnauthorizedException('User token required');
    }
    return this.mediaService.issueUploadCredential(user.sub, dto);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Local dev direct upload' })
  async uploadLocal(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Query('objectKey') objectKey: string,
  ) {
    if (user.type !== 'user') {
      throw new UnauthorizedException('User token required');
    }
    if (!file) {
      throw new BadRequestException('file is required');
    }
    if (!objectKey) {
      throw new BadRequestException('objectKey is required');
    }

    return this.mediaService.saveLocalUpload({
      userId: user.sub,
      objectKey,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      buffer: file.buffer,
    });
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm upload and create media_assets row' })
  confirm(@CurrentUser() user: JwtPayload, @Body() dto: ConfirmMediaDto) {
    if (user.type !== 'user') {
      throw new UnauthorizedException('User token required');
    }
    return this.mediaService.confirmUpload(user.sub, dto);
  }
}
