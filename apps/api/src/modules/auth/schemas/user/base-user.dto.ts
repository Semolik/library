import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class BaseUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email адрес пользователя',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

