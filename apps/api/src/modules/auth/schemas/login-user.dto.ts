import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { LoginUserInput } from '@workspace/contracts';

export class LoginUserDto implements LoginUserInput {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email адрес пользователя',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'Пароль пользователя',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
