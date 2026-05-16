"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { BookOpen, ImageIcon } from "lucide-react"
import { libraryPublicClient } from "@/client/library-public-client"
import type { LibraryBook, LibraryBooksListFilters } from "@/client/library-client"
import { InfiniteScrollSentinel } from "@/components/infinite-scroll-sentinel"
import { useAppScrollRoot } from "@/hooks/use-app-scroll-root"
import { Badge } from "@workspace/ui/components/badge"
import { BOOK_CARD_GRID_CLASS } from "@/lib/book-card-grid"
import { cn } from "@workspace/ui/lib/utils"

const PAGE_LIMIT = 12

function authorsLine(book: LibraryBook): string {
  const parts =
    book.bookAuthors
      ?.map((ba) => {
        const a = ba.author
        return [a.lastName, a.firstName].filter(Boolean).join(" ").trim()
      })
      .filter(Boolean) ?? []
  return parts.length ? parts.join(", ") : "—"
}

function filterSignature(f: LibraryBooksListFilters): string {
  return JSON.stringify({
    categoryId: f.categoryId ?? null,
    publishingHouseId: f.publishingHouseId ?? null,
    cityId: f.cityId ?? null,
    authorId: f.authorId ?? null,
    hasCover: f.hasCover === true ? true : f.hasCover === false ? false : null,
  })
}

export function CatalogBooksBrowser({
  filter,
  emptyHint = "В каталоге нет книг с этим условием.",
}: {
  filter: LibraryBooksListFilters
  emptyHint?: string
}) {
  const scrollRoot = useAppScrollRoot()
  const filterKey = useMemo(() => filterSignature(filter), [filter])

  const [page, setPage] = useState(1)
  const [books, setBooks] = useState<LibraryBook[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPage(1)
    setBooks([])
    setTotal(0)
  }, [filterKey])

  useEffect(() => {
    let cancelled = false
    const reqPage = page
    setLoading(true)
    void libraryPublicClient
      .listBooks(undefined, { page: reqPage, limit: PAGE_LIMIT }, filter)
      .then((res) => {
        if (cancelled) return
        setTotal(res.total)
        if (reqPage <= 1) {
          setBooks(res.items)
        } else {
          setBooks((prev) => {
            const ids = new Set(prev.map((b) => b.id))
            const next = [...prev]
            for (const b of res.items) {
              if (!ids.has(b.id)) next.push(b)
            }
            return next
          })
        }
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Не удалось загрузить книги.")
          if (reqPage <= 1) {
            setBooks([])
            setTotal(0)
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filter, filterKey, page])

  const hasMore = books.length < total

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">
        {total > 0 ? (
          <span>
            Найдено: {total}
            {books.length < total ? ` · показано ${books.length}` : null}
          </span>
        ) : !loading ? (
          <span>Найдено: 0</span>
        ) : (
          <span>Загрузка…</span>
        )}
      </div>
      <div className="min-h-[120px]">
        {loading && books.length === 0 ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : !books.length ? (
          <p className="text-sm text-muted-foreground">{emptyHint}</p>
        ) : (
          <>
            <div className={BOOK_CARD_GRID_CLASS}>
              {books.map((b) => (
                <Link
                  key={b.id}
                  href={`/books/${b.id}`}
                  className={cn(
                    "group flex h-full flex-col overflow-hidden rounded-lg border bg-card text-left shadow-sm transition-all",
                    "hover:border-primary/35 hover:shadow",
                  )}
                >
                  <div className="relative flex h-[4.75rem] shrink-0 items-center justify-center bg-muted/70 text-muted-foreground sm:h-[5.25rem]">
                    {b.hasCover ? (
                      <ImageIcon className="size-7 opacity-40 sm:size-8" aria-hidden />
                    ) : (
                      <BookOpen className="size-7 opacity-40 sm:size-8" aria-hidden />
                    )}
                    {b.category?.name ? (
                      <Badge
                        variant="secondary"
                        className="absolute bottom-1 left-1 right-1 max-w-[calc(100%-0.5rem)] truncate px-1 py-0 text-[9px] font-normal leading-tight"
                      >
                        {b.category.name}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 p-2 pt-1.5">
                    <span className="line-clamp-2 text-xs font-medium leading-tight text-foreground group-hover:text-primary">
                      {b.title}
                    </span>
                    <span className="line-clamp-1 text-[10px] text-muted-foreground tabular-nums">
                      {b.publicationYear} г. · {b.isbn}
                    </span>
                    <span className="line-clamp-1 text-[10px] text-muted-foreground">
                      {authorsLine(b)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <InfiniteScrollSentinel
              hasMore={hasMore}
              loading={loading}
              scrollRoot={scrollRoot}
              onLoadMore={() => setPage((p) => p + 1)}
            />
            {loading && books.length > 0 ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">Подгрузка…</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
