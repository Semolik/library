"use client"

import Link from "next/link"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { AdminFormSelect } from "@/components/admin-form-select"
import { AdminMultiSelect } from "@/components/admin-multi-select"
import { AppShell } from "@/components/app-shell"
import { CenteredFormShell } from "@/components/centered-form-shell"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/components/auth-provider"
import { usePageHeaderOptional } from "@/components/page-header-context"
import { adminUsersClient, type AdminRole, type AdminUserListItem } from "@/client/admin-users-client"
import { ApiError } from "@/client/api-client"
import { libraryClient, type LibraryBorrowedBookRow } from "@/client/library-client"
import { isLibraryStaffRole } from "@/lib/library-staff"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

const ROLE_LABELS: Record<string, string> = {
  SUPERUSER: "Суперпользователь",
  ADMIN: "Администратор библиотеки",
  LIBRARIAN: "Библиотекарь",
  USER: "Читатель",
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPERUSER: "Технический полный доступ ко всем операциям.",
  ADMIN: "Управление персоналом, ролями библиотекаря и администратора, данными системы.",
  LIBRARIAN: "Экземпляры и обращение книг, читатели; без ведения справочников и карточек.",
  USER: "Каталог, личный кабинет, история выдач.",
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

const FILTER_ALL = "__all__"

const USER_FILTER_DEBOUNCE_MS = 350

export default function UsersPage() {
  const { isHydrated, isAuthenticated, token, user, login, logout } = useAuth()

  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editMode, setEditMode] = useState<EditMode>(null)
  const [formState, setFormState] = useState<FormState>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fioInput, setFioInput] = useState("")
  const [debouncedFio, setDebouncedFio] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [debouncedEmail, setDebouncedEmail] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>(FILTER_ALL)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const filterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fioFilterFieldId = useId()
  const emailFilterFieldId = useId()
  const statusFilterFieldId = useId()
  const roleFilterFieldId = useId()

  const [borrowedSnapshot, setBorrowedSnapshot] = useState<LibraryBorrowedBookRow[]>([])

  const getRoleLabel = (name: string) => ROLE_LABELS[name] ?? name
  const getRoleDescription = (name: string, fallback?: string | null) =>
    ROLE_DESCRIPTIONS[name] ?? fallback ?? ""

  const isStaff = useMemo(() => isLibraryStaffRole(user?.roles), [user?.roles])

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

  const fetchBorrowedSnapshot = useCallback(async () => {
    if (!token) return
    try {
      const res = await libraryClient.listBorrowedBooks(token, { soonDays: 7 })
      setBorrowedSnapshot(res.items)
    } catch {
      /* список «на руках» необязателен для таблицы пользователей */
    }
  }, [token])

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !isStaff) return
    void fetchData()
  }, [isHydrated, isAuthenticated, isStaff, fetchData])

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !isStaff) return
    void fetchBorrowedSnapshot()
  }, [isHydrated, isAuthenticated, isStaff, fetchBorrowedSnapshot])

  useEffect(() => {
    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current)
    filterDebounceRef.current = setTimeout(() => {
      filterDebounceRef.current = null
      setDebouncedFio(fioInput.trim())
      setDebouncedEmail(emailInput.trim())
    }, USER_FILTER_DEBOUNCE_MS)
    return () => {
      if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current)
    }
  }, [fioInput, emailInput])

  const filteredUsers = useMemo(() => {
    const fio = debouncedFio.trim().toLowerCase()
    const emailQ = debouncedEmail.trim().toLowerCase()

    return users.filter((row) => {
      if (fio) {
        const ln = (row.lastName ?? "").trim().toLowerCase()
        const fn = (row.firstName ?? "").trim().toLowerCase()
        const joinedFnLn = `${fn} ${ln}`.trim()
        const joinedLnFn = `${ln} ${fn}`.trim()
        const matchesFio =
          fn.includes(fio) ||
          ln.includes(fio) ||
          joinedFnLn.includes(fio) ||
          joinedLnFn.includes(fio)
        if (!matchesFio) return false
      }

      if (emailQ && !row.email.toLowerCase().includes(emailQ)) return false

      if (roleFilter !== FILTER_ALL && !row.roles.some((r) => r.name === roleFilter)) return false

      if (statusFilter === "active" && !row.isActive) return false
      if (statusFilter === "inactive" && row.isActive) return false

      return true
    })
  }, [users, debouncedFio, debouncedEmail, roleFilter, statusFilter])

  const borrowedStatsByUserId = useMemo(() => {
    const m = new Map<string, { total: number; overdue: number; dueSoon: number }>()
    for (const row of borrowedSnapshot) {
      const cur = m.get(row.userId) ?? { total: 0, overdue: 0, dueSoon: 0 }
      cur.total++
      if (row.urgency === "overdue") cur.overdue++
      if (row.urgency === "due_soon") cur.dueSoon++
      m.set(row.userId, cur)
    }
    return m
  }, [borrowedSnapshot])

  const statusFilterSelectValue = statusFilter === "all" ? FILTER_ALL : statusFilter

  const roleFilterOptions = useMemo(
    () => [
      { value: FILTER_ALL, label: "Все роли" },
      ...roles.map((role) => ({
        value: role.name,
        label: ROLE_LABELS[role.name] ?? role.name,
      })),
    ],
    [roles],
  )

  const statusFilterOptions = useMemo(
    () => [
      { value: FILTER_ALL, label: "Все статусы" },
      { value: "active", label: "Только активные" },
      { value: "inactive", label: "Только заблокированные" },
    ],
    [],
  )

  const pageHeader = usePageHeaderOptional()
  const usersBreadcrumbs = useMemo(
    () => [{ label: "Главная", href: "/" }, { label: "Пользователи" }],
    [],
  )

  useEffect(() => {
    if (!pageHeader) return
    if (!isHydrated || !isAuthenticated || !isStaff) {
      pageHeader.setBreadcrumbs(null)
      return
    }
    pageHeader.setBreadcrumbs(usersBreadcrumbs)
    return () => pageHeader.setBreadcrumbs(null)
  }, [pageHeader, isHydrated, isAuthenticated, isStaff, usersBreadcrumbs])

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

  function commitUsersFiltersImmediate() {
    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current)
      filterDebounceRef.current = null
    }
    setDebouncedFio(fioInput.trim())
    setDebouncedEmail(emailInput.trim())
  }

  if (!isHydrated) {
    return (
      <AppShell>
        <CenteredFormShell>
          <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            Загрузка...
          </div>
        </CenteredFormShell>
      </AppShell>
    )
  }

  if (!isAuthenticated || !token) {
    return (
      <AppShell>
        <CenteredFormShell>
          <LoginForm
            onSuccess={(payload) => {
              login(payload.accessToken, payload.user)
            }}
          />
        </CenteredFormShell>
      </AppShell>
    )
  }

  if (!isStaff) {
    return (
      <AppShell>
        <CenteredFormShell>
          <div className="w-full max-w-lg rounded-lg border bg-card p-6">
            <h1 className="text-xl font-semibold">Пользователи</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Этот раздел доступен только администратору библиотеки или библиотекарю.
            </p>
          </div>
        </CenteredFormShell>
      </AppShell>
    )
  }

  const isDialogOpen = editMode !== null
  const editingUser = editMode?.mode === "edit" ? editMode.user : null

  return (
    <AppShell>
      <div className="w-full space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          <Field className="min-w-[180px] flex-1 sm:max-w-xs">
            <FieldLabel htmlFor={fioFilterFieldId}>Поиск по ФИО</FieldLabel>
            <Input
              id={fioFilterFieldId}
              value={fioInput}
              onChange={(event) => setFioInput(event.target.value)}
              placeholder="Имя или фамилия…"
              aria-busy={isLoading}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  commitUsersFiltersImmediate()
                }
              }}
            />
          </Field>
          <Field className="min-w-[180px] flex-1 sm:max-w-xs">
            <FieldLabel htmlFor={emailFilterFieldId}>Фильтр по email</FieldLabel>
            <Input
              id={emailFilterFieldId}
              type="search"
              autoComplete="off"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="Фрагмент адреса…"
              aria-busy={isLoading}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  commitUsersFiltersImmediate()
                }
              }}
            />
          </Field>
          <div className="min-w-[180px] flex-1 sm:max-w-[220px]">
            <AdminFormSelect
              id={statusFilterFieldId}
              label="Статус"
              value={statusFilterSelectValue}
              onValueChange={(v) => {
                if (v === FILTER_ALL) setStatusFilter("all")
                else if (v === "active") setStatusFilter("active")
                else setStatusFilter("inactive")
              }}
              placeholder="Все статусы"
              options={statusFilterOptions}
            />
          </div>
          <div className="min-w-[200px] flex-1 sm:max-w-[260px]">
            <AdminFormSelect
              id={roleFilterFieldId}
              label="Роль"
              value={roleFilter}
              onValueChange={setRoleFilter}
              placeholder="Все роли"
              options={roleFilterOptions}
            />
          </div>
          <Button type="button" className="shrink-0" onClick={openCreate}>
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
                <th className="px-4 py-3 font-medium">На руках</th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && users.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                    Загрузка...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                    Пользователей нет
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                    Ничего не найдено
                  </td>
                </tr>
              ) : (
                filteredUsers.map((row) => {
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
                      <td className="px-4 py-3 align-top">
                        {(() => {
                          const st = borrowedStatsByUserId.get(row.id)
                          if (!st || st.total === 0) {
                            return <span className="text-muted-foreground">—</span>
                          }
                          return (
                            <Link
                              href={`/admin/on-loan?userId=${row.id}`}
                              className="inline-flex flex-col gap-1 text-sm text-primary underline-offset-4 hover:underline"
                            >
                              <span className="font-medium text-foreground">{st.total} на руках</span>
                              {st.overdue > 0 ? (
                                <span className="text-xs font-medium text-destructive">
                                  просрочено: {st.overdue}
                                </span>
                              ) : null}
                              {st.dueSoon > 0 ? (
                                <span className="text-xs text-amber-700 dark:text-amber-400">
                                  скоро срок: {st.dueSoon}
                                </span>
                              ) : null}
                            </Link>
                          )
                        })()}
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

                <AdminFormSelect
                  id="user-active"
                  label="Статус"
                  value={formState.isActive ? "true" : "false"}
                  onValueChange={(v) =>
                    setFormState((prev) => ({ ...prev, isActive: v === "true" }))
                  }
                  placeholder="Выберите статус"
                  options={[
                    { value: "true", label: "Активен" },
                    { value: "false", label: "Заблокирован" },
                  ]}
                />

                <AdminMultiSelect
                  label="Роли"
                  value={formState.roles}
                  onChange={(next) => setFormState((prev) => ({ ...prev, roles: next }))}
                  placeholder="Добавить роль"
                  options={roles.map((role) => ({
                    value: role.name,
                    label: getRoleDescription(role.name, role.description)
                      ? `${getRoleLabel(role.name)} — ${getRoleDescription(role.name, role.description)}`
                      : getRoleLabel(role.name),
                  }))}
                  disabled={roles.length === 0}
                />

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
