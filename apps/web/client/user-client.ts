import { ApiClient } from "@/client/api-client"
import type { UserDto, UserUpdateDto } from "@workspace/shared-types"

export type UserProfile = Pick<UserDto, "id" | "email" | "firstName" | "lastName">
export type UpdateProfileInput = Pick<UserUpdateDto, "email" | "firstName" | "lastName">

class UserClient extends ApiClient {
  async getMe(token: string) {
    return this.request<UserProfile>("/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async updateMe(token: string, input: UpdateProfileInput) {
    return this.request<UserProfile>("/users/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    })
  }
}

export const userClient = new UserClient()
