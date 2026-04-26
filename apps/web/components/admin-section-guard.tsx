"use client"

import { AppShell } from "@/components/app-shell"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/components/auth-provider"

type AdminSectionGuardProps = {
  title: string
  description?: string
  children: React.ReactNode
}

const ADMIN_ROLES = ["SUPERUSER", "ADMIN"]

export function AdminSectionGuard({ title, description, children }: AdminSectionGuardProps) {
  const { isHydrated, isAuthenticated, user, login } = useAuth()
  const isAdmin = Boolean(user?.roles?.some((role) => ADMIN_ROLES.includes(role)))

  if (!isHydrated) {
    return (
      <AppShell>
        <div className="w-full max-w-3xl rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Загрузка...
        </div>
      </AppShell>
    )
  }

  if (!isAuthenticated) {
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
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Этот раздел доступен только администраторам.
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="w-full max-w-4xl space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </div>
    </AppShell>
  )
}
