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
import { BodyweightService } from './bodyweight.service';
import { CreateBodyweightDto } from './dto/create-bodyweight.dto';
import { UpdateBodyweightDto } from './dto/update-bodyweight.dto';

@UseGuards(JwtAuthGuard)
@Controller('bodyweight')
export class BodyweightController {
  constructor(private readonly bodyweight: BodyweightService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.bodyweight.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBodyweightDto) {
    return this.bodyweight.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBodyweightDto,
  ) {
    return this.bodyweight.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bodyweight.remove(user.id, id);
  }
}
