import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from "@/modules";
import { AuthController } from "@/modules";
import { JwtStrategy } from '@common/strategies/jwt.strategy';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PrismaService } from '@common/services/prisma.service';
import { ConfigService } from '@config/config.service';
import { ConfigModule } from '@config/config.module';
import { LoadUserMiddleware } from '@common/middleware/load-user.middleware';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.jwtSecret;

        return {
          secret,
          signOptions: {
            algorithm: 'HS256' as const,
            expiresIn: 3600, // accessToken время жизни в секундах (1 час)
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, PrismaService, ConfigService],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoadUserMiddleware)
      .forRoutes({ path: 'auth/*', method: RequestMethod.ALL });
  }
}

