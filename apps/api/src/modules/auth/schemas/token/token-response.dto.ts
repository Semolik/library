import { ApiProperty } from '@nestjs/swagger';
import type { TokenResponseData } from '@workspace/contracts/auth';

export class TokenResponseDto implements TokenResponseData {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT токен доступа',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh токен для обновления accessToken',
  })
  refreshToken!: string;

  @ApiProperty({
    example: 3600,
    description: 'Время истечения токена в секундах',
  })
  expiresIn!: number;
}
