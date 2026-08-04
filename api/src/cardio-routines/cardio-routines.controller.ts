import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { CardioRoutinesService } from './cardio-routines.service';
import { CreateCardioRoutineDto } from './dto/create-cardio-routine.dto';

@UseGuards(JwtAuthGuard)
@Controller('cardio-routines')
export class CardioRoutinesController {
  constructor(private readonly cardioRoutines: CardioRoutinesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCardioRoutineDto) {
    return this.cardioRoutines.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.cardioRoutines.list(user.id);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cardioRoutines.getOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateCardioRoutineDto,
  ) {
    return this.cardioRoutines.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cardioRoutines.remove(user.id, id);
  }
}
