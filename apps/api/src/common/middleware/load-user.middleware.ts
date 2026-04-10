import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '@common/services/prisma.service';
import { User } from '@prisma/client';

interface UserRequest extends Request {
  user?: User | { id: number };
}

@Injectable()
export class LoadUserMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: UserRequest, res: Response, next: NextFunction) {
    if (req.user && 'id' in req.user) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: (req.user as { id: number }).id },
        });
        if (user) {
          req.user = user;
        }
      } catch {
        // Продолжаем даже если не найден
      }
    }
    next();
  }
}

