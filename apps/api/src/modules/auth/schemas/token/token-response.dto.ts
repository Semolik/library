import { ApiProperty } from '@nestjs/swagger';
import type { TokenResponse } from '@workspace/contracts';

export class TokenResponseDto implements TokenResponse {
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

  @ApiProperty({
    description: 'Информация о пользователе',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      email: { type: 'string', example: 'user@example.com' },
      username: { type: 'string', example: 'john_doe' },
    },
  })
  user!: TokenResponse['user'];
}

