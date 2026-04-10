import { envSchema, EnvSchema } from './env';
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class EnvService {
  constructor(private configService: NestConfigService<EnvSchema, true>) {}

  get<T extends keyof EnvSchema>(key: T): EnvSchema[T] {
    return this.configService.get(key, { infer: true });
  }
}

