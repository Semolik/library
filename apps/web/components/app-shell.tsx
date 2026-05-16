"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Menu, Search } from "lucide-react"
import { AppBreadcrumb } from "@/components/app-breadcrumb"
import { AppSidebar } from "@/components/app-sidebar"
import { CatalogSearchDialog } from "@/components/catalog-search-dialog"
import { NotificationBell } from "@/components/notification-bell"
import { usePageHeaderOptional } from "@/components/page-header-context"
import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

const PAGE_TITLES: Record<string, string> = {
  "/": "Главная",
  "/browse": "Каталог книг",
  "/login": "Вход",
  "/register": "Регистрация",
  "/my-books": "Мои книги",
  "/favorites": "Избранное",
  "/account": "Аккаунт",
  "/authors": "Авторы",
  "/categories": "Категории",
  "/publishing-houses": "Издательства",
  "/users": "Пользователи",
  "/admin/categories": "Категории",
  "/admin/publishing-houses": "Издательства",
  "/admin/cities": "Города",
  "/admin/storages": "Залы хранения",
  "/admin/authors": "Авторы",
  "/admin/books": "Книги",
  "/admin/book-copies": "Экземпляры книг",
  "/admin/rentals": "Выдачи и возвраты",
}

function shellFallbackTitle(pathname: string): string {
  if (/^\/admin\/books\/[^/]+$/.test(pathname)) {
    return "Книга"
  }
  if (/^\/books\/[^/]+$/.test(pathname)) {
    return "Книга в каталоге"
  }
  if (/^\/categories\/[^/]+$/.test(pathname)) {
    return "Категория"
  }
  if (/^\/publishing-houses\/[^/]+$/.test(pathname)) {
    return "Издательство"
  }
  if (/^\/authors\/[^/]+$/.test(pathname)) {
    return "Автор"
  }
  return PAGE_TITLES[pathname] ?? "Библиотека"
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const pageHeader = usePageHeaderOptional()
  const breadcrumbs = pageHeader?.breadcrumbs ?? null
  const pageTitle = shellFallbackTitle(pathname)
  const [catalogSearchOpen, setCatalogSearchOpen] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCatalogSearchOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div className="flex h-svh w-full overflow-hidden">
      <AppSidebar className="hidden md:flex" />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b bg-background px-3 py-3 sm:px-4 md:px-8 md:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="-ml-1 shrink-0 md:hidden"
                aria-label="Открыть меню"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="size-4" aria-hidden />
              </Button>
              <div className="min-w-0 flex-1 pt-1 md:pt-0">
                {breadcrumbs && breadcrumbs.length > 0 ? (
                  <AppBreadcrumb items={breadcrumbs} />
                ) : (
                  <h1 className="truncate text-sm font-medium">{pageTitle}</h1>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setCatalogSearchOpen(true)}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-xs text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              >
                <Search className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Поиск</span>
                <kbd className="pointer-events-none hidden rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground sm:inline">
                  ⌘K
                </kbd>
              </button>
              <NotificationBell />
            </div>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4 md:p-8">
          <div
            data-app-scroll-region
            className="flex min-h-0 flex-1 flex-col overflow-y-auto"
          >
            {children}
          </div>
        </main>
      </div>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[min(20rem,calc(100vw-2rem))] gap-0 p-0" showCloseButton>
          <SheetHeader className="sr-only">
            <SheetTitle>Меню</SheetTitle>
            <SheetDescription>Навигация по разделам библиотеки</SheetDescription>
          </SheetHeader>
          <AppSidebar
            className="h-full w-full border-r-0"
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <CatalogSearchDialog open={catalogSearchOpen} onOpenChange={setCatalogSearchOpen} />
    </div>
  )
}
