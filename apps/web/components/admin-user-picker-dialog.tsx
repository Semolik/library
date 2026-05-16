"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import { userLabel } from "@/app/admin/rent-helpers"
import { ApiError } from "@/client/api-client"
import { adminUsersClient, type AdminUserListItem } from "@/client/admin-users-client"
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

const DEBOUNCE_MS = 300

type LoadState = "idle" | "loading" | "ok" | "no_token" | "unauthorized" | "forbidden" | "error"

export function AdminUserPickerDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  token?: string | null
  onPick: (user: AdminUserListItem) => void
}) {
  const { open, onOpenChange, token, onPick } = props
  const [loading, setLoading] = React.useState(false)
  const [loadState, setLoadState] = React.useState<LoadState>("idle")
  const [users, setUsers] = React.useState<AdminUserListItem[]>([])
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [retryTick, setRetryTick] = React.useState(0)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchFieldId = React.useId()

  React.useEffect(() => {
    if (!open) {
      setLoadState("idle")
      return
    }
    if (!token?.trim()) {
      setUsers([])
      setLoading(false)
      setLoadState("no_token")
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
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
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, token, retryTick])

  React.useEffect(() => {
    if (!open) {
      setSearch("")
      setDebouncedSearch("")
    }
  }, [open])

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

  const filtered = React.useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    if (!q) return users
    return users.filter((u) => userLabel(u).toLowerCase().includes(q))
  }, [users, debouncedSearch])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,640px)] w-[calc(100vw-2rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-14 text-left">
          <DialogTitle>Кто получает книгу?</DialogTitle>
          <DialogDescription>
            Кому отдаём книгу — имя или почта, как в списке читателей.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-6 pb-6 pt-4">
          <div className="grid gap-1.5">
            <Label htmlFor={searchFieldId}>Найти в списке</Label>
            <Input
              id={searchFieldId}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Имя или электронная почта…"
              disabled={loading}
            />
          </div>
          <div className="max-h-[min(52vh,420px)] overflow-y-auto rounded-md border border-border">
            {loadState === "no_token" ? (
              <div className="space-y-3 p-4 text-sm text-muted-foreground">
                <p>Сессия ещё не загружена или вы не вошли в систему.</p>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href="/login">Перейти ко входу</Link>
                </Button>
              </div>
            ) : loadState === "unauthorized" ? (
              <div className="space-y-3 p-4 text-sm">
                <p className="text-muted-foreground">
                  Каталог и выдача теперь тоже проверяют токен. После простоя сессия истекает — войдите снова, и список
                  читателей откроется.
                </p>
                <Button type="button" size="sm" asChild>
                  <Link href="/login">Войти снова</Link>
                </Button>
              </div>
            ) : loadState === "forbidden" ? (
              <p className="p-4 text-sm text-muted-foreground">
                У вашей учётной записи нет доступа к списку пользователей. Обратитесь к администратору.
              </p>
            ) : loadState === "error" ? (
              <div className="space-y-3 p-4 text-sm text-muted-foreground">
                <p>Не удалось загрузить список. Проверьте соединение и попробуйте снова.</p>
                <Button type="button" variant="outline" size="sm" onClick={() => setRetryTick((n) => n + 1)}>
                  Повторить
                </Button>
              </div>
            ) : loading ? (
              <p className="p-4 text-sm text-muted-foreground">Загрузка…</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {users.length === 0 && loadState === "ok"
                  ? "Читателей пока нет — сначала заведите карточку в разделе «Пользователи»."
                  : "Ничего не нашлось — попробуйте другие слова."}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      className="flex w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                      onClick={() => {
                        onPick(u)
                        onOpenChange(false)
                      }}
                    >
                      {userLabel(u)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
