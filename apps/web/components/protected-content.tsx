"use client"

import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/components/auth-provider"

export function ProtectedContent({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  const { isAuthenticated, login } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-sm">
        <LoginForm
          onSuccess={(payload) => {
            login(payload.accessToken, payload.user)
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl rounded-lg border bg-card p-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </div>
  )
}
