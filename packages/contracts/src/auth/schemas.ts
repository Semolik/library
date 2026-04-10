import { z } from 'zod';
import type { TokenResponse } from './types';

export const LoginUserSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

export const CreateUserSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

export type LoginUserFormData = z.infer<typeof LoginUserSchema>;
export type CreateUserFormData = z.infer<typeof CreateUserSchema>;

export type { TokenResponse };
