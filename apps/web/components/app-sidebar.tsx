"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgeCheck,
  Banknote,
  BookCopy,
  BookMarked,
  BookOpen,
  BookUp,
  Building2,
  ClipboardList,
  House,
  Layers,
  Library,
  LogIn,
  MapPin,
  PenTool,
  Star,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { NavUser } from "@/components/nav-user"
import { isLibraryCatalogAdminRole, isLibraryStaffRole } from "@/lib/library-staff"

/** Навигация для всех посетителей (включая гостей). */
const publicNavTabs = [
  { href: "/", label: "Главная", icon: House },
  { href: "/browse", label: "Каталог книг", icon: BookOpen },
  { href: "/categories", label: "Категории", icon: Tags },
  { href: "/publishing-houses", label: "Издательства", icon: Building2 },
  { href: "/authors", label: "Авторы", icon: PenTool },
  { href: "/account", label: "Аккаунт", icon: BadgeCheck },
  { href: "/my-books", label: "Мои книги", icon: Library },
  { href: "/favorites", label: "Избранное", icon: Star },
] as const

/** Справочники, книги и залы — только SUPERUSER / ADMIN. */
const catalogAdminTabs = [
  { href: "/admin/categories", label: "Категории", icon: Tags },
  { href: "/admin/publishing-houses", label: "Издательства", icon: Building2 },
  { href: "/admin/cities", label: "Города", icon: MapPin },
  { href: "/admin/storages", label: "Залы", icon: Layers },
  { href: "/admin/authors", label: "Авторы", icon: PenTool },
  { href: "/admin/books", label: "Книги", icon: BookCopy },
] as const

const librarianStaffTabs = [
  { href: "/users", label: "Пользователи", icon: Users },
  { href: "/admin/book-copies", label: "Экземпляры", icon: BookCopy },
  { href: "/admin/issue-books", label: "Выдача", icon: BookUp },
  { href: "/admin/on-loan", label: "На руках", icon: BookMarked },
  { href: "/admin/fines", label: "Штрафы", icon: Banknote },
  { href: "/admin/rentals", label: "Возврат", icon: ClipboardList },
] as const

type SidebarNavItem = { href: string; label: string; icon: LucideIcon }

export function AppSidebar() {
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuth()
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
  const normalizedRoles = user?.roles?.map((role) =>
    typeof role === "string" ? role : String((role as { name?: string })?.name ?? ""),
  )
  const isStaff = isLibraryStaffRole(normalizedRoles)
  const isCatalogAdmin = isLibraryCatalogAdminRole(normalizedRoles)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  function NavRows({ items }: { items: readonly SidebarNavItem[] }) {
    return (
      <div className="flex flex-col gap-1">
        {items.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
              pathname === tab.href && "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            <tab.icon className="size-4" />
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <aside className="flex min-h-0 w-72 shrink-0 flex-col border-r bg-muted/20 p-4">
      <Link href="/" className="mb-6 shrink-0 flex cursor-pointer items-center gap-2 px-2">
        <BookOpen className="size-5" />
        <span className="text-lg font-semibold">Библиотека</span>
      </Link>

      <nav className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
        <div>
          <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Каталог и сервисы
          </p>
          <NavRows items={publicNavTabs} />
        </div>

        {mounted && isAuthenticated && isStaff ? (
          <div>
            <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Обслуживание
            </p>
            <NavRows items={librarianStaffTabs} />
          </div>
        ) : null}

        {mounted && isAuthenticated && isCatalogAdmin ? (
          <div>
            <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Администрирование
            </p>
            <NavRows items={catalogAdminTabs} />
          </div>
        ) : null}
      </nav>

      <div className="mt-auto shrink-0 border-t pt-4">
        {!mounted ? (
          <Button asChild type="button" className="w-full">
            <Link href="/login">
              <LogIn className="mr-2 size-4" />
              Войти
            </Link>
          </Button>
        ) : isAuthenticated && user ? (
          <NavUser
            user={{
              name: displayName || "Пользователь",
              email: user.email,
              roles: user.roles,
            }}
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
