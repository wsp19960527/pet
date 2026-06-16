import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@pet/shared';
import { CurrentUser } from '../common/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { InteractionsService } from './interactions.service';

@ApiTags('interactions')
@Controller('api/v1/interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create comment or toggle like' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateInteractionDto) {
    return this.interactionsService.create(user.sub, dto);
  }
}

@ApiTags('interactions')
@Controller('api/v1/animals')
export class AnimalInteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Get(':id/interactions')
  @ApiOperation({ summary: 'List animal comments' })
  list(@Param('id') id: string) {
    return this.interactionsService.listAnimalComments(id);
  }
}
