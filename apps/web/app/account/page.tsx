"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { CenteredFormShell } from "@/components/centered-form-shell"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/components/auth-provider"
import { userClient } from "@/client/user-client"
import { ApiError } from "@/client/api-client"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export default function AccountPage() {
  const { isHydrated, isAuthenticated, token, user, login, setUser, logout } = useAuth()
  const [firstName, setFirstName] = useState(user?.firstName ?? "")
  const [lastName, setLastName] = useState(user?.lastName ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !token) return
    void userClient
      .getMe(token)
      .then((profile) => {
        setEmail(profile.email)
        setFirstName(profile.firstName ?? "")
        setLastName(profile.lastName ?? "")
        setUser({
          id: profile.id,
          email: profile.email,
          firstName: profile.firstName ?? undefined,
          lastName: profile.lastName ?? undefined,
          roles: profile.roles?.map((r) => r.name),
        })
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          logout()
          toast.error("Сессия истекла. Выполните вход снова.")
          return
        }
        const message = error instanceof Error ? error.message : "Не удалось загрузить профиль."
        toast.error(message)
      })
  }, [isHydrated, isAuthenticated, token, setUser, logout])

  if (!isHydrated) {
    return (
      <AppShell>
        <CenteredFormShell>
          <div className="w-full max-w-md rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            Загрузка профиля...
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    const formData = new FormData(event.currentTarget)
    const nextEmail = String(formData.get("email") ?? "").trim()
    const nextFirstName = String(formData.get("firstName") ?? "").trim()
    const nextLastName = String(formData.get("lastName") ?? "").trim()

    try {
      setIsSaving(true)
      await userClient.updateMe(token, {
        email: nextEmail,
        firstName: nextFirstName || undefined,
        lastName: nextLastName || undefined,
      })

      const freshProfile = await userClient.getMe(token)
      setEmail(freshProfile.email)
      setFirstName(freshProfile.firstName ?? "")
      setLastName(freshProfile.lastName ?? "")
      setUser({
        id: freshProfile.id,
        email: freshProfile.email,
        firstName: freshProfile.firstName ?? undefined,
        lastName: freshProfile.lastName ?? undefined,
        roles: freshProfile.roles?.map((r) => r.name),
      })
      toast.success("Профиль обновлён")
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        toast.error("Сессия истекла. Выполните вход снова.")
        return
      }
      const message = error instanceof Error ? error.message : "Не удалось обновить профиль."
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppShell>
      <CenteredFormShell>
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Аккаунт</CardTitle>
              <CardDescription>Редактирование профиля пользователя</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="firstName">Имя</FieldLabel>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="lastName">Фамилия</FieldLabel>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Электронная почта</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Сохраняем..." : "Сохранить изменения"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </CenteredFormShell>
    </AppShell>
  )
}
