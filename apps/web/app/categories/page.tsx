"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { BookMarked, Tags } from "lucide-react"
import {
  libraryPublicClient,
  type LibraryPopularByCategoryResponse,
} from "@/client/library-public-client"
import type { LibraryCategory } from "@/client/library-client"
import { AppShell } from "@/components/app-shell"
import { PopularBookCard } from "@/components/popular-book-card"
import { BOOK_CARD_GRID_CLASS } from "@/lib/book-card-grid"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const POPULAR_PER_CATEGORY = 4

export default function CategoriesPage() {
  const [items, setItems] = useState<LibraryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [popular, setPopular] = useState<LibraryPopularByCategoryResponse | null>(null)

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
      <div className="flex w-full max-w-5xl flex-col gap-10">
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <Link key={c.id} href={`/categories/${c.id}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base leading-snug">{c.name}</CardTitle>
                    <CardDescription className="tabular-nums">
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
            <div className="grid gap-6 lg:grid-cols-2">
              {popular.sections.map((sec) => (
                <Card key={sec.category.id} className="overflow-hidden shadow-sm">
                  <CardHeader className="border-b bg-muted/30 pb-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{sec.category.name}</CardTitle>
                        <CardDescription>Популярное в этой категории</CardDescription>
                      </div>
                      <Link
                        href={`/categories/${sec.category.id}`}
                        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Все книги раздела
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className={BOOK_CARD_GRID_CLASS}>
                      {sec.books.map((b) => (
                        <PopularBookCard
                          key={b.id}
                          book={b}
                          badgeLabel={sec.category.name}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
