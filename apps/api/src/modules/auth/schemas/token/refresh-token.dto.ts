import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { RefreshTokenInput } from '@workspace/contracts';

export class RefreshTokenDto implements RefreshTokenInput {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh токен для получения новых access token',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

