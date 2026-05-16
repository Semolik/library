"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import {
  addLocalCalendarDays,
  copyLabel,
  formatIsoLocalDate,
  formatRuDateFromIso,
  userLabel,
} from "@/app/admin/rent-helpers"
import type { AdminUserListItem } from "@/client/admin-users-client"
import {
  libraryClient,
  type LibraryBook,
  type LibraryBookCopy,
  type LibraryRent,
} from "@/client/library-client"
import { AdminBookPickerDialog } from "@/components/admin-book-picker-dialog"
import { AdminCopyPickerDialog } from "@/components/admin-copy-picker-dialog"
import { AdminSectionGuard } from "@/components/admin-section-guard"
import { AdminUserPickerDialog } from "@/components/admin-user-picker-dialog"
import { useAuth } from "@/components/auth-provider"
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

function canEditLoanSettings(roles: string[] | undefined): boolean {
  return Boolean(roles?.some((r) => r === "ADMIN" || r === "SUPERUSER"))
}

export default function AdminIssueBooksPage() {
  const { token, user } = useAuth()
  const [bookPickerOpen, setBookPickerOpen] = React.useState(false)
  const [copyPickerOpen, setCopyPickerOpen] = React.useState(false)
  const [userPickerOpen, setUserPickerOpen] = React.useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false)
  const [selectedBook, setSelectedBook] = React.useState<LibraryBook | null>(null)
  const [selectedCopy, setSelectedCopy] = React.useState<LibraryBookCopy | null>(null)
  const [selectedUser, setSelectedUser] = React.useState<AdminUserListItem | null>(null)
  const [defaultLoanDays, setDefaultLoanDays] = React.useState(14)
  const [finePerDay, setFinePerDay] = React.useState(10)
  const [graceDays, setGraceDays] = React.useState(0)
  const [loanDaysDraft, setLoanDaysDraft] = React.useState("14")
  const [finePerDraft, setFinePerDraft] = React.useState("10")
  const [graceDraft, setGraceDraft] = React.useState("0")
  const [dueDate, setDueDate] = React.useState("")
  const [createdRent, setCreatedRent] = React.useState<LibraryRent | null>(null)
  const [settingsLoading, setSettingsLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [savingSettings, setSavingSettings] = React.useState(false)

  React.useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      setSettingsLoading(true)
      try {
        const s = await libraryClient.getLibrarySettings(token)
        if (cancelled) return
        setDefaultLoanDays(s.defaultLoanDays)
        setFinePerDay(s.finePerOverdueDay)
        setGraceDays(s.fineGraceDays)
        setLoanDaysDraft(String(s.defaultLoanDays))
        setFinePerDraft(String(s.finePerOverdueDay))
        setGraceDraft(String(s.fineGraceDays))
        setDueDate(formatIsoLocalDate(addLocalCalendarDays(new Date(), s.defaultLoanDays)))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Не удалось загрузить форму.")
      } finally {
        if (!cancelled) setSettingsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  React.useEffect(() => {
    if (!settingsDialogOpen) return
    setLoanDaysDraft(String(defaultLoanDays))
    setFinePerDraft(String(finePerDay))
    setGraceDraft(String(graceDays))
  }, [settingsDialogOpen, defaultLoanDays, finePerDay, graceDays])

  async function handleCreateRent(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      toast.error("Войдите в систему.")
      return
    }
    if (!selectedCopy || !selectedUser) {
      toast.error("Нужно выбрать книгу из фонда и читателя.")
      return
    }
    if (!dueDate.trim()) {
      toast.error("Укажите, до какого числа книгу нужно вернуть.")
      return
    }
    setSubmitting(true)
    try {
      const rent = await libraryClient.createRent(
        {
          copyId: selectedCopy.id,
          userId: selectedUser.id,
          dueDate: dueDate.trim(),
        },
        token,
      )
      setCreatedRent(rent)
      setSelectedBook(null)
      setSelectedCopy(null)
      setSelectedUser(null)
      toast.success("Книга выдана")
      setDueDate(formatIsoLocalDate(addLocalCalendarDays(new Date(), defaultLoanDays)))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось оформить выдачу.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveLoanSettings() {
    if (!token) return
    const n = Number(loanDaysDraft)
    if (!Number.isFinite(n) || n < 1 || n > 1095) {
      toast.error("Укажите срок от 1 до 1095 дней (до трёх лет).")
      return
    }
    const fp = Number(finePerDraft)
    const gd = Number(graceDraft)
    if (!Number.isFinite(fp) || fp < 0 || fp > 1_000_000) {
      toast.error("Штраф за день укажите от 0 до 1 000 000 ₽.")
      return
    }
    if (!Number.isFinite(gd) || gd < 0 || gd > 365) {
      toast.error("Отсрочку укажите от 0 до 365 дней.")
      return
    }
    setSavingSettings(true)
    try {
      const s = await libraryClient.updateLibrarySettings(
        {
          defaultLoanDays: n,
          finePerOverdueDay: fp,
          fineGraceDays: gd,
        },
        token,
      )
      setDefaultLoanDays(s.defaultLoanDays)
      setFinePerDay(s.finePerOverdueDay)
      setGraceDays(s.fineGraceDays)
      setDueDate(formatIsoLocalDate(addLocalCalendarDays(new Date(), s.defaultLoanDays)))
      toast.success("Настройки выдачи и штрафов сохранены")
      setSettingsDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить.")
    } finally {
      setSavingSettings(false)
    }
  }

  const showLoanSettings = canEditLoanSettings(user?.roles)
  const canSubmit = Boolean(token && selectedCopy && selectedUser && dueDate.trim() && !settingsLoading)
  const selectedBookMeta = selectedBook
    ? [
        `${selectedBook.publicationYear} г.`,
        selectedBook.isbn,
        `${selectedBook.pages} стр.`,
        typeof selectedBook.copyCount === "number" ? `${selectedBook.copyCount} экз. в фонде` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : ""

  return (
    <AdminSectionGuard
      title="Выдача книг"
      contentClassName="mx-auto w-full max-w-3xl"
      description={
        <div className="space-y-2">
          <p>
            Здесь видны только книги, которые сейчас в фонде (ещё не у читателя). Список того, что уже у людей, — в разделе{" "}
            <Link
              href="/admin/on-loan"
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              На руках
            </Link>
            .
          </p>
          <p>
            Вернуть книгу или оплатить штраф — в разделе{" "}
            <Link
              href="/admin/rentals"
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              Возврат
            </Link>
            . Журнал всех начислений —{" "}
            <Link
              href="/admin/fines"
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              Штрафы
            </Link>
            .
          </p>
        </div>
      }
    >
      {settingsLoading ? (
        <p className="text-sm text-muted-foreground">Готовим форму…</p>
      ) : (
        <form onSubmit={(e) => void handleCreateRent(e)} className="grid min-w-0 w-full gap-5">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
            <div className="min-w-0 max-w-full flex-1 space-y-1 text-pretty">
              <p>
                По умолчанию книгу берут на{" "}
                <span className="font-medium text-foreground">{defaultLoanDays}</span> дн. — дата возврата ниже
                подставится сама, её можно поменять.
              </p>
              <p className="text-xs">
                Просрочка: штраф <span className="font-medium text-foreground">{finePerDay} ₽</span> за каждый день после
                срока с учётом <span className="font-medium text-foreground">{graceDays}</span> дн. отсрочки. Начисление
                выполняется каждый день автоматически и при открытии журналов выдачи.
              </p>
            </div>
            {showLoanSettings ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setSettingsDialogOpen(true)}
              >
                Изменить срок для всех
              </Button>
            ) : null}
          </div>

          {createdRent ? (
            <div className="rounded-lg border border-green-600/25 bg-green-600/5 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">Книга выдана</p>
              {createdRent.dueDate ? (
                <p className="mt-2 text-muted-foreground">
                  Вернуть до{" "}
                  <span className="font-medium text-foreground">{formatRuDateFromIso(createdRent.dueDate)}</span>
                </p>
              ) : null}
              <p className="mt-2 text-muted-foreground">
                Для возврата откройте раздел «Возврат» и найдите выдачу по читателю.
              </p>
            </div>
          ) : null}

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Шаг 1</p>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">Книга</p>
                  <p className="text-sm leading-snug text-muted-foreground">
                    {selectedBook ? (
                      <>
                        <span className="font-medium text-foreground">{selectedBook.title}</span>
                        {selectedBookMeta ? <span className="block text-xs">{selectedBookMeta}</span> : null}
                      </>
                    ) : (
                      "Сначала выберите книгу, у которой есть свободные экземпляры"
                    )}
                  </p>
                </div>
                <Button type="button" variant="secondary" disabled={!token} onClick={() => setBookPickerOpen(true)}>
                  {selectedBook ? "Сменить книгу" : "Выбрать книгу"}
                </Button>
              </div>
            </div>

            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Шаг 2</p>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">Экземпляр</p>
                  <p className="text-sm leading-snug text-muted-foreground">
                    {selectedCopy
                      ? copyLabel(selectedCopy)
                      : selectedBook
                        ? "Теперь выберите конкретный свободный экземпляр"
                        : "Сначала выберите книгу"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!token || !selectedBook}
                  onClick={() => setCopyPickerOpen(true)}
                >
                  {selectedCopy ? "Сменить экземпляр" : "Выбрать экземпляр"}
                </Button>
              </div>
            </div>

            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Шаг 3</p>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">Кому выдаём</p>
                  <p className="text-sm leading-snug text-muted-foreground">
                    {selectedUser ? userLabel(selectedUser) : "Выберите читателя из списка"}
                  </p>
                </div>
                <Button type="button" variant="secondary" disabled={!token} onClick={() => setUserPickerOpen(true)}>
                  Выбрать читателя
                </Button>
              </div>
            </div>

            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Шаг 4</p>
            <div className="grid min-w-[200px] gap-1.5">
              <Label htmlFor="due-date">До какого числа вернуть</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={!token}
                required
              />
              <p className="text-xs text-muted-foreground">
                Обычно это сегодня плюс {defaultLoanDays} дн. — при необходимости поменяйте.
              </p>
            </div>
          </div>

          <Button type="submit" size="lg" disabled={submitting || !canSubmit}>
            {submitting ? "Оформляем…" : "Выдать книгу"}
          </Button>

          {!token ? (
            <p className="text-sm text-muted-foreground">Войдите под своей учётной записью, чтобы выдавать книги.</p>
          ) : null}
        </form>
      )}

      <AdminBookPickerDialog
        open={bookPickerOpen}
        onOpenChange={setBookPickerOpen}
        token={token}
        onPick={(book) => {
          setSelectedBook(book)
          setSelectedCopy(null)
          setCopyPickerOpen(true)
        }}
      />
      <AdminCopyPickerDialog
        open={copyPickerOpen}
        onOpenChange={setCopyPickerOpen}
        token={token}
        bookId={selectedBook?.id}
        bookTitle={selectedBook?.title}
        onPick={(c) => setSelectedCopy(c)}
      />
      <AdminUserPickerDialog
        open={userPickerOpen}
        onOpenChange={setUserPickerOpen}
        token={token}
        onPick={(u) => setSelectedUser(u)}
      />

      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Срок выдачи и правила штрафов</DialogTitle>
            <DialogDescription>
              Срок по умолчанию подставляется в форму; параметры штрафа используют ежедневное начисление и журнал выдачи.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="loan-days">На сколько дней выдавать</Label>
              <Input
                id="loan-days"
                type="number"
                min={1}
                max={1095}
                value={loanDaysDraft}
                onChange={(e) => setLoanDaysDraft(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fine-per-day">Штраф за день просрочки, ₽</Label>
              <Input
                id="fine-per-day"
                type="number"
                min={0}
                max={1_000_000}
                value={finePerDraft}
                onChange={(e) => setFinePerDraft(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fine-grace">Дней отсрочки после срока без штрафа</Label>
              <Input
                id="fine-grace"
                type="number"
                min={0}
                max={365}
                value={graceDraft}
                onChange={(e) => setGraceDraft(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Первый платный день — на следующий календарный день после «вернуть до» плюс отсрочка.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              Отмена
            </Button>
            <Button type="button" disabled={savingSettings} onClick={() => void handleSaveLoanSettings()}>
              {savingSettings ? "Сохранение…" : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminSectionGuard>
  )
}
