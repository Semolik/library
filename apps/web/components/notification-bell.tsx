"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Bell, X } from "lucide-react"
import { libraryClient } from "@/client/library-client"
import { ApiError } from "@/client/api-client"
import { useAuth } from "@/components/auth-provider"
import {
  buildReaderNotifications,
  buildStaffCirculationNotifications,
  buildStaffFinesNotification,
  type AppNotificationSeverity,
  dismissNotification,
  filterVisibleNotifications,
  getDismissedNotificationIds,
} from "@/lib/library-notifications"
import { isLibraryStaffRole } from "@/lib/library-staff"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

const REFRESH_MS = 90_000

function severityDotClass(s: AppNotificationSeverity): string {
  if (s === "critical") return "bg-destructive"
  if (s === "warning") return "bg-amber-500"
  return "bg-primary"
}

export function NotificationBell() {
  const { isHydrated, isAuthenticated, token, user } = useAuth()
  const [borrowed, setBorrowed] = useState<Awaited<ReturnType<typeof libraryClient.listBorrowedBooks>> | null>(null)
  const [personalBorrowed, setPersonalBorrowed] = useState<Awaited<
    ReturnType<typeof libraryClient.listBorrowedBooks>
  > | null>(null)
  const [fines, setFines] = useState<Awaited<ReturnType<typeof libraryClient.listFines>> | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const staff = isLibraryStaffRole(user?.roles)
  const userId = user?.id ?? ""

  const load = useCallback(async () => {
    if (!token?.trim() || !userId) return
    try {
      if (staff) {
        const [b, f, personal] = await Promise.all([
          libraryClient.listBorrowedBooks(token, { soonDays: 7 }),
          libraryClient.listFines(token),
          libraryClient.listBorrowedBooks(token, { soonDays: 7, userId }),
        ])
        setBorrowed(b)
        setFines(f)
        setPersonalBorrowed(personal)
      } else {
        const b = await libraryClient.listBorrowedBooks(token, { soonDays: 7, userId })
        setBorrowed(b)
        setFines(null)
        setPersonalBorrowed(null)
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        return
      }
      setBorrowed(null)
      setFines(null)
      setPersonalBorrowed(null)
    }
  }, [token, userId, staff])

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !userId) return
    setDismissed(getDismissedNotificationIds(userId))
  }, [isHydrated, isAuthenticated, userId])

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !token || !userId) return
    void load()
  }, [isHydrated, isAuthenticated, token, userId, load])

  useEffect(() => {
    if (!token?.trim() || !userId) return
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return
      void load()
    }
    const id = window.setInterval(tick, REFRESH_MS)
    document.addEventListener("visibilitychange", tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [token, userId, load])

  const allNotifications = useMemo(() => {
    if (staff) {
      const fromCirc = buildStaffCirculationNotifications(borrowed)
      const fromFines = buildStaffFinesNotification(fines)
      const fromPersonal = buildReaderNotifications(personalBorrowed)
      const merged = [...fromCirc, ...(fromFines ? [fromFines] : []), ...fromPersonal]
      const byId = new Map<string, (typeof merged)[0]>()
      for (const n of merged) {
        if (!byId.has(n.id)) byId.set(n.id, n)
      }
      return [...byId.values()]
    }
    return buildReaderNotifications(borrowed)
  }, [staff, borrowed, fines, personalBorrowed])

  const visible = useMemo(
    () => filterVisibleNotifications(allNotifications, dismissed),
    [allNotifications, dismissed],
  )

  const handleDismiss = (nid: string) => {
    if (!userId) return
    dismissNotification(userId, nid)
    setDismissed(getDismissedNotificationIds(userId))
  }

  if (!isHydrated || !isAuthenticated || !token || !user) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative shrink-0"
          aria-label="Уведомления"
        >
          <Bell className="size-4" />
          {visible.length > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {visible.length > 9 ? "9+" : visible.length}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)] p-0" sideOffset={8}>
        <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold">Уведомления</DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        <div className="max-h-[min(24rem,50vh)] overflow-y-auto">
          {visible.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">Сейчас всё спокойно.</p>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((n) => (
                <li key={n.id} className="flex gap-2 px-3 py-3">
                  <span
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", severityDotClass(n.severity))}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{n.description}</p>
                    {n.actionHref ? (
                      <Link
                        href={n.actionHref}
                        className="inline-block text-xs font-medium text-primary underline underline-offset-4 hover:no-underline"
                      >
                        {n.actionLabel ?? "Перейти"}
                      </Link>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Скрыть уведомление"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDismiss(n.id)
                    }}
                  >
                    <X className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground leading-snug">
          Данные о выдачах и штрафах обновляются при открытии и раз в ~1,5 мин., а также при возврате на вкладку.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
