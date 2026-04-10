import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private retryCount = 0;
  private maxRetries = 30;
  private retryDelay = 1000; // 1 second

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.logger.warn(
          `Database connection failed. Retrying... (${this.retryCount}/${this.maxRetries})`,
        );
        // eslint-disable-next-line no-undef
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        await this.connectWithRetry();
      } else {
        this.logger.error('Failed to connect to database after multiple attempts');
        throw error;
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}






