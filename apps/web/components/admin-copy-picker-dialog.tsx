"use client"

import * as React from "react"
import { toast } from "sonner"
import { copyLabel } from "@/app/admin/rent-helpers"
import { libraryClient, type LibraryBookCopy } from "@/client/library-client"
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

export function AdminCopyPickerDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  token?: string | null
  onPick: (copy: LibraryBookCopy) => void
}) {
  const { open, onOpenChange, token, onPick } = props
  const [loading, setLoading] = React.useState(false)
  const [copies, setCopies] = React.useState<LibraryBookCopy[]>([])
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchFieldId = React.useId()

  React.useEffect(() => {
    if (!open || !token) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const list = await libraryClient.listBookCopies(token)
        if (!cancelled) setCopies(list)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Не удалось загрузить список книг.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, token])

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

  const available = React.useMemo(() => copies.filter((c) => !c.activeRent), [copies])

  const filtered = React.useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    if (!q) return available
    return available.filter((c) => copyLabel(c).toLowerCase().includes(q))
  }, [available, debouncedSearch])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,640px)] w-[calc(100vw-2rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-14 text-left">
          <DialogTitle>Какую книгу выдаём?</DialogTitle>
          <DialogDescription>
            Показаны только книги, которые сейчас в фонде (ещё не выданы). Можно искать по названию, номеру или залу.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-6 pb-6 pt-4">
          <div className="grid gap-1.5">
            <Label htmlFor={searchFieldId}>Найти в списке</Label>
            <Input
              id={searchFieldId}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Название, номер по каталогу или зал…"
              disabled={loading}
            />
          </div>
          <div className="max-h-[min(52vh,420px)] overflow-y-auto rounded-md border border-border">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">Загрузка…</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {available.length === 0
                  ? "Сейчас все книги из списка кому-то выданы — освободится после возврата."
                  : "Ничего не нашлось — попробуйте другие слова."}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="flex w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                      onClick={() => {
                        onPick(c)
                        onOpenChange(false)
                      }}
                    >
                      {copyLabel(c)}
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
