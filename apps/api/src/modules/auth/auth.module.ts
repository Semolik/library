import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { SecurityModule } from '../security/security.module';
import { EnvironmentVariables } from '../../config/env.validation';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env'), override: true });
const env = new EnvironmentVariables();

@Module({
  imports: [
    UserModule,
    SecurityModule,
    PassportModule,
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: env.JWT_EXPIRATION_TIME },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: EnvironmentVariables,
      useValue: env,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}


