import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { LoginUserInput } from '@workspace/contracts';
import { BaseUserDto } from './base-user.dto';

export class LoginUserDto extends BaseUserDto implements LoginUserInput {
  @ApiProperty({
    example: 'securePassword123',
    description: 'Пароль пользователя',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

