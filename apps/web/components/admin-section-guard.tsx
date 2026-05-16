"use client"

import * as React from "react"
import { AppShell } from "@/components/app-shell"
import { CenteredFormShell } from "@/components/centered-form-shell"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/components/auth-provider"
import type { PageBreadcrumbItem } from "@/components/page-header-context"
import { usePageHeaderOptional } from "@/components/page-header-context"
import { cn } from "@workspace/ui/lib/utils"
import { isLibraryCatalogAdminRole, isLibraryStaffRole } from "@/lib/library-staff"

type AdminSectionGuardProps = {
  title: string
  /** Строка или JSX под заголовком. */
  description?: React.ReactNode
  /** Если задано — заменяет цепочку по умолчанию «Главная → title». */
  breadcrumbTrail?: PageBreadcrumbItem[]
  /** Дополнительные классы внешнего контейнера контента. */
  contentClassName?: string
  /** Только SUPERUSER / ADMIN: справочники, книги, залы. */
  requireCatalogAdmin?: boolean
  children: React.ReactNode
}

export function AdminSectionGuard({
  title,
  description,
  breadcrumbTrail,
  contentClassName,
  requireCatalogAdmin,
  children,
}: AdminSectionGuardProps) {
  const { isHydrated, isAuthenticated, user, login } = useAuth()
  const isStaff = isLibraryStaffRole(user?.roles)

  const pageHeader = usePageHeaderOptional()

  const resolvedTrail = React.useMemo(() => {
    if (breadcrumbTrail?.length) return breadcrumbTrail
    return [{ label: "Главная", href: "/" }, { label: title }] satisfies PageBreadcrumbItem[]
  }, [breadcrumbTrail, title])

  const showStaffBreadcrumb = Boolean(isHydrated && isAuthenticated && isStaff)

  React.useEffect(() => {
    if (!pageHeader) return
    if (!showStaffBreadcrumb) {
      pageHeader.setBreadcrumbs(null)
      return
    }
    pageHeader.setBreadcrumbs(resolvedTrail)
    return () => pageHeader.setBreadcrumbs(null)
  }, [pageHeader, resolvedTrail, showStaffBreadcrumb])

  if (!isHydrated) {
    return (
      <AppShell>
        <CenteredFormShell>
          <div className="w-full max-w-md rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            Загрузка...
          </div>
        </CenteredFormShell>
      </AppShell>
    )
  }

  if (!isAuthenticated) {
    return (
      <AppShell>
        <CenteredFormShell>
          <LoginForm
            onSuccess={(payload) => {
              login(payload.accessToken, payload.user)
            }}
          />
        </CenteredFormShell>
      </AppShell>
    )
  }

  if (!isStaff) {
    return (
      <AppShell>
        <CenteredFormShell>
          <div className="w-full max-w-lg rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Этот раздел доступен только администратору библиотеки или библиотекарю.
            </p>
          </div>
        </CenteredFormShell>
      </AppShell>
    )
  }

  if (requireCatalogAdmin && !isLibraryCatalogAdminRole(user?.roles)) {
    return (
      <AppShell>
        <CenteredFormShell>
          <div className="w-full max-w-lg rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Раздел ведения каталога и справочников доступен только администратору библиотеки.
            </p>
          </div>
        </CenteredFormShell>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div
        className={cn(
          "flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4",
          contentClassName,
        )}
      >
        {description ? (
          <div className="min-w-0 max-w-full space-y-2 text-sm leading-relaxed text-muted-foreground text-pretty">
            {description}
          </div>
        ) : null}
        {children}
      </div>
    </AppShell>
  )
}
