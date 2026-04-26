import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { SecurityModule } from './modules/security/security.module';
import { EnvironmentVariables, validate } from './config/env.validation';
import { getDatabaseConfig } from './config/database.config';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Prefer app-specific env values over inherited process env (e.g. turbo task env).
dotenv.config({ path: resolve(process.cwd(), '.env'), override: true });

const env = new EnvironmentVariables();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: () => env,
    }),
    TypeOrmModule.forRoot(getDatabaseConfig(env)),
    UserModule,
    AuthModule,
    SecurityModule,
  ],
  controllers: [],
  providers: [
    {
      provide: EnvironmentVariables,
      useValue: env,
    },
  ],
})
export class AppModule {}


