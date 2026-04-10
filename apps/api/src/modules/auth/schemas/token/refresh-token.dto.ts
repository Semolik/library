import { ApiProperty } from '@nestjs/swagger';
import { RefreshTokenSchema } from '@workspace/contracts/auth';
import type { RefreshTokenFormData } from '@workspace/contracts/auth';

export class RefreshTokenDto implements RefreshTokenFormData {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh токен для обновления accessToken',
  })
  refreshToken!: string;
}

// Zod схема для валидации
export const RefreshTokenDtoSchema = RefreshTokenSchema;
