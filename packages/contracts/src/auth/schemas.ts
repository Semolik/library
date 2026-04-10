import { z } from 'zod';

/**
 * Общие zod-схемы и переиспользуемые куски для auth-контракта.
 * Источник правды для backend и frontend.
 */

export const AuthUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
});

export const AuthCredentialsSchema = z.object({
  email: z
    .string({ required_error: 'Email обязателен' })
    .email('Введите корректный email')
    .min(1, 'Email обязателен'),
  password: z
    .string({ required_error: 'Пароль обязателен' })
    .min(1, 'Пароль обязателен'),
});

export const StrongPasswordSchema = z
  .string({ required_error: 'Пароль обязателен' })
  .min(8, 'Пароль должен быть не менее 8 символов')
  .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
  .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
  .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру');

export const CreateUserSchema = AuthCredentialsSchema.extend({
  password: StrongPasswordSchema,
});

export const LoginUserSchema = AuthCredentialsSchema;

export const RefreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token обязателен' })
    .min(1, 'Refresh token обязателен'),
});

export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

// Типы для типизации форм
export type AuthUserData = z.infer<typeof AuthUserSchema>;
export type AuthCredentialsData = z.infer<typeof AuthCredentialsSchema>;
export type StrongPasswordData = z.infer<typeof StrongPasswordSchema>;
export type CreateUserFormData = z.infer<typeof CreateUserSchema>;
export type LoginUserFormData = z.infer<typeof LoginUserSchema>;
export type RefreshTokenFormData = z.infer<typeof RefreshTokenSchema>;
export type TokenResponseData = z.infer<typeof TokenResponseSchema>;
