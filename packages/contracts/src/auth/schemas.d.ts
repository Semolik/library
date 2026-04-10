import { z } from 'zod';
/**
 * Общие zod-схемы и переиспользуемые куски для auth-контракта.
 * Источник правды для backend и frontend.
 */
export declare const AuthUserSchema: z.ZodObject<{
    id: z.ZodNumber;
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    email: string;
}, {
    id: number;
    email: string;
}>;
export declare const AuthCredentialsSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const StrongPasswordSchema: z.ZodString;
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
} & {
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const LoginUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const RefreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const TokenResponseSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    expiresIn: z.ZodNumber;
    user: z.ZodObject<{
        id: z.ZodNumber;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        email: string;
    }, {
        id: number;
        email: string;
    }>;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
    accessToken: string;
    expiresIn: number;
    user: {
        id: number;
        email: string;
    };
}, {
    refreshToken: string;
    accessToken: string;
    expiresIn: number;
    user: {
        id: number;
        email: string;
    };
}>;
export type AuthUserData = z.infer<typeof AuthUserSchema>;
export type AuthCredentialsData = z.infer<typeof AuthCredentialsSchema>;
export type StrongPasswordData = z.infer<typeof StrongPasswordSchema>;
export type CreateUserFormData = z.infer<typeof CreateUserSchema>;
export type LoginUserFormData = z.infer<typeof LoginUserSchema>;
export type RefreshTokenFormData = z.infer<typeof RefreshTokenSchema>;
export type TokenResponseData = z.infer<typeof TokenResponseSchema>;
//# sourceMappingURL=schemas.d.ts.map