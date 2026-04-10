import { ApiProperty } from '@nestjs/swagger';
import { CreateUserSchema } from '@workspace/contracts/auth';
import type { CreateUserFormData } from '@workspace/contracts/auth';

export class CreateUserDto implements CreateUserFormData {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  email!: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'Пароль (минимум 8 символов, с заглавной буквой, цифрой)',
  })
  password!: string;
}

// Zod схема для валидации
export const CreateUserDtoSchema = CreateUserSchema;


