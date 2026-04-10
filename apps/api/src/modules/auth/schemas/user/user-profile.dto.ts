import { ApiProperty } from '@nestjs/swagger';
import { BaseUserDto } from './base-user.dto';

export class UserProfileDto extends BaseUserDto {
  @ApiProperty({
    example: 1,
    description: 'ID пользователя',
  })
  id!: number;

  @ApiProperty({
    example: '2026-04-10T12:00:00Z',
    description: 'Дата создания профиля',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;
}

