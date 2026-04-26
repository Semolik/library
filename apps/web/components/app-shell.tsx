"use client"

import type * as React from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"

const PAGE_TITLES: Record<string, string> = {
  "/": "Главная",
  "/login": "Вход",
  "/register": "Регистрация",
  "/catalog": "Каталог",
  "/genres": "Жанры",
  "/history": "История",
  "/account": "Аккаунт",
  "/users": "Пользователи",
  "/admin": "Админка",
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const pageTitle = PAGE_TITLES[pathname] ?? "Библиотека"

  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b bg-background px-6 py-4 md:px-8">
          <h1 className="text-lg font-semibold">{pageTitle}</h1>
        </header>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
