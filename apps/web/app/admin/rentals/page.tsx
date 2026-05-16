"use client"

import Link from "next/link"
import * as React from "react"
import { Suspense } from "react"
import { toast } from "sonner"
import { borrowedReaderLabel, formatRuDateFromIso, formatRub } from "@/app/admin/rent-helpers"
import { libraryClient, type LibraryRentFineSnapshot } from "@/client/library-client"
import { AdminReturnRentPickerDialog } from "@/components/admin-return-rent-picker-dialog"
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
import { Banknote, ClipboardCheck, UserSearch } from "lucide-react"

function AdminRentalsInner() {
  const { token } = useAuth()
  const [rentId, setRentId] = React.useState("")
  const [snapshot, setSnapshot] = React.useState<LibraryRentFineSnapshot | null>(null)
  const [snapshotLoading, setSnapshotLoading] = React.useState(false)
  const [snapshotErr, setSnapshotErr] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [payOpen, setPayOpen] = React.useState(false)
  const [payAmount, setPayAmount] = React.useState("")
  const [rentPickerOpen, setRentPickerOpen] = React.useState(false)

  const refreshSnapshot = React.useCallback(async () => {
    const id = rentId.trim()
    if (!token || !id) {
      setSnapshot(null)
      setSnapshotErr(null)
      return
    }
    setSnapshotLoading(true)
    setSnapshotErr(null)
    try {
      const s = await libraryClient.getRentFineSnapshot(id, token)
      setSnapshot(s)
    } catch (e) {
      setSnapshot(null)
      setSnapshotErr(e instanceof Error ? e.message : "Выдача не найдена или нет доступа.")
    } finally {
      setSnapshotLoading(false)
    }
  }, [rentId, token])

  React.useEffect(() => {
    const t = window.setTimeout(() => void refreshSnapshot(), 350)
    return () => window.clearTimeout(t)
  }, [refreshSnapshot])

  async function handleReturn() {
    if (!token || !rentId.trim()) return
    setSubmitting(true)
    try {
      await libraryClient.returnRent(rentId.trim(), token)
      toast.success("Возврат отмечен")
      await refreshSnapshot()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось отметить возврат.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFinePayment() {
    if (!token || !rentId.trim()) return
    const n = Number(payAmount)
    if (!Number.isFinite(n) || n < 1) {
      toast.error("Укажите сумму от 1 ₽.")
      return
    }
    setSubmitting(true)
    try {
      const res = await libraryClient.payFine(rentId.trim(), Math.floor(n), token)
      toast.success(`Оплачено ${formatRub(res.paidAmountThisTransaction)}, остаток ${formatRub(res.outstandingAfter)}`)
      setPayOpen(false)
      await refreshSnapshot()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось провести оплату.")
    } finally {
      setSubmitting(false)
    }
  }

  function openPayDialog() {
    const o = snapshot?.outstandingFineAmount ?? 0
    setPayAmount(o > 0 ? String(o) : "")
    setPayOpen(true)
  }

  return (
    <AdminSectionGuard
      title="Возврат и штрафы"
      description={
        <>
          Найдите читателя в модальном окне и выберите его книгу на руках. Список активных выдач также доступен в разделе{" "}
          <Link href="/admin/on-loan" className="font-medium text-primary underline underline-offset-4 hover:no-underline">
            На руках
          </Link>
          , а начисления и оплаты — в{" "}
          <Link href="/admin/fines" className="font-medium text-primary underline underline-offset-4 hover:no-underline">
            журнале штрафов
          </Link>
          .
        </>
      }
    >
      <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">Выберите выдачу для возврата</p>
                <p className="text-sm text-muted-foreground">
                  Откройте список читателей, затем выберите книгу, которая сейчас на руках.
                </p>
              </div>
              <Button type="button" variant="default" disabled={!token} onClick={() => setRentPickerOpen(true)}>
                <UserSearch className="mr-2 size-4" />
                Найти по читателю
              </Button>
            </div>
          </div>

          {snapshotErr ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {snapshotErr}
            </p>
          ) : null}

          {snapshotLoading ? (
            <p className="text-sm text-muted-foreground">Загружаем карточку…</p>
          ) : snapshot ? (
            <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold leading-snug">{snapshot.bookTitle}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    № {snapshot.inventoryNumber}
                    {snapshot.storageName ? ` · ${snapshot.storageName}` : ""}
                  </p>
                </div>
                <Badge variant={snapshot.isActive ? "default" : "secondary"}>
                  {snapshot.isActive ? "На руках" : "Возвращена"}
                </Badge>
              </div>

              <div className="grid gap-3 border-t pt-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Читатель: </span>
                  <span className="font-medium">{borrowedReaderLabel(snapshot)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Вернуть до: </span>
                  <span className="font-medium">
                    {snapshot.dueDate ? formatRuDateFromIso(snapshot.dueDate) : "—"}
                  </span>
                </div>
                {snapshot.returnedAt ? (
                  <div>
                    <span className="text-muted-foreground">Фактический возврат: </span>
                    <span className="font-medium">{formatRuDateFromIso(snapshot.returnedAt.slice(0, 10))}</span>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 rounded-lg bg-muted/40 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Начислено</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{formatRub(snapshot.accruedFineAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Оплачено</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{formatRub(snapshot.paidFineAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">К доплате</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-destructive">
                    {formatRub(snapshot.outstandingFineAmount)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button type="button" disabled={submitting || !snapshot.isActive} onClick={() => void handleReturn()}>
                  <ClipboardCheck className="mr-2 size-4" />
                  Отметить возврат
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={submitting || snapshot.outstandingFineAmount <= 0}
                  onClick={() => openPayDialog()}
                >
                  <Banknote className="mr-2 size-4" />
                  Оплатить штраф
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Выберите выдачу через поиск по читателю.</p>
          )}
      </div>

      <AdminReturnRentPickerDialog
        open={rentPickerOpen}
        onOpenChange={setRentPickerOpen}
        token={token}
        onPickRentId={(id) => setRentId(id)}
      />

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Оплата штрафа</DialogTitle>
            <DialogDescription>Введите сумму не больше текущего долга по выдаче.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="rentals-pay-amt">Сумма, ₽</Label>
            <Input
              id="rentals-pay-amt"
              type="number"
              min={1}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
            {snapshot ? (
              <p className="text-xs text-muted-foreground">
                Максимум: <span className="tabular-nums font-medium">{formatRub(snapshot.outstandingFineAmount)}</span>
              </p>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>
              Отмена
            </Button>
            <Button type="button" disabled={submitting} onClick={() => void handleFinePayment()}>
              {submitting ? "Запись…" : "Записать оплату"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminSectionGuard>
  )
}

export default function AdminRentalsPage() {
  return (
    <Suspense
      fallback={
        <AdminSectionGuard title="Возврат и штрафы">
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        </AdminSectionGuard>
      }
    >
      <AdminRentalsInner />
    </Suspense>
  )
}
