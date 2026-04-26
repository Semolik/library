import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  DATABASE_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  DATABASE_PORT: number = 5432;

  @IsString()
  DATABASE_USER: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  JWT_SECRET: string;

  @IsNumber()
  @IsOptional()
  JWT_EXPIRATION_TIME: number = 3600;

  @IsString()
  @IsOptional()
  FIRST_SUPERUSER_EMAIL: string = 'admin@example.com';

  @IsString()
  @IsOptional()
  FIRST_SUPERUSER_PASSWORD: string = 'admin123456';

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:3000,http://localhost:3001';

  @IsString()
  @IsOptional()
  MINIO_ENDPOINT: string = 'localhost';

  @IsNumber()
  @IsOptional()
  MINIO_PORT: number = 9000;

  @IsString()
  @IsOptional()
  MINIO_ACCESS_KEY: string = 'minioadmin';

  @IsString()
  @IsOptional()
  MINIO_SECRET_KEY: string = 'minioadmin';

  @IsString()
  @IsOptional()
  MINIO_BUCKET_NAME: string = 'library-files';

  @IsBoolean()
  @IsOptional()
  MINIO_USE_SSL: boolean = false;

  constructor() {
    Object.assign(this, {
      NODE_ENV: process.env.NODE_ENV || Environment.Development,
      PORT: parseInt(process.env.PORT || '3000', 10),
      DATABASE_HOST: process.env.DATABASE_HOST || process.env.POSTGRES_HOST || 'localhost',
      DATABASE_PORT: parseInt(
        process.env.DATABASE_PORT || process.env.POSTGRES_PORT || '5432',
        10,
      ),
      DATABASE_USER: process.env.DATABASE_USER || process.env.POSTGRES_USER || 'postgres',
      DATABASE_PASSWORD:
        process.env.DATABASE_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres',
      DATABASE_NAME: process.env.DATABASE_NAME || process.env.POSTGRES_DB || 'library_db',
      JWT_SECRET: process.env.JWT_SECRET || 'secret',
      JWT_EXPIRATION_TIME: parseInt(process.env.JWT_EXPIRATION_TIME || '3600', 10),
      FIRST_SUPERUSER_EMAIL: process.env.FIRST_SUPERUSER_EMAIL || 'admin@example.com',
      FIRST_SUPERUSER_PASSWORD: process.env.FIRST_SUPERUSER_PASSWORD || 'admin123456',
      CORS_ORIGIN:
        process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001',
      MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'localhost',
      MINIO_PORT: parseInt(process.env.MINIO_PORT || '9000', 10),
      MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || 'minioadmin',
      MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME || 'library-files',
      MINIO_USE_SSL: ['1', 'true', 'yes', 'on'].includes(
        (process.env.MINIO_USE_SSL || 'false').toLowerCase(),
      ),
    });
  }

  get databaseUrl(): string {
    return `postgres://${this.DATABASE_USER}:${this.DATABASE_PASSWORD}@${this.DATABASE_HOST}:${this.DATABASE_PORT}/${this.DATABASE_NAME}`;
  }

  get isDevelopment(): boolean {
    return this.NODE_ENV === Environment.Development;
  }

  get isProduction(): boolean {
    return this.NODE_ENV === Environment.Production;
  }
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}


