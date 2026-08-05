import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PushModule } from '../push/push.module';
import { TokenCleanupService } from './token-cleanup.service';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';

@Module({
  imports: [PrismaModule, AuthModule, PushModule],
  controllers: [RemindersController],
  providers: [TokenCleanupService, RemindersService],
})
export class TasksModule {}
