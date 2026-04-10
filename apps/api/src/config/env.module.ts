import { envSchema } from './env';
import { EnvService } from './env.service';
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
  ],
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}

