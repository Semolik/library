import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {
    this.ensureDatabaseUrl();
  }

  private ensureDatabaseUrl(): void {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = this.databaseUrl;
    }
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3001);
  }

  // PostgreSQL Configuration
  get postgresUser(): string {
    return this.configService.get<string>('POSTGRES_USER', 'postgres');
  }

  get postgresPassword(): string {
    return this.configService.get<string>('POSTGRES_PASSWORD', 'postgres');
  }

  get postgresDb(): string {
    return this.configService.get<string>('POSTGRES_DB', 'library');
  }

  get postgresHost(): string {
    return this.configService.get<string>('POSTGRES_HOST', 'localhost');
  }

  get postgresPort(): number {
    return this.configService.get<number>('POSTGRES_PORT', 5432);
  }

  // Построение DATABASE_URL из отдельных переменных
  get databaseUrl(): string {
    const user = this.postgresUser;
    const password = this.postgresPassword;
    const host = this.postgresHost;
    const port = this.postgresPort;
    const database = this.postgresDb;

    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }

  // JWT Configuration (HS256)
  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', 'your-secret-key-change-in-production');
  }

  get jwtExpiration(): number {
    // Возвращаем время жизни accessToken в секундах (1 час = 3600 секунд)
    return 3600; // 1 час
  }

  get corsOrigin(): string {
    return this.configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');
  }
}

