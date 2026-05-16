"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { BookMarked, Tags } from "lucide-react"
import {
  libraryPublicClient,
  type LibraryPopularByCategoryResponse,
  type LibraryPopularBookSnippet,
} from "@/client/library-public-client"
import type { LibraryCategory } from "@/client/library-client"
import { AppShell } from "@/components/app-shell"
import { CatalogBookPosterCard } from "@/components/catalog-book-poster-card"
import { usePublicBookCoverUrls } from "@/hooks/use-public-book-cover-urls"
import { BOOK_CARD_GRID_CLASS } from "@/lib/book-card-grid"
import { cn } from "@workspace/ui/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const POPULAR_PER_CATEGORY = 4

function popularSnippetToPosterBook(b: LibraryPopularBookSnippet) {
  return {
    id: b.id,
    title: b.title,
    isbn: b.isbn,
    publicationYear: b.publicationYear,
    pages: b.pages,
    hasCover: b.hasCover,
  }
}

export default function CategoriesPage() {
  const [items, setItems] = useState<LibraryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [popular, setPopular] = useState<LibraryPopularByCategoryResponse | null>(null)

  const popularCoverKeys = useMemo(
    () =>
      (popular?.sections.flatMap((s) => s.books) ?? []).map((b) => ({
        id: b.id,
        hasCover: b.hasCover,
      })),
    [popular],
  )
  const popularCoverUrlsById = usePublicBookCoverUrls(popularCoverKeys)

  useEffect(() => {
    void libraryPublicClient
      .listCategories()
      .then(setItems)
      .catch(() => {
        toast.error("Не удалось загрузить категории.")
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    void libraryPublicClient
      .popularByCategory(POPULAR_PER_CATEGORY)
      .then(setPopular)
      .catch(() => {
        toast.error("Не удалось загрузить подборку «популярное».")
        setPopular(null)
      })
  }, [])

  return (
    <AppShell>
      <div className="flex w-full flex-col gap-10">
        <div className="flex items-start gap-3">
          <Tags className="mt-0.5 size-6 shrink-0 text-primary" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Категории фонда</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Перейдите в раздел, чтобы видеть книги этой категории в каталоге.
            </p>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : !items.length ? (
          <p className="text-sm text-muted-foreground">Категорий пока нет.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((c) => (
              <Link key={c.id} href={`/categories/${c.id}`}>
                <Card className="h-full py-0 transition-colors hover:border-primary/40">
                  <CardHeader className="gap-1 p-3">
                    <CardTitle className="text-sm leading-snug">{c.name}</CardTitle>
                    <CardDescription className="text-xs tabular-nums">
                      Книг в фонде: {c.bookCount ?? 0}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <section className="space-y-4 border-t pt-10">
          <div className="flex flex-wrap items-end gap-2">
            <BookMarked className="size-5 text-muted-foreground" aria-hidden />
            <div>
              <h2 className="text-lg font-semibold">Популярное по категориям</h2>
              <p className="text-sm text-muted-foreground">
                В каждом блоке — книги, которые чаще брали в этой категории (по числу выдач за всё время).
              </p>
            </div>
          </div>
          {!popular?.sections.length ? (
            <p className="text-sm text-muted-foreground">
              {popular === null
                ? "Загрузка…"
                : "Пока нет статистики выдач по категориям — воспользуйтесь каталогом или поиском в шапке."}
            </p>
          ) : (
            <div className="space-y-10">
              {popular.sections.map((sec) => (
                <div key={sec.category.id} className="space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h3 className="text-base font-semibold tracking-tight">{sec.category.name}</h3>
                    <Link
                      href={`/categories/${sec.category.id}`}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Все книги раздела
                    </Link>
                  </div>
                  <div className={cn("w-full min-w-0", BOOK_CARD_GRID_CLASS)}>
                    {sec.books.map((b) => (
                      <CatalogBookPosterCard
                        key={b.id}
                        book={popularSnippetToPosterBook(b)}
                        coverUrl={popularCoverUrlsById[b.id]}
                        statsLine={`${b.publicationYear} · ${b.pages} стр. · ${b.rentCount} выд.`}
                        hideAuthorsLine
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
