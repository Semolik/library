import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@config/config.service';
import { InvalidTokenError } from '@common/exceptions';

interface JwtPayload {
  sub: number;
  type: 'access' | 'refresh';
}

const tokenSchema = (payload: JwtPayload) => {
  if (!payload.sub) {
    throw new Error('Missing sub in token');
  }
  return payload;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    const secret = configService.jwtSecret;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<{ id: number }> {
    const validatedPayload = tokenSchema(payload);
    this.logger.debug(`[JWT] Validating token for user ${validatedPayload.sub}, type: ${validatedPayload.type}`);

    if (validatedPayload.type !== 'access') {
      this.logger.warn(`[JWT] Validation failed: Invalid token type: ${validatedPayload.type}, expected: access`);
      throw new InvalidTokenError('Invalid token type');
    }

    this.logger.log(`[JWT] Token validated successfully for user ${validatedPayload.sub}`);

    return {
      id: validatedPayload.sub,
    };
  }
}
