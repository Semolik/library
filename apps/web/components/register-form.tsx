"use client"

import type * as React from "react"
import { useState } from "react"
import Link from "next/link"
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
import { authClient } from "@/client/auth-client"

export function RegisterForm({
  className,
  onSuccess,
  ...props
}: React.ComponentProps<"div"> & {
  onSuccess?: (payload: {
    accessToken: string
    user: { id: string; email: string; firstName?: string; lastName?: string }
  }) => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    const firstName = String(formData.get("firstName") ?? "").trim()
    const lastName = String(formData.get("lastName") ?? "").trim()

    if (!email || !password) {
      toast.error("Введите email и пароль")
      return
    }

    try {
      setIsLoading(true)
      const payload = await authClient.register({
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      })
      onSuccess?.(payload)
      toast.success("Регистрация выполнена")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка сети. Попробуйте снова."
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("mx-auto flex w-full max-w-md flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт для работы с библиотекой</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="firstName">Имя</FieldLabel>
                <Input id="firstName" name="firstName" type="text" placeholder="Иван" />
              </Field>
              <Field>
                <FieldLabel htmlFor="lastName">Фамилия</FieldLabel>
                <Input id="lastName" name="lastName" type="text" placeholder="Иванов" />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Электронная почта</FieldLabel>
                <Input id="email" name="email" type="email" placeholder="name@example.com" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Пароль</FieldLabel>
                <Input id="password" name="password" type="password" required />
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Регистрируем..." : "Зарегистрироваться"}
                </Button>
                <FieldDescription className="text-center">
                  Уже есть аккаунт? <Link className="underline" href="/login">Войти</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
