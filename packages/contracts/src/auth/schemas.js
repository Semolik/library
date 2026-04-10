"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenResponseSchema = exports.RefreshTokenSchema = exports.LoginUserSchema = exports.CreateUserSchema = exports.StrongPasswordSchema = exports.AuthCredentialsSchema = exports.AuthUserSchema = void 0;
const zod_1 = require("zod");
/**
 * Общие zod-схемы и переиспользуемые куски для auth-контракта.
 * Источник правды для backend и frontend.
 */
exports.AuthUserSchema = zod_1.z.object({
    id: zod_1.z.number(),
    email: zod_1.z.string().email(),
});
exports.AuthCredentialsSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: 'Email обязателен' })
        .email('Введите корректный email')
        .min(1, 'Email обязателен'),
    password: zod_1.z
        .string({ required_error: 'Пароль обязателен' })
        .min(1, 'Пароль обязателен'),
});
exports.StrongPasswordSchema = zod_1.z
    .string({ required_error: 'Пароль обязателен' })
    .min(8, 'Пароль должен быть не менее 8 символов')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
    .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру');
exports.CreateUserSchema = exports.AuthCredentialsSchema.extend({
    password: exports.StrongPasswordSchema,
});
exports.LoginUserSchema = exports.AuthCredentialsSchema;
exports.RefreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z
        .string({ required_error: 'Refresh token обязателен' })
        .min(1, 'Refresh token обязателен'),
});
exports.TokenResponseSchema = zod_1.z.object({
    accessToken: zod_1.z.string(),
    refreshToken: zod_1.z.string(),
    expiresIn: zod_1.z.number(),
    user: exports.AuthUserSchema,
});
//# sourceMappingURL=schemas.js.map