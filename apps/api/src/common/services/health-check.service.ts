import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '@common/services/prisma.service';

@Injectable()
export class HealthCheckService implements OnApplicationBootstrap {
  private readonly logger = new Logger(HealthCheckService.name);

  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.checkDatabaseConnection();
  }

  private async checkDatabaseConnection(): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.logger.log('✓ Database connection successful');
    } catch (error) {
      this.logger.error(
        `✗ Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new Error('Failed to connect to database');
    }
  }
}

