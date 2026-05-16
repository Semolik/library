"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { BookOpen, ImageIcon } from "lucide-react"
import {
  libraryClient,
  type LibraryFavoriteBookBrief,
  type LibraryFavoriteRow,
} from "@/client/library-client"
import { libraryPublicClient } from "@/client/library-public-client"
import { ApiError } from "@/client/api-client"
import { AppShell } from "@/components/app-shell"
import { CenteredFormShell } from "@/components/centered-form-shell"
import { InfiniteScrollSentinel } from "@/components/infinite-scroll-sentinel"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/components/auth-provider"
import { BOOK_COVER_ASPECT_CLASS } from "@/components/admin-book-cover-thumb"
import { formatRuDateTimeFromIso } from "@/app/admin/rent-helpers"
import { BOOK_CARD_GRID_CLASS } from "@/lib/book-card-grid"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

const FAVORITES_PAGE_LIMIT = 20

function favoriteAuthorsLine(book: LibraryFavoriteBookBrief): string {
  const parts =
    book.authors
      ?.map((a) => [a.lastName, a.firstName].filter(Boolean).join(" ").trim())
      .filter(Boolean) ?? []
  return parts.length ? parts.join(", ") : "—"
}

function FavoriteCoverBlock({
  bookId,
  hasCover,
  className,
}: {
  bookId: string
  hasCover: boolean
  className?: string
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!hasCover) {
      setUrl(null)
      return
    }
    let cancelled = false
    void libraryPublicClient
      .getCoverUrl(bookId)
      .then((r) => {
        if (!cancelled) setUrl(r.url)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [bookId, hasCover])

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-muted/70 text-muted-foreground",
        BOOK_COVER_ASPECT_CLASS,
        className,
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="absolute inset-0 h-full w-full min-h-0 object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          {hasCover ? (
            <ImageIcon className="size-8 opacity-40" aria-hidden />
          ) : (
            <BookOpen className="size-8 opacity-40" aria-hidden />
          )}
        </div>
      )}
    </div>
  )
}

export default function FavoritesPage() {
  const { isHydrated, isAuthenticated, token, login } = useAuth()
  const [items, setItems] = useState<LibraryFavoriteRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    if (!token?.trim()) return
    setPage(1)
    setItems([])
    setTotal(0)
  }, [token])

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !token?.trim()) return
    let cancelled = false
    const requestedPage = page
    setLoading(true)
    void libraryClient
      .listFavorites(token, { page: requestedPage, limit: FAVORITES_PAGE_LIMIT })
      .then((res) => {
        if (cancelled) return
        setTotal(res.total)
        if (requestedPage <= 1) {
          setItems(res.items)
        } else {
          setItems((prev) => {
            const ids = new Set(prev.map((r) => r.favoriteId))
            const next = [...prev]
            for (const row of res.items) {
              if (!ids.has(row.favoriteId)) next.push(row)
            }
            return next
          })
        }
      })
      .catch((e) => {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : "Не удалось загрузить избранное."
        toast.error(msg)
        if (e instanceof ApiError && e.status === 401) {
          return
        }
        if (requestedPage <= 1) {
          setItems([])
          setTotal(0)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isHydrated, isAuthenticated, token, page])

  const removeRow = useCallback(
    async (row: LibraryFavoriteRow) => {
      if (!token?.trim()) return
      setRemovingId(row.bookId)
      try {
        await libraryClient.removeBookFavorite(row.bookId, token)
        setItems((prev) => prev.filter((x) => x.favoriteId !== row.favoriteId))
        setTotal((t) => Math.max(0, t - 1))
        toast.success("Удалено из избранного")
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Не удалось убрать из избранного."
        toast.error(msg)
      } finally {
        setRemovingId(null)
      }
    },
    [token],
  )

  if (!isHydrated) {
    return (
      <AppShell>
        <CenteredFormShell>
          <p className="w-full max-w-md text-center text-sm text-muted-foreground">Загрузка…</p>
        </CenteredFormShell>
      </AppShell>
    )
  }

  if (!isAuthenticated || !token?.trim()) {
    return (
      <AppShell>
        <CenteredFormShell>
          <LoginForm
            onSuccess={(payload) => {
              login(payload.accessToken, payload.user)
            }}
          />
        </CenteredFormShell>
      </AppShell>
    )
  }

  const hasMore = items.length < total

  return (
    <AppShell>
      <div className="flex w-full flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold">Избранное</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Сохранённые книги из каталога. Доступно только вам после входа в аккаунт.
          </p>
          {total > 0 ? (
            <p className="mt-2 text-xs tabular-nums text-muted-foreground">
              В списке: {items.length} из {total}
              {loading && items.length > 0 ? " · Подгрузка…" : ""}
            </p>
          ) : null}
        </div>

        {loading && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Пока нет избранных книг. Добавьте их с карточки книги в каталоге.
          </p>
        ) : (
          <>
            <div className={BOOK_CARD_GRID_CLASS}>
              {items.map((row) => {
                const b = row.book
                const title = b?.title ?? "Книга удалена из каталога"
                return (
                  <Card key={row.favoriteId} size="sm" className="gap-0 py-0 shadow-sm">
                    {b ? (
                      <Link
                        href={`/books/${row.bookId}`}
                        className="block w-full shrink-0 outline-none ring-inset focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <FavoriteCoverBlock bookId={row.bookId} hasCover={b.hasCover} />
                      </Link>
                    ) : (
                      <div
                        className={cn(
                          "relative flex w-full items-center justify-center overflow-hidden bg-muted/50 text-muted-foreground",
                          BOOK_COVER_ASPECT_CLASS,
                        )}
                      >
                        <BookOpen className="size-8 opacity-30" aria-hidden />
                      </div>
                    )}
                    <CardContent className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2">
                      {b ? (
                        <Link
                          href={`/books/${row.bookId}`}
                          className="line-clamp-2 text-xs font-medium leading-snug text-foreground underline-offset-4 hover:text-primary hover:underline"
                        >
                          {title}
                        </Link>
                      ) : (
                        <span className="line-clamp-2 text-xs font-medium leading-snug text-muted-foreground">{title}</span>
                      )}
                      {b ? (
                        <p className="text-[10px] leading-snug text-muted-foreground tabular-nums">
                          {b.publicationYear} г. · {b.pages} стр.
                          <span className="mt-0.5 block text-[10px] leading-snug">{favoriteAuthorsLine(b)}</span>
                        </p>
                      ) : null}
                      <p className="text-[10px] text-muted-foreground">
                        Добавлено {formatRuDateTimeFromIso(row.addedAt)}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-auto h-8 text-destructive hover:text-destructive"
                        disabled={removingId === row.bookId}
                        onClick={() => void removeRow(row)}
                      >
                        Убрать
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            <InfiniteScrollSentinel
              hasMore={hasMore}
              loading={loading}
              onLoadMore={() => setPage((p) => p + 1)}
            />
            {loading && items.length > 0 ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">Подгрузка…</p>
            ) : null}
          </>
        )}

        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/">
            <BookOpen className="mr-2 size-4" />
            К каталогу
          </Link>
        </Button>
      </div>
    </AppShell>
  )
}
