import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { ScheduleService } from './schedule.service';
import { CreateProgramDto } from './dto/create-program.dto';

@UseGuards(JwtAuthGuard)
@Controller('programs')
export class ProgramsController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.schedule.listPrograms(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProgramDto) {
    return this.schedule.createProgram(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.schedule.removeProgram(user.id, id);
  }
}
