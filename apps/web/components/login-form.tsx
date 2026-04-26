"use client"

import type * as React from "react"
import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { toast } from "sonner"
import Link from "next/link"
import { authClient } from "@/client/auth-client"

export function LoginForm({
  className,
  onSuccess,
  ...props
}: React.ComponentProps<"div"> & {
  onSuccess?: (payload: { accessToken: string; user: { id: string; email: string; firstName?: string; lastName?: string } }) => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    if (!email || !password) {
      toast.error("Введите email и пароль")
      return
    }

    try {
      setIsLoading(true)
      const payload = await authClient.login({ email, password })

      onSuccess?.(payload)
      toast.success("Вы успешно вошли")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка сети. Попробуйте снова."
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Вход в аккаунт</CardTitle>
          <CardDescription>Введите email и пароль для входа</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Электронная почта</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Пароль</FieldLabel>
                </div>
                <Input id="password" name="password" type="password" required />
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Входим..." : "Войти"}
                </Button>
                <FieldDescription className="text-center">
                  Нет аккаунта? <Link className="underline" href="/register">Зарегистрироваться</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
