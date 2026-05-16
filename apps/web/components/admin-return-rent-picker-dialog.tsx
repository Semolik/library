"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import {
  dueHumanPhrase,
  formatRuDateFromIso,
  formatRub,
  urgencyLabel,
  userLabel,
} from "@/app/admin/rent-helpers"
import { ApiError } from "@/client/api-client"
import { adminUsersClient, type AdminUserListItem } from "@/client/admin-users-client"
import {
  libraryClient,
  type LibraryBorrowedBookRow,
  type LibraryBorrowUrgency,
} from "@/client/library-client"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { ArrowLeft, Loader2 } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

const DEBOUNCE_MS = 300
const SOON_DAYS = 7

type PickerStep = "user" | "rents"

type LoadState = "idle" | "loading" | "ok" | "no_token" | "unauthorized" | "forbidden" | "error"

function urgencyBadgeVariant(u: LibraryBorrowUrgency): "destructive" | "secondary" | "outline" {
  if (u === "overdue") return "destructive"
  if (u === "due_soon") return "secondary"
  return "outline"
}

export function AdminReturnRentPickerDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  token?: string | null
  onPickRentId: (rentId: string) => void
}) {
  const { open, onOpenChange, token, onPickRentId } = props

  const [step, setStep] = React.useState<PickerStep>("user")
  const [selectedUser, setSelectedUser] = React.useState<AdminUserListItem | null>(null)

  const [usersLoading, setUsersLoading] = React.useState(false)
  const [loadState, setLoadState] = React.useState<LoadState>("idle")
  const [users, setUsers] = React.useState<AdminUserListItem[]>([])
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [retryTick, setRetryTick] = React.useState(0)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchFieldId = React.useId()

  const [rentsLoading, setRentsLoading] = React.useState(false)
  const [rentRows, setRentRows] = React.useState<LibraryBorrowedBookRow[]>([])

  React.useEffect(() => {
    if (!open) {
      setStep("user")
      setSelectedUser(null)
      setRentRows([])
      setSearch("")
      setDebouncedSearch("")
      setLoadState("idle")
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    if (!token?.trim()) {
      setUsers([])
      setUsersLoading(false)
      setLoadState("no_token")
      return
    }
    let cancelled = false
    ;(async () => {
      setUsersLoading(true)
      setLoadState("loading")
      try {
        const list = await adminUsersClient.list(token.trim())
        if (!cancelled) {
          setUsers(list)
          setLoadState("ok")
        }
      } catch (e) {
        if (!cancelled) {
          setUsers([])
          if (e instanceof ApiError) {
            if (e.status === 401) setLoadState("unauthorized")
            else if (e.status === 403) setLoadState("forbidden")
            else setLoadState("error")
          } else {
            setLoadState("error")
          }
          const msg = e instanceof Error ? e.message : "Не удалось загрузить список читателей."
          if (!(e instanceof ApiError && e.status === 401)) {
            toast.error(msg)
          }
        }
      } finally {
        if (!cancelled) setUsersLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, token, retryTick])

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      setDebouncedSearch(search.trim())
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  const filteredUsers = React.useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    if (!q) return users
    return users.filter((u) => userLabel(u).toLowerCase().includes(q))
  }, [users, debouncedSearch])

  async function afterUserPick(user: AdminUserListItem) {
    if (!token?.trim()) return
    setSelectedUser(user)
    setStep("rents")
    setRentsLoading(true)
    setRentRows([])
    try {
      const res = await libraryClient.listBorrowedBooks(token, {
        userId: user.id,
        soonDays: SOON_DAYS,
      })
      setRentRows(res.items)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить выдачи.")
      setRentRows([])
      setStep("user")
      setSelectedUser(null)
    } finally {
      setRentsLoading(false)
    }
  }

  function goBackToUsers() {
    setStep("user")
    setSelectedUser(null)
    setRentRows([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,640px)] w-[calc(100vw-2rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        {step === "user" ? (
          <>
            <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-14 text-left">
              <DialogTitle>Выбор читателя</DialogTitle>
              <DialogDescription>
                Найдите читателя по имени или почте, затем выберите выдачу для возврата.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 px-6 pb-6 pt-4">
              <div className="grid gap-1.5">
                <Label htmlFor={searchFieldId}>Поиск</Label>
                <Input
                  id={searchFieldId}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Имя или электронная почта…"
                  disabled={usersLoading}
                />
              </div>
              <div className="max-h-[min(52vh,420px)] overflow-y-auto rounded-md border border-border">
                {loadState === "no_token" ? (
                  <div className="space-y-3 p-4 text-sm text-muted-foreground">
                    <p>Сессия не готова или вы не вошли.</p>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link href="/login">Войти</Link>
                    </Button>
                  </div>
                ) : loadState === "unauthorized" ? (
                  <div className="space-y-3 p-4 text-sm">
                    <p className="text-muted-foreground">Сессия истекла — войдите снова.</p>
                    <Button type="button" size="sm" asChild>
                      <Link href="/login">Войти</Link>
                    </Button>
                  </div>
                ) : loadState === "forbidden" ? (
                  <p className="p-4 text-sm text-muted-foreground">Нет доступа к списку пользователей.</p>
                ) : loadState === "error" ? (
                  <div className="space-y-3 p-4 text-sm text-muted-foreground">
                    <p>Не удалось загрузить список.</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => setRetryTick((n) => n + 1)}>
                      Повторить
                    </Button>
                  </div>
                ) : usersLoading ? (
                  <p className="p-4 text-sm text-muted-foreground">Загрузка…</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    {users.length === 0 && loadState === "ok"
                      ? "Читателей нет — заведите в «Пользователи»."
                      : "Ничего не нашлось — измените запрос."}
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {filteredUsers.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          className="flex w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                          onClick={() => void afterUserPick(u)}
                        >
                          {userLabel(u)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="shrink-0 space-y-2 border-b px-6 py-4 pr-14 text-left">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 w-fit gap-1 px-2 text-muted-foreground"
                onClick={() => goBackToUsers()}
              >
                <ArrowLeft className="size-4" />
                Другой читатель
              </Button>
              <DialogTitle className="text-left">Книги на руках</DialogTitle>
              <DialogDescription className="text-left">
                {selectedUser ? (
                  <>
                    <span className="text-foreground/90">{userLabel(selectedUser)}</span>
                    {" — выберите выдачу для открытия карточки возврата."}
                  </>
                ) : null}
              </DialogDescription>
            </DialogHeader>
            <div className="flex min-h-[200px] flex-1 flex-col px-6 pb-6 pt-2">
              {rentsLoading ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="size-6 animate-spin" aria-hidden />
                  <p className="text-sm">Загружаем выдачи…</p>
                </div>
              ) : rentRows.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  У этого читателя нет книг на руках. Проверьте раздел «На руках» или выберите другого читателя.
                </p>
              ) : (
                <ul className="max-h-[min(52vh,420px)] space-y-2 overflow-y-auto pr-1">
                  {rentRows.map((row) => (
                    <li key={row.rentId}>
                      <button
                        type="button"
                        className={cn(
                          "w-full rounded-lg border border-border bg-card px-3 py-3 text-left text-sm shadow-sm transition-colors",
                          "hover:border-primary/30 hover:bg-muted/40",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        )}
                        onClick={() => {
                          onPickRentId(row.rentId)
                          onOpenChange(false)
                        }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className="min-w-0 font-medium leading-snug">{row.bookTitle}</span>
                          <Badge variant={urgencyBadgeVariant(row.urgency)} className="shrink-0">
                            {urgencyLabel(row.urgency)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          № {row.inventoryNumber}
                          {row.storageName ? ` · ${row.storageName}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {row.dueDate ? (
                            <>
                              Вернуть до{" "}
                              <span className="font-medium text-foreground/90">
                                {formatRuDateFromIso(row.dueDate)}
                              </span>
                              {row.daysUntilDue != null ? ` · ${dueHumanPhrase(row.daysUntilDue)}` : null}
                            </>
                          ) : (
                            "Срок возврата не задан"
                          )}
                        </p>
                        {row.outstandingFineAmount > 0 ? (
                          <p className="mt-1 text-xs font-medium text-destructive tabular-nums">
                            К доплате {formatRub(row.outstandingFineAmount)}
                          </p>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
