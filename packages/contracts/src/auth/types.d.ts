export interface JwtPayload {
    sub: number;
    email: string;
    type: 'access' | 'refresh';
}
export interface AuthUser {
    id: number;
    email: string;
}
export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: AuthUser;
}
export interface CreateUserInput {
    email: string;
    password: string;
}
export interface LoginUserInput {
    email: string;
    password: string;
}
export interface RefreshTokenInput {
    refreshToken: string;
}
//# sourceMappingURL=types.d.ts.map