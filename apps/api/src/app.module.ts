import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AuthModule } from '@modules/auth/auth.module';
import { PrismaService } from '@common/services/prisma.service';
import { ConfigModule } from '@config/config.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}

