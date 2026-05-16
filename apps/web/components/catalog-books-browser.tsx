"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { libraryPublicClient } from "@/client/library-public-client"
import type { LibraryBook, LibraryBooksListFilters } from "@/client/library-client"
import { CatalogBookPosterCard } from "@/components/catalog-book-poster-card"
import { InfiniteScrollSentinel } from "@/components/infinite-scroll-sentinel"
import { useAppScrollRoot } from "@/hooks/use-app-scroll-root"
import { usePublicBookCoverUrls } from "@/hooks/use-public-book-cover-urls"
import { BOOK_CARD_GRID_CLASS } from "@/lib/book-card-grid"
import { cn } from "@workspace/ui/lib/utils"

const PAGE_LIMIT = 12

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
  const coverUrlsById = usePublicBookCoverUrls(books)

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
            <div className={cn("w-full min-w-0", BOOK_CARD_GRID_CLASS)}>
              {books.map((b) => (
                <CatalogBookPosterCard key={b.id} book={b} coverUrl={coverUrlsById[b.id]} />
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
