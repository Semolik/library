import { ApiClient, ApiError } from "@/client/api-client"
import type { UserDto, UserLoginDto, UserRegisterDto } from "@workspace/shared-types"

export type AuthUser = Pick<UserDto, "id" | "email" | "firstName" | "lastName"> & {
  roles?: string[]
}

export type AuthResponse = {
  accessToken: string
  user: AuthUser
}

export type LoginInput = Pick<UserLoginDto, "email" | "password">
export type RegisterInput = Pick<
  UserRegisterDto,
  "email" | "password" | "firstName" | "lastName"
>

export class AuthClient extends ApiClient {
  async login(input: LoginInput) {
    if (!input.email || !input.password) {
      throw new ApiError("Введите email и пароль.", 400)
    }

    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    })
  }

  async register(input: RegisterInput) {
    if (!input.email || !input.password) {
      throw new ApiError("Введите email и пароль.", 400)
    }

    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    })
  }
}

export const authClient = new AuthClient()
