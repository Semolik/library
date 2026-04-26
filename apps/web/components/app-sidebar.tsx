"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgeCheck,
  BookCopy,
  BookOpen,
  Building2,
  ClipboardList,
  House,
  Layers,
  Library,
  ListFilter,
  LogIn,
  MapPin,
  PenTool,
  Tags,
  Users,
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
  { href: "/account", label: "Аккаунт", icon: BadgeCheck },
] as const

const adminTabs = [
  { href: "/admin", label: "Админка", icon: Layers },
  { href: "/users", label: "Пользователи", icon: Users },
  { href: "/admin/categories", label: "Категории", icon: Tags },
  { href: "/admin/publishing-houses", label: "Издательства", icon: Building2 },
  { href: "/admin/cities", label: "Города", icon: MapPin },
  { href: "/admin/storages", label: "Залы", icon: Layers },
  { href: "/admin/authors", label: "Авторы", icon: PenTool },
  { href: "/admin/books", label: "Книги", icon: BookCopy },
  { href: "/admin/book-copies", label: "Экземпляры", icon: BookCopy },
  { href: "/admin/rentals", label: "Аренда", icon: ClipboardList },
] as const

export function AppSidebar() {
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuth()
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
  const isAdmin = Boolean(
    user?.roles?.some((role) => {
      const roleName = typeof role === "string" ? role : String((role as { name?: string })?.name ?? "")
      return roleName === "SUPERUSER" || roleName === "ADMIN"
    }),
  )
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const visibleTabs =
    mounted && isAuthenticated && isAdmin ? [...tabs, ...adminTabs] : tabs

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r bg-muted/20 p-4">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        <BookOpen className="size-5" />
        <span className="text-lg font-semibold">Библиотека</span>
      </Link>

      <nav className="flex flex-col gap-1 overflow-y-auto pr-1">
        {visibleTabs.map((tab) => (
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
