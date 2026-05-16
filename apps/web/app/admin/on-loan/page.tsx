"use client"

import Link from "next/link"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  borrowedReaderLabel,
  dueHumanPhrase,
  formatRuDateFromIso,
  formatRub,
  urgencyLabel,
} from "@/app/admin/rent-helpers"
import {
  libraryClient,
  type LibraryBorrowUrgency,
  type LibraryBorrowedBooksResponse,
} from "@/client/library-client"
import { ApiError } from "@/client/api-client"
import { AdminFormSelect } from "@/components/admin-form-select"
import { AdminSectionGuard } from "@/components/admin-section-guard"
import { useAuth } from "@/components/auth-provider"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type FilterKey = "all" | LibraryBorrowUrgency

/** Автообновление списка, пока вкладка открыта (снижает риск устаревших данных и расхождений с API). */
const ON_LOAN_AUTO_REFRESH_MS = 60_000

function urgencyBadgeVariant(u: LibraryBorrowUrgency): "destructive" | "secondary" | "outline" {
  if (u === "overdue") return "destructive"
  if (u === "due_soon") return "secondary"
  return "outline"
}

function OnLoanPageInner() {
  const { token } = useAuth()
  const searchParams = useSearchParams()
  const userIdFromUrl = searchParams.get("userId")?.trim() ?? ""

  const [soonDays, setSoonDays] = useState(7)
  const [filter, setFilter] = useState<FilterKey>("all")
  const [data, setData] = useState<LibraryBorrowedBooksResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent)
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const res = await libraryClient.listBorrowedBooks(token, {
        soonDays,
        userId: userIdFromUrl || undefined,
      })
      setData(res)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось загрузить список."
      if (!silent) {
        toast.error(msg)
        setData(null)
      } else if (e instanceof ApiError && e.status === 401) {
        toast.error(msg)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [token, soonDays, userIdFromUrl])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!token?.trim()) return
    const tick = () => {
      if (document.visibilityState !== "visible") return
      void load({ silent: true })
    }
    const id = window.setInterval(tick, ON_LOAN_AUTO_REFRESH_MS)
    document.addEventListener("visibilitychange", tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [token, load])

  const rows = useMemo(() => {
    if (!data) return []
    if (filter === "all") return data.items
    return data.items.filter((r) => r.urgency === filter)
  }, [data, filter])

  const summary = data?.summary

  return (
    <AdminSectionGuard
      title="На руках"
      description={
        <>
          Все невозвращённые книги и напоминание о сроке. Оформить возврат — в разделе{" "}
          <Link href="/admin/rentals" className="font-medium text-primary underline underline-offset-4 hover:no-underline">
            Возврат
          </Link>
          ; выдать книгу —{" "}
          <Link href="/admin/issue-books" className="font-medium text-primary underline underline-offset-4 hover:no-underline">
            Выдача
          </Link>
          .
        </>
      }
    >
      <div className="space-y-6">
        {userIdFromUrl ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              Показаны только книги выбранного читателя.{" "}
              <Link href="/admin/on-loan" className="font-medium text-primary underline underline-offset-4">
                Показать всех
              </Link>
            </span>
          </div>
        ) : null}

        {summary ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs text-muted-foreground">Всего на руках</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.total}</p>
              </div>
              <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
                <p className="text-xs text-muted-foreground">Просрочено</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-destructive">{summary.overdue}</p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <p className="text-xs text-muted-foreground">
                  Скоро срок (≤ {summary.soonDays} дн.)
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-900 dark:text-amber-200">{summary.dueSoon}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs text-muted-foreground">В сроке / без даты</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {summary.ok}
                  {summary.noDueDate ? (
                    <span className="ml-2 text-base font-normal text-muted-foreground">
                      (+{summary.noDueDate} без даты)
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            {summary.outstandingTotalRub > 0 ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-600/25 bg-amber-600/5 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Начислено к доплате по текущим выдачам:</span>
                <span className="font-semibold tabular-nums text-foreground">{formatRub(summary.outstandingTotalRub)}</span>
                <Link
                  href="/admin/fines"
                  className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                >
                  Полный журнал
                </Link>
              </div>
            ) : null}
          </>
        ) : null}

        <div className="min-w-[200px] max-w-xs">
          <AdminFormSelect
            label="Что считать «скоро срок»"
            value={String(soonDays)}
            onValueChange={(v) => setSoonDays(Number(v))}
            placeholder="Дней"
            options={[
              { value: "3", label: "3 дня до срока" },
              { value: "7", label: "7 дней до срока" },
              { value: "14", label: "14 дней до срока" },
            ]}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Все"],
              ["overdue", urgencyLabel("overdue")],
              ["due_soon", urgencyLabel("due_soon")],
              ["ok", urgencyLabel("ok")],
              ["no_due_date", urgencyLabel("no_due_date")],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={filter === key ? "default" : "outline"}
              onClick={() => setFilter(key)}
            >
              {label}
              {key !== "all" && summary ? (
                <span className="ml-1 tabular-nums opacity-80">
                  (
                  {key === "overdue"
                    ? summary.overdue
                    : key === "due_soon"
                      ? summary.dueSoon
                      : key === "ok"
                        ? summary.ok
                        : summary.noDueDate}
                  )
                </span>
              ) : null}
            </Button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Книга</th>
                <th className="px-4 py-3 font-medium">Читатель</th>
                <th className="px-4 py-3 font-medium">Вернуть до</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 text-right font-medium">Штраф</th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Загрузка…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {data?.items.length === 0 ? "Сейчас никому ничего не выдано." : "В этом фильтре пусто."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.rentId} className={cn("border-t", row.urgency === "overdue" && "bg-destructive/[0.03]")}>
                    <td className="max-w-[min(28rem,50vw)] px-4 py-3">
                      <div className="font-medium leading-snug">{row.bookTitle}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        № {row.inventoryNumber}
                        {row.storageName ? ` · ${row.storageName}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/on-loan?userId=${row.userId}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {borrowedReaderLabel(row)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {row.dueDate ? (
                        <>
                          <div>{formatRuDateFromIso(row.dueDate)}</div>
                          <div className="text-xs">{dueHumanPhrase(row.daysUntilDue)}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={urgencyBadgeVariant(row.urgency)}>{urgencyLabel(row.urgency)}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                      {row.outstandingFineAmount > 0 ? (
                        <span className="font-medium text-destructive">{formatRub(row.outstandingFineAmount)}</span>
                      ) : row.accruedFineAmount > 0 ? (
                        <span className="text-xs text-muted-foreground">Начислено, доплата 0</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <Link href="/admin/rentals">Возврат</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-4 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={loading || !token}
            onClick={() => void load()}
          >
            Обновить
          </Button>
          <p className="min-w-0 flex-1 text-xs leading-snug text-muted-foreground">
            Автообновление каждые {ON_LOAN_AUTO_REFRESH_MS / 1000} с (без мигания экрана) и при возврате на вкладку.
          </p>
        </div>
      </div>
    </AdminSectionGuard>
  )
}

export default function AdminOnLoanPage() {
  return (
    <Suspense
      fallback={
        <AdminSectionGuard title="На руках">
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        </AdminSectionGuard>
      }
    >
      <OnLoanPageInner />
    </Suspense>
  )
}
