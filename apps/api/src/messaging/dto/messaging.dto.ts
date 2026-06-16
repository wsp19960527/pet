import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class StartConversationDto {
  @IsUUID()
  peerUserId!: string;
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}
