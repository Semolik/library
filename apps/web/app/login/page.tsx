"use client"

import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { CenteredFormShell } from "@/components/centered-form-shell"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/components/auth-provider"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  return (
    <AppShell>
      <CenteredFormShell>
        <LoginForm
          onSuccess={(payload) => {
            login(payload.accessToken, payload.user)
            router.push("/")
          }}
        />
      </CenteredFormShell>
    </AppShell>
  )
}
