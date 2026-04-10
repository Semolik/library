import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { CreateUserInput } from '@workspace/contracts';

export class CreateUserDto implements CreateUserInput {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email адрес пользователя',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'john_doe',
    description: 'Имя пользователя (минимум 3 символа)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username!: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'Пароль (минимум 8 символов)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
