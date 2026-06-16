import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@pet/shared';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { SendMessageDto, StartConversationDto } from './dto/messaging.dto';
import { MessagingService } from './messaging.service';

@ApiTags('messaging')
@Controller('api/v1/messaging')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List my conversations' })
  conversations(@CurrentUser() user: JwtPayload) {
    return this.messagingService.listConversations(user.sub);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Start or get direct conversation' })
  start(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartConversationDto,
  ) {
    return this.messagingService.startConversation(user.sub, dto.peerUserId);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'List messages in conversation' })
  messages(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.messagingService.listMessages(user.sub, id);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send message' })
  send(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(user.sub, id, dto.content);
  }
}
