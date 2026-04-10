import { ApiProperty } from '@nestjs/swagger';
import { LoginUserSchema } from '@workspace/contracts/auth';
import type { LoginUserFormData } from '@workspace/contracts/auth';

export class LoginUserDto implements LoginUserFormData {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'Пароль пользователя',
  })
  password!: string;
}

// Zod схема для валидации
export const LoginUserDtoSchema = LoginUserSchema;


