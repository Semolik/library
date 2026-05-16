"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import { BookOpen, Building2, Loader2, PenTool, Search } from "lucide-react"
import { libraryPublicClient } from "@/client/library-public-client"
import type { LibraryAuthor, LibraryBook, LibraryPublishingHouse } from "@/client/library-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"

const SEARCH_DEBOUNCE_MS = 240
const PER_SECTION = 8

/** Фиксированные размеры окна: без скачков при смене состояния. */
const DIALOG_STYLE =
  "flex h-[min(520px,calc(100dvh-3rem))] w-[min(32rem,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"

function authorLabel(a: LibraryAuthor): string {
  return [a.lastName, a.firstName, a.middleName].filter(Boolean).join(" ")
}

type CatalogSearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CatalogSearchDialog({ open, onOpenChange }: CatalogSearchDialogProps) {
  const [query, setQuery] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [books, setBooks] = React.useState<LibraryBook[]>([])
  const [authors, setAuthors] = React.useState<LibraryAuthor[]>([])
  const [houses, setHouses] = React.useState<LibraryPublishingHouse[]>([])

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [query])

  React.useEffect(() => {
    if (!open) return
    if (debounced.length < 1) {
      setBooks([])
      setAuthors([])
      setHouses([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void Promise.all([
      libraryPublicClient.listBooks(debounced, { page: 1, limit: PER_SECTION }),
      libraryPublicClient.listAuthors(debounced, PER_SECTION),
      libraryPublicClient.listPublishingHouses(debounced, PER_SECTION),
    ])
      .then(([booksPage, auth, ph]) => {
        if (cancelled) return
        setBooks(booksPage.items ?? [])
        setAuthors(auth)
        setHouses(ph)
      })
      .catch((e) => {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : "Ошибка поиска."
        toast.error(msg)
        setBooks([])
        setAuthors([])
        setHouses([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, debounced])

  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setDebounced("")
      setBooks([])
      setAuthors([])
      setHouses([])
      setLoading(false)
    }
  }, [open])

  const searchFieldId = React.useId()

  React.useEffect(() => {
    if (!open) return
    const t = window.requestAnimationFrame(() => {
      document.getElementById(searchFieldId)?.focus()
    })
    return () => cancelAnimationFrame(t)
  }, [open, searchFieldId])

  const hasResults = books.length + authors.length + houses.length > 0
  const showEmptyHint = debounced.length < 1
  const showNoHits = debounced.length >= 1 && !loading && !hasResults

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className={cn(DIALOG_STYLE, "shadow-lg")}>
        <div className="shrink-0 border-b border-border px-4 pt-4 pr-12 pb-3">
          <DialogHeader className="space-y-1">
            <DialogTitle>Поиск в каталоге</DialogTitle>
            <DialogDescription className="text-xs leading-snug">
              Книги, авторы и издательства. Достаточно части слова. Закрыть —{" "}
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">Esc</kbd>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3">
            <Label htmlFor={searchFieldId} className="sr-only">
              Запрос
            </Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id={searchFieldId}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Начните вводить…"
                className="h-9 pl-9 pr-10"
                autoComplete="off"
                spellCheck={false}
              />
              <div
                className="pointer-events-none absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center"
                aria-hidden
              >
                <Loader2
                  className={cn("size-4 text-muted-foreground", loading ? "animate-spin" : "opacity-0")}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex min-h-0 min-w-0 flex-1 flex-col px-1"
          aria-busy={loading}
          aria-live="polite"
        >
          <div className="catalog-search-results-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-3 pb-4">
            {showEmptyHint ? (
              <div className="flex min-h-[min(240px,100%)] flex-1 flex-col items-center justify-center gap-2 px-2 text-center">
                <Search className="size-8 text-muted-foreground/40" aria-hidden />
                <p className="text-sm text-muted-foreground">
                  Введите запрос — покажем до {PER_SECTION} позиций в каждой категории.
                </p>
              </div>
            ) : showNoHits ? (
              <div className="flex min-h-[min(240px,100%)] flex-1 flex-col items-center justify-center px-2 text-center">
                <p className="text-sm text-muted-foreground">Ничего не найдено. Попробуйте другую формулировку.</p>
              </div>
            ) : (
              <div
                className={cn(
                  "flex flex-col gap-5 transition-opacity duration-150",
                  loading && hasResults && "opacity-60",
                )}
              >
                {books.length > 0 ? (
                  <section>
                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      <BookOpen className="size-3.5 shrink-0" aria-hidden />
                      Книги
                    </h3>
                    <ul className="space-y-0.5">
                      {books.map((b) => (
                        <li key={b.id}>
                          <Link
                            href={`/books/${b.id}`}
                            className="block rounded-md px-2 py-2 text-sm leading-snug outline-none ring-offset-background hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => onOpenChange(false)}
                          >
                            <span className="line-clamp-2 font-medium">{b.title}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">
                              {b.publicationYear} г. · ISBN {b.isbn}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {authors.length > 0 ? (
                  <section>
                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      <PenTool className="size-3.5 shrink-0" aria-hidden />
                      Авторы
                    </h3>
                    <ul className="space-y-0.5">
                      {authors.map((a) => (
                        <li key={a.id}>
                          <Link
                            href={`/authors/${a.id}`}
                            className="block rounded-md px-2 py-2 text-sm outline-none ring-offset-background hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => onOpenChange(false)}
                          >
                            {authorLabel(a)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {houses.length > 0 ? (
                  <section>
                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      <Building2 className="size-3.5 shrink-0" aria-hidden />
                      Издательства
                    </h3>
                    <ul className="space-y-0.5">
                      {houses.map((h) => (
                        <li key={h.id}>
                          <Link
                            href={`/publishing-houses/${h.id}`}
                            className="block rounded-md px-2 py-2 text-sm outline-none ring-offset-background hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => onOpenChange(false)}
                          >
                            {h.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {loading && !hasResults ? (
                  <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
                    <p className="text-sm text-muted-foreground">Ищем…</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
