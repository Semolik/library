import { ApiClient } from "@/client/api-client"

export type AdminRole = {
  id: string
  name: string
  description?: string | null
}

export type AdminUserListItem = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  roles: AdminRole[]
}

export type AdminUserCreateInput = {
  email: string
  password: string
  firstName?: string
  lastName?: string
  isActive?: boolean
  roles?: string[]
}

export type AdminUserUpdateInput = {
  email?: string
  firstName?: string | null
  lastName?: string | null
  isActive?: boolean
  roles?: string[]
}

class AdminUsersClient extends ApiClient {
  async list(token: string) {
    return this.request<AdminUserListItem[]>("/users", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  async listRoles(token: string) {
    return this.request<AdminRole[]>("/users/list-roles", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  async getOne(token: string, id: string) {
    return this.request<AdminUserListItem>(`/users/${id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  async create(token: string, input: AdminUserCreateInput) {
    return this.request<AdminUserListItem>("/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    })
  }

  async update(token: string, id: string, input: AdminUserUpdateInput) {
    return this.request<AdminUserListItem>(`/users/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    })
  }

  async remove(token: string, id: string) {
    return this.request<{ id: string }>(`/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
  }
}

export const adminUsersClient = new AdminUsersClient()
