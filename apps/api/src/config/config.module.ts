import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { EnvModule } from './env.module';
import { envSchema } from './env';
import * as path from 'path';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.join(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}.local`),
        path.join(process.cwd(), '.env.local'),
        path.join(process.cwd(), '.env'),
        // Also check project root (for monorepo setup)
        path.join(process.cwd(), '../../../', `.env.${process.env.NODE_ENV || 'development'}.local`),
        path.join(process.cwd(), '../../../', '.env.local'),
        path.join(process.cwd(), '../../../', '.env'),
      ],
      validate: (env) => envSchema.parse(env),
    }),
    EnvModule,
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}

