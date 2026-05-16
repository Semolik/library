"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  libraryClient,
  type LibraryFavoriteRow,
} from "@/client/library-client"
import { ApiError } from "@/client/api-client"
import { AppShell } from "@/components/app-shell"
import {
  CatalogBookPosterCard,
  favoriteBriefToPosterInput,
} from "@/components/catalog-book-poster-card"
import { CenteredFormShell } from "@/components/centered-form-shell"
import { InfiniteScrollSentinel } from "@/components/infinite-scroll-sentinel"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/components/auth-provider"
import { usePublicBookCoverUrls } from "@/hooks/use-public-book-cover-urls"
import { BOOK_CARD_GRID_CLASS } from "@/lib/book-card-grid"
import { cn } from "@workspace/ui/lib/utils"

const FAVORITES_PAGE_LIMIT = 20

export default function FavoritesPage() {
  const { isHydrated, isAuthenticated, token, login } = useAuth()
  const [items, setItems] = useState<LibraryFavoriteRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const coverKeys = useMemo(
    () =>
      items.flatMap((row) =>
        row.book ? [{ id: row.book.id, hasCover: row.book.hasCover }] : [],
      ),
    [items],
  )
  const coverUrlsById = usePublicBookCoverUrls(coverKeys)

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
  const favoriteBooks = items.flatMap((row) => (row.book ? [row.book] : []))

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
            <div className={cn("w-full min-w-0", BOOK_CARD_GRID_CLASS)}>
              {favoriteBooks.map((b) => (
                <CatalogBookPosterCard
                  key={b.id}
                  book={favoriteBriefToPosterInput(b)}
                  coverUrl={coverUrlsById[b.id]}
                />
              ))}
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

      </div>
    </AppShell>
  )
}
