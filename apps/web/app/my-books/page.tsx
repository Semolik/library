"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { BookOpen, ImageIcon } from "lucide-react"
import {
  dueHumanPhrase,
  formatRuDateFromIso,
  formatRub,
  urgencyLabel,
} from "@/app/admin/rent-helpers"
import {
  libraryClient,
  type LibraryBorrowedBookRow,
  type LibraryBorrowedBooksResponse,
  type LibraryFineLedgerRow,
} from "@/client/library-client"
import { libraryPublicClient } from "@/client/library-public-client"
import { ApiError } from "@/client/api-client"
import { AppShell } from "@/components/app-shell"
import { CenteredFormShell } from "@/components/centered-form-shell"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/components/auth-provider"
import { BOOK_CARD_GRID_CLASS } from "@/lib/book-card-grid"
import { isLibraryStaffRole } from "@/lib/library-staff"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type TabKey = "active" | "history"

function urgencyBadgeVariant(
  u: LibraryBorrowedBookRow["urgency"],
): "destructive" | "secondary" | "outline" {
  if (u === "overdue") return "destructive"
  if (u === "due_soon") return "secondary"
  return "outline"
}

/** Вертикальная обложка на всю ширину ячейки — заполняет блок, без полос. */
function MyBookCover({ bookId }: { bookId: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [pending, setPending] = useState(true)

  useEffect(() => {
    let cancelled = false
    void libraryPublicClient
      .getCoverUrl(bookId)
      .then((r) => {
        if (!cancelled) setUrl(r.url)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })
      .finally(() => {
        if (!cancelled) setPending(false)
      })
    return () => {
      cancelled = true
    }
  }, [bookId])

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-muted/70 text-muted-foreground">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="absolute inset-0 size-full min-h-0 object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          {pending ? (
            <ImageIcon className="size-8 animate-pulse opacity-35" aria-hidden />
          ) : (
            <BookOpen className="size-10 opacity-40" aria-hidden />
          )}
        </div>
      )}
    </div>
  )
}

export default function MyBooksPage() {
  const { isHydrated, isAuthenticated, token, user, login } = useAuth()
  const [tab, setTab] = useState<TabKey>("active")
  const [soonDays] = useState(7)
  const [activeData, setActiveData] = useState<LibraryBorrowedBooksResponse | null>(null)
  const [historyItems, setHistoryItems] = useState<LibraryFineLedgerRow[] | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    if (!token || !user?.id) return
    setLoading(true)
    try {
      const [active, hist] = await Promise.all([
        libraryClient.listBorrowedBooks(token, {
          soonDays,
          userId: user.id,
        }),
        libraryClient.listMyRentHistory(token),
      ])
      setActiveData(active)
      setHistoryItems(hist.items)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось загрузить данные."
      toast.error(msg)
      if (e instanceof ApiError && e.status === 401) {
        return
      }
      setActiveData(null)
      setHistoryItems(null)
    } finally {
      setLoading(false)
    }
  }, [token, user?.id, soonDays])

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !token || !user?.id) return
    void loadAll()
  }, [isHydrated, isAuthenticated, token, user?.id, loadAll])

  const staff = isLibraryStaffRole(user?.roles)

  const activeRows = activeData?.items ?? []
  const historyRows = useMemo(() => historyItems ?? [], [historyItems])

  const activeTotalLabel = loading && activeData === null ? "…" : String(activeData?.summary.total ?? 0)
  const historyTotalLabel =
    loading && historyItems === null ? "…" : String(historyItems?.length ?? 0)

  if (!isHydrated) {
    return (
      <AppShell>
        <CenteredFormShell>
          <p className="w-full max-w-md text-center text-sm text-muted-foreground">Загрузка…</p>
        </CenteredFormShell>
      </AppShell>
    )
  }

  if (!isAuthenticated || !token || !user?.id) {
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

  return (
    <AppShell>
      <div className="flex w-full flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold">Мои книги</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Текущие выдачи и возвращённые экземпляры. Вопросы по срокам и штрафам — к библиотекарю.
          </p>
          {staff ? (
            <p className="mt-2 text-xs text-muted-foreground">
              У вас есть доступ к{" "}
              <Link href="/admin/on-loan" className="font-medium text-primary underline underline-offset-4">
                учёту библиотеки
              </Link>
              ; здесь показаны только ваши личные выдачи.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={tab === "active" ? "default" : "outline"} onClick={() => setTab("active")}>
            Сейчас на руках
            <span className="ml-1 tabular-nums opacity-80">({activeTotalLabel})</span>
          </Button>
          <Button type="button" size="sm" variant={tab === "history" ? "default" : "outline"} onClick={() => setTab("history")}>
            История
            <span className="ml-1 tabular-nums opacity-80">({historyTotalLabel})</span>
          </Button>
        </div>

        {tab === "active" ? (
          <>
            {activeData?.summary && activeData.summary.outstandingTotalRub > 0 ? (
              <div className="rounded-lg border border-amber-600/25 bg-amber-600/5 px-4 py-3 text-sm">
                <span className="text-muted-foreground">К доплате по текущим выдачам: </span>
                <span className="font-semibold tabular-nums">{formatRub(activeData.summary.outstandingTotalRub)}</span>
              </div>
            ) : null}

            {loading && activeData === null ? (
              <p className="text-sm text-muted-foreground">Загрузка…</p>
            ) : activeRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Сейчас у вас нет выданных книг.</p>
            ) : (
              <div className={BOOK_CARD_GRID_CLASS}>
                {activeRows.map((row) => (
                  <Link
                    key={row.rentId}
                    href={`/books/${row.bookId}`}
                    className={cn(
                      "group flex min-w-0 flex-col gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      row.urgency === "overdue" &&
                        "ring-2 ring-destructive/40 ring-offset-2 ring-offset-background",
                      row.urgency === "due_soon" &&
                        "ring-2 ring-amber-500/35 ring-offset-2 ring-offset-background",
                    )}
                  >
                    <MyBookCover bookId={row.bookId} />
                    <div className="flex min-w-0 flex-col gap-1 px-0.5">
                      <span className="line-clamp-2 text-xs font-medium leading-tight text-foreground group-hover:text-primary group-hover:underline group-hover:underline-offset-2">
                        {row.bookTitle}
                      </span>
                      <p className="line-clamp-1 text-[10px] leading-snug text-muted-foreground">
                        № {row.inventoryNumber}
                        {row.storageName ? ` · ${row.storageName}` : ""}
                      </p>
                      <div className="space-y-0.5 text-[10px] leading-snug text-muted-foreground">
                        <p className="line-clamp-2">
                          <span className="font-medium text-foreground/80">Выдана </span>
                          {formatRuDateFromIso(row.rentedAt.slice(0, 10))}
                        </p>
                        {row.dueDate ? (
                          <p className="line-clamp-2">
                            <span className="font-medium text-foreground/80">До </span>
                            {formatRuDateFromIso(row.dueDate.slice(0, 10))}
                            <span className="text-muted-foreground"> · {dueHumanPhrase(row.daysUntilDue)}</span>
                          </p>
                        ) : (
                          <p className="text-muted-foreground">Срок не указан</p>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-col gap-1">
                        <Badge
                          variant={urgencyBadgeVariant(row.urgency)}
                          className="w-fit px-1.5 py-0 text-[9px] font-normal"
                        >
                          {urgencyLabel(row.urgency)}
                        </Badge>
                        {row.outstandingFineAmount > 0 ? (
                          <p className="text-[10px] font-medium tabular-nums text-destructive">
                            +{formatRub(row.outstandingFineAmount)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {loading && historyItems === null ? (
              <p className="text-sm text-muted-foreground">Загрузка…</p>
            ) : historyRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет завершённых выдач.</p>
            ) : (
              <div className={BOOK_CARD_GRID_CLASS}>
                {historyRows.map((row) => (
                  <Link
                    key={row.rentId}
                    href={`/books/${row.bookId}`}
                    className="group flex min-w-0 flex-col gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <MyBookCover bookId={row.bookId} />
                    <div className="flex min-w-0 flex-col gap-1 px-0.5">
                      <span className="line-clamp-2 text-xs font-medium leading-tight text-foreground group-hover:text-primary group-hover:underline group-hover:underline-offset-2">
                        {row.bookTitle}
                      </span>
                      <p className="line-clamp-1 text-[10px] leading-snug text-muted-foreground">
                        № {row.inventoryNumber}
                        {row.storageName ? ` · ${row.storageName}` : ""}
                      </p>
                      <div className="space-y-0.5 text-[10px] leading-snug text-muted-foreground">
                        <p className="line-clamp-1">
                          <span className="font-medium text-foreground/80">Выд. </span>
                          {formatRuDateFromIso(row.rentedAt.slice(0, 10))}
                        </p>
                        <p className="line-clamp-1">
                          <span className="font-medium text-foreground/80">Возв. </span>
                          {row.returnedAt ? formatRuDateFromIso(row.returnedAt.slice(0, 10)) : "—"}
                        </p>
                      </div>
                      <div className="mt-0.5 text-[10px] tabular-nums">
                        {row.accruedFineAmount > 0 || row.paidFineAmount > 0 ? (
                          <div className="flex flex-col gap-0.5 text-foreground/90">
                            {row.accruedFineAmount > 0 ? (
                              <span className="line-clamp-1 text-muted-foreground">
                                Нач. {formatRub(row.accruedFineAmount)}
                              </span>
                            ) : null}
                            {row.paidFineAmount > 0 ? (
                              <span className="line-clamp-1 text-muted-foreground">
                                Опл. {formatRub(row.paidFineAmount)}
                              </span>
                            ) : null}
                            {row.outstandingFineAmount > 0 ? (
                              <span className="font-medium text-destructive">
                                Долг {formatRub(row.outstandingFineAmount)}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Штрафы —</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
