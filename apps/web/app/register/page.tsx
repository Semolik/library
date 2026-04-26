"use client"

import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { useAuth } from "@/components/auth-provider"
import { RegisterForm } from "@/components/register-form"

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()

  return (
    <AppShell>
      <div className="w-full max-w-sm">
        <RegisterForm
          onSuccess={(payload) => {
            login(payload.accessToken, payload.user)
            router.push("/")
          }}
        />
      </div>
    </AppShell>
  )
}
