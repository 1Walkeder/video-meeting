import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { CreateMeetingDto } from './meetings.dto.js';
import { MeetingsService } from './meetings.service.js';

@Controller('meetings')
@UseGuards(AuthGuard)
export class MeetingsController {
  constructor(
    @Inject(MeetingsService) private readonly meetings: MeetingsService,
  ) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateMeetingDto) {
    return this.meetings.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.meetings.findAllByOwner(req.user.id);
  }

  // Должен идти до ':id', иначе "recent" будет принят за идентификатор.
  @Get('recent')
  findRecent(@Req() req: AuthenticatedRequest) {
    return this.meetings.findRecentByOwner(req.user.id);
  }

  @Get(':id')
  async findOne(
    @Req() req: AuthenticatedRequest,
    // Некорректный id не может существовать: отвечаем 404, а не 400/500.
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ) {
    const meeting = await this.meetings.findOneByOwner(req.user.id, id);
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }
}
