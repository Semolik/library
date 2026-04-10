import { Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Проверяем, является ли маршрут публичным
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug('[JWT Guard] Route is public, skipping authentication');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (authHeader) {
      const [scheme, token] = authHeader.split(' ');
      this.logger.debug(`[JWT Guard] Authorization header present, scheme: ${scheme}, token length: ${token?.length || 0}`);
    } else {
      this.logger.warn('[JWT Guard] Authorization header missing');
    }

    try {
      // Валидируем JWT
      const result = await super.canActivate(context);

      if (!result) {
        return false;
      }

      if (request.user) {

        this.logger.log(`[JWT Guard] Authentication successful for user: ${request.user.email}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`[JWT Guard] Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

