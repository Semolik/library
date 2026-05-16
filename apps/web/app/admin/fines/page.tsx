"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import { borrowedReaderLabel, formatRuDateFromIso, formatRub } from "@/app/admin/rent-helpers"
import {
  libraryClient,
  type LibraryFineLedgerRow,
  type LibraryFinesListResponse,
} from "@/client/library-client"
import { AdminSectionGuard } from "@/components/admin-section-guard"
import { useAuth } from "@/components/auth-provider"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Banknote, ClipboardCheck } from "lucide-react"

export default function AdminFinesPage() {
  const { token } = useAuth()
  const [data, setData] = React.useState<LibraryFinesListResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [payOpen, setPayOpen] = React.useState(false)
  const [payRow, setPayRow] = React.useState<LibraryFineLedgerRow | null>(null)
  const [payAmount, setPayAmount] = React.useState("")
  const [paySubmitting, setPaySubmitting] = React.useState(false)

  const load = React.useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await libraryClient.listFines(token)
      setData(res)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить журнал.")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  React.useEffect(() => {
    void load()
  }, [load])

  function openPay(row: LibraryFineLedgerRow) {
    setPayRow(row)
    setPayAmount(String(row.outstandingFineAmount))
    setPayOpen(true)
  }

  async function submitPay() {
    if (!token || !payRow) return
    const n = Number(payAmount)
    if (!Number.isFinite(n) || n < 1) {
      toast.error("Укажите сумму не меньше 1 ₽.")
      return
    }
    setPaySubmitting(true)
    try {
      await libraryClient.payFine(payRow.rentId, Math.floor(n), token)
      toast.success("Оплата записана")
      setPayOpen(false)
      setPayRow(null)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось провести оплату.")
    } finally {
      setPaySubmitting(false)
    }
  }

  const rows = data?.items ?? []
  const summary = data?.summary

  return (
    <AdminSectionGuard
      title="Штрафы"
      description={
        <>
          Начисление по просрочке выполняется каждый день в полночь и при открытии этой страницы или списка «На руках».
          Настройки суммы за день и отсрочки — в разделе{" "}
          <Link href="/admin/issue-books" className="font-medium text-primary underline underline-offset-4 hover:no-underline">
            Выдача
          </Link>{" "}
          (кнопка для администраторов).
        </>
      }
    >
      <div className="space-y-6">
        {summary ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Записей в журнале</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.count}</p>
            </div>
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
              <p className="text-xs text-muted-foreground">Осталось получить</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-destructive">
                {formatRub(summary.outstandingTotalRub)}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Всего начислено / оплачено</p>
              <p className="mt-1 text-lg font-semibold tabular-nums leading-snug">
                {formatRub(summary.accruedTotalRub)}
                <span className="mx-1 font-normal text-muted-foreground">/</span>
                {formatRub(summary.paidTotalRub)}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={loading || !token} onClick={() => void load()}>
            Обновить начисления
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/admin/rentals">
              <ClipboardCheck className="mr-1.5 size-4" />
              Возврат по номеру
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Книга</TableHead>
                <TableHead>Читатель</TableHead>
                <TableHead className="whitespace-nowrap">Срок</TableHead>
                <TableHead className="text-right">Начислено</TableHead>
                <TableHead className="text-right">Оплачено</TableHead>
                <TableHead className="text-right">К доплате</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground">
                    Загрузка…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground">
                    Пока нет записей с начислениями или оплатами.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.rentId}>
                    <TableCell className="max-w-[min(20rem,45vw)]">
                      <div className="font-medium leading-snug">{row.bookTitle}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        № {row.inventoryNumber}
                        {row.storageName ? ` · ${row.storageName}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/on-loan?userId=${row.userId}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {borrowedReaderLabel(row)}
                      </Link>
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground whitespace-pre-line">
                      {row.dueDate ? (
                        <>
                          до {formatRuDateFromIso(row.dueDate)}
                          {"\n"}
                          <span className="text-xs">
                            выдано {formatRuDateFromIso(row.rentedAt.slice(0, 10))}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                      {row.returnedAt ? (
                        <>
                          {"\n"}
                          <span className="text-xs text-foreground">возврат {formatRuDateFromIso(row.returnedAt.slice(0, 10))}</span>
                        </>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatRub(row.accruedFineAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRub(row.paidFineAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {row.outstandingFineAmount > 0 ? (
                        <span className="text-destructive">{formatRub(row.outstandingFineAmount)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.isActive ? "secondary" : "outline"}>
                        {row.isActive ? "На руках" : "Возвращена"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {row.outstandingFineAmount > 0 ? (
                          <Button type="button" size="sm" variant="default" onClick={() => openPay(row)}>
                            <Banknote className="mr-1 size-4" />
                            Оплатить
                          </Button>
                        ) : null}
                        <Button type="button" size="sm" variant="outline" asChild>
                          <Link href="/admin/rentals">Карточка</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Записать оплату штрафа</DialogTitle>
            <DialogDescription>
              Сумма не может превышать остаток долга по этой выдаче. Платежи суммируются.
            </DialogDescription>
          </DialogHeader>
          {payRow ? (
            <div className="grid gap-3 py-2 text-sm">
              <p className="text-muted-foreground">{payRow.bookTitle}</p>
              <p className="tabular-nums">
                К доплате сейчас:{" "}
                <span className="font-semibold text-foreground">{formatRub(payRow.outstandingFineAmount)}</span>
              </p>
              <div className="grid gap-2">
                <Label htmlFor="pay-amt">Сумма, ₽</Label>
                <Input
                  id="pay-amt"
                  type="number"
                  min={1}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>
              Отмена
            </Button>
            <Button type="button" disabled={paySubmitting || !payRow} onClick={() => void submitPay()}>
              {paySubmitting ? "Запись…" : "Подтвердить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminSectionGuard>
  )
}
