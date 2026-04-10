import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { CreateUserInput } from '@workspace/contracts';
import { BaseUserDto } from './base-user.dto';

export class CreateUserDto extends BaseUserDto implements CreateUserInput {
  @ApiProperty({
    example: 'securePassword123',
    description: 'Пароль (минимум 8 символов)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}

