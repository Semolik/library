import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({
    example: 1,
    description: 'ID пользователя',
  })
  id!: number;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  email!: string;

  @ApiProperty({
    example: '2026-04-10T12:00:00Z',
    description: 'Дата создания профиля',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;
}
