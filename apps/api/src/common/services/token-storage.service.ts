import { Injectable, Logger } from '@nestjs/common';
import type { TokenResponse } from '@workspace/contracts';

export interface StoredToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  createdAt: number;
}

@Injectable()
export class TokenStorageService {
  private readonly logger = new Logger(TokenStorageService.name);
  private readonly tokenStorage = new Map<number, StoredToken>();

  async saveTokens(userId: number, tokens: TokenResponse): Promise<void> {
    const storedToken: StoredToken = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      createdAt: Date.now(),
    };

    try {
      this.logger.debug(`Saving tokens for user ${userId}`);
      this.tokenStorage.set(userId, storedToken);
      this.logger.log(`Tokens saved successfully for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to save tokens for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async getTokens(userId: number): Promise<StoredToken | undefined> {
    try {
      this.logger.debug(`Retrieving tokens for user ${userId}`);
      const tokens = this.tokenStorage.get(userId);

      if (tokens) {
        this.logger.log(`Tokens found for user ${userId}`);
      } else {
        this.logger.warn(`Tokens not found for user ${userId}`);
      }

      return tokens;
    } catch (error) {
      this.logger.error(`Failed to retrieve tokens for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async validateAccessToken(userId: number, accessToken: string): Promise<boolean> {
    try {
      this.logger.debug(`Validating access token for user ${userId}`);
      const storedToken = await this.getTokens(userId);

      if (!storedToken) {
        this.logger.warn(`No stored tokens found for user ${userId}`);
        return false;
      }

      const isValid = storedToken.accessToken === accessToken;
      if (isValid) {
        this.logger.log(`Access token validated successfully for user ${userId}`);
      } else {
        this.logger.warn(`Access token mismatch for user ${userId}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Failed to validate token for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    const testKey = 1;
    const testValue = { timestamp: Date.now(), accessToken: 'test', refreshToken: 'test', expiresIn: 3600, createdAt: Date.now() };

    try {
      this.tokenStorage.set(testKey, testValue);
      const retrieved = this.tokenStorage.get(testKey);
      this.tokenStorage.delete(testKey);
      return retrieved !== undefined;
    } catch {
      return false;
    }
  }
}

