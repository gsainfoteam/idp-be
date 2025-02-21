import { PrismaModule } from '@lib/prisma';
import { RedisModule } from '@lib/redis';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './health.controller';

@Module({
  imports: [
    RedisModule,
    PrismaModule,
    TerminusModule.forRoot({ errorLogStyle: 'json' }),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
