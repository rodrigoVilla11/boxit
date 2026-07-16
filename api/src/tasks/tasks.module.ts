import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenCleanupService } from './token-cleanup.service';

@Module({
  imports: [PrismaModule],
  providers: [TokenCleanupService],
})
export class TasksModule {}
