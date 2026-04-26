"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  House,
  Library,
  ListFilter,
  LogIn,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { NavUser } from "@/components/nav-user"

const tabs = [
  { href: "/", label: "Главная", icon: House },
  { href: "/catalog", label: "Каталог", icon: Library },
  { href: "/genres", label: "Жанры", icon: ListFilter },
  { href: "/history", label: "История", icon: BookOpen },
] as const

export function AppSidebar() {
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuth()
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r bg-muted/20 p-4">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        <BookOpen className="size-5" />
        <span className="text-lg font-semibold">Библиотека</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
              pathname === tab.href && "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            <tab.icon className="size-4" />
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t pt-4">
        {!mounted ? (
          <Button asChild type="button" className="w-full">
            <Link href="/login">
              <LogIn className="mr-2 size-4" />
              Войти
            </Link>
          </Button>
        ) : isAuthenticated && user ? (
          <NavUser
            user={{ name: displayName || "Пользователь", email: user.email }}
            onLogout={logout}
          />
        ) : (
          <Button asChild type="button" className="w-full">
            <Link href="/login">
              <LogIn className="mr-2 size-4" />
              Войти
            </Link>
          </Button>
        )}
      </div>
    </aside>
  )
}
