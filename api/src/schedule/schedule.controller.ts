import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { ScheduleService } from './schedule.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { DuplicateWeekDto } from './dto/duplicate-week.dto';
import { ScheduleRangeQuery } from './dto/schedule-range.query';

@UseGuards(JwtAuthGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: ScheduleRangeQuery) {
    return this.schedule.listRange(user.id, q.from, q.to);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSessionDto) {
    return this.schedule.createSession(user.id, dto);
  }

  @Post('duplicate-week')
  duplicateWeek(@CurrentUser() user: AuthUser, @Body() dto: DuplicateWeekDto) {
    return this.schedule.duplicateWeek(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.schedule.updateSession(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.schedule.removeSession(user.id, id);
  }
}
