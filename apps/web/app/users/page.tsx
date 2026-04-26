"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/components/auth-provider"
import { adminUsersClient, type AdminRole, type AdminUserListItem } from "@/client/admin-users-client"
import { ApiError } from "@/client/api-client"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

const ADMIN_ROLES = ["SUPERUSER", "ADMIN"]

const ROLE_LABELS: Record<string, string> = {
  SUPERUSER: "Суперпользователь",
  ADMIN: "Администратор",
  USER: "Пользователь",
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPERUSER: "Полный доступ ко всем разделам и операциям.",
  ADMIN: "Доступ к админке и управлению пользователями.",
  USER: "Базовый доступ к пользовательским разделам.",
}

type EditMode = { mode: "create" } | { mode: "edit"; user: AdminUserListItem } | null

type FormState = {
  email: string
  password: string
  firstName: string
  lastName: string
  isActive: boolean
  roles: string[]
}

const initialForm: FormState = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  isActive: true,
  roles: [],
}

export default function UsersPage() {
  const { isHydrated, isAuthenticated, token, user, login, logout } = useAuth()

  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editMode, setEditMode] = useState<EditMode>(null)
  const [formState, setFormState] = useState<FormState>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getRoleLabel = (name: string) => ROLE_LABELS[name] ?? name
  const getRoleDescription = (name: string, fallback?: string | null) =>
    ROLE_DESCRIPTIONS[name] ?? fallback ?? ""

  const isAdmin = useMemo(
    () => Boolean(user?.roles?.some((role) => ADMIN_ROLES.includes(role))),
    [user?.roles],
  )

  const handleAuthError = useCallback(
    (error: unknown, fallback: string) => {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        toast.error("Сессия истекла. Выполните вход снова.")
        return
      }
      const message = error instanceof Error ? error.message : fallback
      toast.error(message)
    },
    [logout],
  )

  const fetchData = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const [usersList, rolesList] = await Promise.all([
        adminUsersClient.list(token),
        adminUsersClient.listRoles(token),
      ])
      setUsers(usersList)
      setRoles(rolesList)
    } catch (error) {
      handleAuthError(error, "Не удалось загрузить пользователей.")
    } finally {
      setIsLoading(false)
    }
  }, [token, handleAuthError])

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !isAdmin) return
    void fetchData()
  }, [isHydrated, isAuthenticated, isAdmin, fetchData])

  const openCreate = () => {
    setFormState(initialForm)
    setEditMode({ mode: "create" })
  }

  const openEdit = (target: AdminUserListItem) => {
    setFormState({
      email: target.email,
      password: "",
      firstName: target.firstName ?? "",
      lastName: target.lastName ?? "",
      isActive: target.isActive,
      roles: target.roles.map((role) => role.name),
    })
    setEditMode({ mode: "edit", user: target })
  }

  const closeDialog = () => setEditMode(null)

  const toggleRole = (name: string) => {
    setFormState((prev) => ({
      ...prev,
      roles: prev.roles.includes(name)
        ? prev.roles.filter((role) => role !== name)
        : [...prev.roles, name],
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !editMode) return

    const trimmedEmail = formState.email.trim()
    if (!trimmedEmail) {
      toast.error("Введите email.")
      return
    }

    if (editMode.mode === "create" && formState.password.length < 8) {
      toast.error("Пароль должен быть не короче 8 символов.")
      return
    }

    setIsSubmitting(true)
    try {
      if (editMode.mode === "create") {
        await adminUsersClient.create(token, {
          email: trimmedEmail,
          password: formState.password,
          firstName: formState.firstName.trim() || undefined,
          lastName: formState.lastName.trim() || undefined,
          isActive: formState.isActive,
          roles: formState.roles,
        })
        toast.success("Пользователь создан")
      } else {
        await adminUsersClient.update(token, editMode.user.id, {
          email: trimmedEmail,
          firstName: formState.firstName.trim() || null,
          lastName: formState.lastName.trim() || null,
          isActive: formState.isActive,
          roles: formState.roles,
        })
        toast.success("Пользователь обновлён")
      }
      closeDialog()
      await fetchData()
    } catch (error) {
      handleAuthError(error, "Не удалось сохранить пользователя.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (target: AdminUserListItem) => {
    if (!token) return
    if (target.id === user?.id) {
      toast.error("Нельзя удалить собственный аккаунт.")
      return
    }
    if (!window.confirm(`Удалить пользователя ${target.email}?`)) return

    try {
      await adminUsersClient.remove(token, target.id)
      toast.success("Пользователь удалён")
      await fetchData()
    } catch (error) {
      handleAuthError(error, "Не удалось удалить пользователя.")
    }
  }

  if (!isHydrated) {
    return (
      <AppShell>
        <div className="w-full max-w-3xl rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Загрузка...
        </div>
      </AppShell>
    )
  }

  if (!isAuthenticated || !token) {
    return (
      <AppShell>
        <div className="w-full max-w-sm">
          <LoginForm
            onSuccess={(payload) => {
              login(payload.accessToken, payload.user)
            }}
          />
        </div>
      </AppShell>
    )
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="w-full max-w-3xl rounded-lg border bg-card p-6">
          <h1 className="text-xl font-semibold">Пользователи</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Этот раздел доступен только администраторам.
          </p>
        </div>
      </AppShell>
    )
  }

  const isDialogOpen = editMode !== null
  const editingUser = editMode?.mode === "edit" ? editMode.user : null

  return (
    <AppShell>
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Управление учётными записями и ролями</p>
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Создать
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">Роли</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && users.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                    Загрузка...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                    Пользователей нет
                  </td>
                </tr>
              ) : (
                users.map((row) => {
                  const fullName = [row.firstName, row.lastName].filter(Boolean).join(" ")
                  return (
                    <tr key={row.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {fullName || <span className="italic">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {row.roles.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">нет</span>
                          ) : (
                            row.roles.map((role) => (
                              <span
                                key={role.id}
                                className="rounded-md border bg-muted/40 px-2 py-0.5 text-xs"
                              >
                                {getRoleLabel(role.name)}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            "rounded-md px-2 py-0.5 text-xs " +
                            (row.isActive
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-destructive/10 text-destructive")
                          }
                        >
                          {row.isActive ? "Активен" : "Заблокирован"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="mr-2 size-3.5" />
                            Изменить
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(row)}
                            disabled={row.id === user?.id}
                          >
                            <Trash2 className="mr-2 size-3.5" />
                            Удалить
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Редактирование пользователя" : "Новый пользователь"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? `Изменение данных и ролей для ${editingUser.email}`
                : "Создание учётной записи и назначение ролей"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="user-email">Электронная почта</FieldLabel>
                  <Input
                    id="user-email"
                    name="email"
                    type="email"
                    value={formState.email}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                  />
                </Field>
                {!editingUser && (
                  <Field>
                    <FieldLabel htmlFor="user-password">Пароль</FieldLabel>
                    <Input
                      id="user-password"
                      name="password"
                      type="password"
                      value={formState.password}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, password: event.target.value }))
                      }
                      required
                      minLength={8}
                    />
                  </Field>
                )}
                <Field>
                  <FieldLabel htmlFor="user-first-name">Имя</FieldLabel>
                  <Input
                    id="user-first-name"
                    value={formState.firstName}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, firstName: event.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="user-last-name">Фамилия</FieldLabel>
                  <Input
                    id="user-last-name"
                    value={formState.lastName}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                  />
                </Field>

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="user-active"
                    checked={formState.isActive}
                    onCheckedChange={(checked) =>
                      setFormState((prev) => ({ ...prev, isActive: checked === true }))
                    }
                  />
                  <Label htmlFor="user-active">Активен</Label>
                </div>

                <div className="space-y-2 pt-2">
                  <Label>Роли</Label>
                  <div className="flex flex-col gap-2 rounded-md border p-3">
                    {roles.length === 0 ? (
                      <span className="text-xs text-muted-foreground">Роли не загружены</span>
                    ) : (
                      roles.map((role) => {
                        const checked = formState.roles.includes(role.name)
                        return (
                          <label
                            key={role.id}
                            className="flex items-start gap-2 text-sm"
                            htmlFor={`role-${role.id}`}
                          >
                            <Checkbox
                              id={`role-${role.id}`}
                              checked={checked}
                              onCheckedChange={() => toggleRole(role.name)}
                            />
                            <span>
                              <span className="font-medium">{getRoleLabel(role.name)}</span>
                              {getRoleDescription(role.name, role.description) ? (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {getRoleDescription(role.name, role.description)}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>
              </FieldGroup>
            <DialogFooter className="border-t pt-4">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Сохраняем..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
