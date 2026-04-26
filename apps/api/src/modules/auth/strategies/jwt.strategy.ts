import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadDto } from '@workspace/shared-types';
import { EnvironmentVariables } from '../../../config/env.validation';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(env: EnvironmentVariables) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  validate(payload: JwtPayloadDto) {
    return payload;
  }
}

