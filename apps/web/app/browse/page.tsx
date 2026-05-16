"use client"

import Link from "next/link"
import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { BookOpen, ImageIcon } from "lucide-react"
import { libraryPublicClient } from "@/client/library-public-client"
import type { LibraryAuthor, LibraryBook, LibraryBooksListFilters } from "@/client/library-client"
import { AdminFormSelect } from "@/components/admin-form-select"
import { AppShell } from "@/components/app-shell"
import { InfiniteScrollSentinel } from "@/components/infinite-scroll-sentinel"
import { useAppScrollRoot } from "@/hooks/use-app-scroll-root"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { BOOK_CARD_GRID_CLASS } from "@/lib/book-card-grid"
import { cn } from "@workspace/ui/lib/utils"

const FILTER_ALL = "__all__"
const PAGE_LIMIT = 12

function authorsLine(book: Pick<LibraryBook, "bookAuthors">): string {
  const parts =
    book.bookAuthors
      ?.map((ba) => {
        const a = ba.author
        return [a.lastName, a.firstName].filter(Boolean).join(" ").trim()
      })
      .filter(Boolean) ?? []
  return parts.length ? parts.join(", ") : "—"
}

function filterPayload(
  categoryId: string,
  publishingHouseId: string,
  cityId: string,
  authorId: string,
  hasCover: string,
): LibraryBooksListFilters | undefined {
  const f: LibraryBooksListFilters = {}
  if (categoryId !== FILTER_ALL) f.categoryId = categoryId
  if (publishingHouseId !== FILTER_ALL) f.publishingHouseId = publishingHouseId
  if (cityId !== FILTER_ALL) f.cityId = cityId
  if (authorId !== FILTER_ALL) f.authorId = authorId
  if (hasCover === "yes") f.hasCover = true
  if (hasCover === "no") f.hasCover = false
  return Object.keys(f).length ? f : undefined
}

function CatalogBookCard({ book }: { book: LibraryBook }) {
  const full = book
  const categoryName = full.category?.name ?? null
  const authors = full.bookAuthors?.length ? authorsLine(full) : null

  return (
    <Link
      href={`/books/${book.id}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-lg border bg-card text-left shadow-sm transition-all",
        "hover:border-primary/35 hover:shadow",
        "outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className="relative flex h-[4.75rem] shrink-0 items-center justify-center bg-muted/70 text-muted-foreground sm:h-[5.25rem]">
        {book.hasCover ? (
          <ImageIcon className="size-7 opacity-40 sm:size-8" aria-hidden />
        ) : (
          <BookOpen className="size-7 opacity-40 sm:size-8" aria-hidden />
        )}
        {categoryName ? (
          <Badge
            variant="secondary"
            className="absolute bottom-1 left-1 right-1 max-w-[calc(100%-0.5rem)] truncate px-1 py-0 text-[9px] font-normal leading-tight"
          >
            {categoryName}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-2 pt-1.5">
        <span className="line-clamp-2 text-xs font-medium leading-tight text-foreground group-hover:text-primary">
          {book.title}
        </span>
        <span className="line-clamp-1 text-[10px] text-muted-foreground tabular-nums">
          {book.publicationYear} г. · {book.isbn}
        </span>
        {authors ? (
          <span className="line-clamp-1 text-[10px] text-muted-foreground">{authors}</span>
        ) : null}
      </div>
    </Link>
  )
}

function BrowsePageInner() {
  const searchParams = useSearchParams()
  const catalogQueryKey = searchParams.toString()
  const scrollRoot = useAppScrollRoot()

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [houses, setHouses] = useState<{ id: string; name: string }[]>([])
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [authors, setAuthors] = useState<LibraryAuthor[]>([])
  const [catalogRefsReady, setCatalogRefsReady] = useState(false)

  const [categoryId, setCategoryId] = useState(FILTER_ALL)
  const [publishingHouseId, setPublishingHouseId] = useState(FILTER_ALL)
  const [cityId, setCityId] = useState(FILTER_ALL)
  const [authorId, setAuthorId] = useState(FILTER_ALL)
  const [hasCover, setHasCover] = useState<string>(FILTER_ALL)

  const [page, setPage] = useState(1)
  const [catalogBooks, setCatalogBooks] = useState<LibraryBook[]>([])
  const [catalogTotal, setCatalogTotal] = useState(0)
  const [listLoading, setListLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const [c, p, ci, a] = await Promise.all([
          libraryPublicClient.listCategories(),
          libraryPublicClient.listPublishingHouses(),
          libraryPublicClient.listCities(),
          libraryPublicClient.listAuthors(),
        ])
        setCategories(c)
        setHouses(p)
        setCities(ci)
        setAuthors(a)
      } catch {
        toast.error("Не удалось загрузить справочники для фильтров.")
      } finally {
        setCatalogRefsReady(true)
      }
    })()
  }, [])

  useEffect(() => {
    if (!catalogRefsReady) return
    const qCategory = searchParams.get("categoryId")?.trim() ?? ""
    const qHouse = searchParams.get("publishingHouseId")?.trim() ?? ""
    const qCity = searchParams.get("cityId")?.trim() ?? ""
    const qAuthor = searchParams.get("authorId")?.trim() ?? ""
    if (!qCategory && !qHouse && !qCity && !qAuthor) return

    const nextCategory =
      qCategory && categories.some((c) => c.id === qCategory) ? qCategory : FILTER_ALL
    const nextHouse =
      qHouse && houses.some((h) => h.id === qHouse) ? qHouse : FILTER_ALL
    const nextCity = qCity && cities.some((c) => c.id === qCity) ? qCity : FILTER_ALL
    const nextAuthor =
      qAuthor && authors.some((a) => a.id === qAuthor) ? qAuthor : FILTER_ALL

    setCategoryId(nextCategory)
    setPublishingHouseId(nextHouse)
    setCityId(nextCity)
    setAuthorId(nextAuthor)
  }, [
    catalogQueryKey,
    catalogRefsReady,
    searchParams,
    categories,
    houses,
    cities,
    authors,
  ])

  const filtersForApi = useMemo(
    () => filterPayload(categoryId, publishingHouseId, cityId, authorId, hasCover),
    [categoryId, publishingHouseId, cityId, authorId, hasCover],
  )

  useEffect(() => {
    setPage(1)
    setCatalogBooks([])
    setCatalogTotal(0)
  }, [filtersForApi])

  useEffect(() => {
    let cancelled = false
    const requestedPage = page
    setListLoading(true)
    void libraryPublicClient
      .listBooks(undefined, { page: requestedPage, limit: PAGE_LIMIT }, filtersForApi)
      .then((res) => {
        if (cancelled) return
        setCatalogTotal(res.total)
        if (requestedPage <= 1) {
          setCatalogBooks(res.items)
        } else {
          setCatalogBooks((prev) => {
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
          const msg = e instanceof Error ? e.message : "Ошибка загрузки каталога."
          toast.error(msg)
          if (requestedPage <= 1) {
            setCatalogBooks([])
            setCatalogTotal(0)
          }
        }
      })
      .finally(() => {
        if (!cancelled) setListLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filtersForApi, page])

  const categoryOptions = useMemo(
    () => [
      { value: FILTER_ALL, label: "Все категории" },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories],
  )
  const houseOptions = useMemo(
    () => [
      { value: FILTER_ALL, label: "Все издательства" },
      ...houses.map((h) => ({ value: h.id, label: h.name })),
    ],
    [houses],
  )
  const cityOptions = useMemo(
    () => [
      { value: FILTER_ALL, label: "Все города" },
      ...cities.map((c) => ({ value: c.id, label: c.name })),
    ],
    [cities],
  )
  const authorOptions = useMemo(
    () => [
      { value: FILTER_ALL, label: "Все авторы" },
      ...authors.map((a) => ({
        value: a.id,
        label: [a.lastName, a.firstName].filter(Boolean).join(" ").trim() || a.id,
      })),
    ],
    [authors],
  )
  const coverOptions = [
    { value: FILTER_ALL, label: "Обложка: любые" },
    { value: "yes", label: "С обложкой" },
    { value: "no", label: "Без обложки" },
  ]

  const catalogHasMore = catalogBooks.length < catalogTotal

  return (
    <AppShell>
      <div className="flex w-full flex-col gap-8 pb-10">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <BookOpen className="size-7 shrink-0 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Каталог книг</h1>
          </div>
          <p className="text-sm text-muted-foreground text-pretty">
            Поиск по названию и ISBN — кнопка «Поиск» в шапке (или{" "}
            <kbd className="rounded border bg-muted px-1 font-mono text-xs">⌘K</kbd>
            ). Здесь можно сузить список фильтрами.
          </p>
          <p className="text-sm text-muted-foreground">
            <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
              На главную
            </Link>
            {" · "}
            <Link
              href="/categories"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Список категорий
            </Link>
          </p>
        </header>

        <Card className="border bg-card/80 shadow-sm backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Фильтры</CardTitle>
            <CardDescription>Уточните категорию, издательство, город, автора или наличие обложки.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AdminFormSelect
                label="Категория"
                value={categoryId}
                onValueChange={setCategoryId}
                options={categoryOptions}
              />
              <AdminFormSelect
                label="Издательство"
                value={publishingHouseId}
                onValueChange={setPublishingHouseId}
                options={houseOptions}
              />
              <AdminFormSelect
                label="Город издания"
                value={cityId}
                onValueChange={setCityId}
                options={cityOptions}
              />
              <AdminFormSelect
                label="Автор"
                value={authorId}
                onValueChange={setAuthorId}
                options={authorOptions}
              />
              <AdminFormSelect
                label="Обложка"
                value={hasCover}
                onValueChange={setHasCover}
                options={coverOptions}
              />
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Книги</h2>
            {catalogTotal > 0 ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                Найдено: {catalogTotal}
                {catalogBooks.length < catalogTotal ? ` · показано ${catalogBooks.length}` : null}
              </span>
            ) : !listLoading ? (
              <span className="text-xs text-muted-foreground tabular-nums">Найдено: 0</span>
            ) : null}
          </div>
          <div className="min-h-[200px]">
            {listLoading && catalogBooks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Загрузка…</p>
            ) : !catalogBooks.length ? (
              <p className="text-sm text-muted-foreground">
                Ничего не найдено — ослабьте фильтры или воспользуйтесь поиском в шапке.
              </p>
            ) : (
              <>
                <div className={BOOK_CARD_GRID_CLASS}>
                  {catalogBooks.map((b) => (
                    <CatalogBookCard key={b.id} book={b} />
                  ))}
                </div>
                <InfiniteScrollSentinel
                  hasMore={catalogHasMore}
                  loading={listLoading}
                  scrollRoot={scrollRoot}
                  onLoadMore={() => setPage((p) => p + 1)}
                />
                {listLoading && catalogBooks.length > 0 ? (
                  <p className="mt-4 text-center text-xs text-muted-foreground">Подгрузка…</p>
                ) : null}
              </>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <p className="text-sm text-muted-foreground">Загрузка каталога…</p>
        </AppShell>
      }
    >
      <BrowsePageInner />
    </Suspense>
  )
}
