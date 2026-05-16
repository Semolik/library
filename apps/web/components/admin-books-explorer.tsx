"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import {
  libraryClient,
  type LibraryAuthor,
  type LibraryBook,
  type LibraryBooksListFilters,
  type LibraryCategory,
  type LibraryCity,
  type LibraryPublishingHouse,
} from "@/client/library-client"
import { AdminFormSelect } from "@/components/admin-form-select"
import { AdminBookCoverThumb } from "@/components/admin-book-cover-thumb"
import { InfiniteScrollSentinel } from "@/components/infinite-scroll-sentinel"
import { BOOK_CARD_GRID_CLASS } from "@/lib/book-card-grid"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import { LayoutGrid, Pencil, Table2, Trash2 } from "lucide-react"

export const ADMIN_BOOKS_PAGE_SIZE = 20
export const ADMIN_BOOKS_SEARCH_DEBOUNCE_MS = 350
export const ADMIN_BOOKS_FILTER_ALL = "__all__"

export type AdminBooksExplorerPurpose = "manage" | "pick"

export type AdminBooksSharedRefs = {
  categories: LibraryCategory[]
  publishingHouses: LibraryPublishingHouse[]
  cities: LibraryCity[]
  authors: LibraryAuthor[]
}

function authorLabel(a: LibraryAuthor) {
  return [a.lastName, a.firstName, a.middleName].filter(Boolean).join(" ")
}

function bookAuthorsLine(book: LibraryBook) {
  const list = book.bookAuthors?.map((row) => authorLabel(row.author)) ?? []
  return list.length ? list.join("; ") : "—"
}

export type AdminBooksExplorerProps = {
  token?: string | null
  purpose: AdminBooksExplorerPurpose
  /** Ключ localStorage для вида карточки/таблица (по умолчанию — как в разделе «Книги») */
  viewStorageKey?: string
  /** Слот справа в первой строке тулбара (кнопка «Добавить книгу» и т.п.) */
  toolbarEnd?: React.ReactNode
  onPickBook?: (book: LibraryBook) => void
  onRequestDelete?: (book: LibraryBook) => void
  className?: string
  /** Если задано — фильтры используют эти справочники без повторной загрузки */
  sharedRefs?: AdminBooksSharedRefs
  /** Увеличьте после создания/удаления книги снаружи, чтобы список перезапросился */
  listRevision?: number
}

export function AdminBooksExplorer({
  token,
  purpose,
  viewStorageKey = "library-admin-books-view",
  toolbarEnd,
  onPickBook,
  onRequestDelete,
  className,
  sharedRefs,
  listRevision = 0,
}: AdminBooksExplorerProps) {
  const pickMode = purpose === "pick"

  const [books, setBooks] = React.useState<LibraryBook[]>([])
  const [booksTotal, setBooksTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [internalCategories, setInternalCategories] = React.useState<LibraryCategory[]>([])
  const [internalPublishingHouses, setInternalPublishingHouses] = React.useState<
    LibraryPublishingHouse[]
  >([])
  const [internalCities, setInternalCities] = React.useState<LibraryCity[]>([])
  const [internalAuthors, setInternalAuthors] = React.useState<LibraryAuthor[]>([])
  const categories = sharedRefs?.categories ?? internalCategories
  const publishingHouses = sharedRefs?.publishingHouses ?? internalPublishingHouses
  const cities = sharedRefs?.cities ?? internalCities
  const authors = sharedRefs?.authors ?? internalAuthors
  const [searchInput, setSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [loading, setLoading] = React.useState(true)
  type BooksViewMode = "cards" | "table"
  const [viewMode, setViewMode] = React.useState<BooksViewMode>("cards")
  const [coverUrlsById, setCoverUrlsById] = React.useState<Record<string, string>>({})
  const [listScrollEl, setListScrollEl] = React.useState<HTMLDivElement | null>(null)
  const [categoryFilter, setCategoryFilter] = React.useState(ADMIN_BOOKS_FILTER_ALL)
  const [publishingFilter, setPublishingFilter] = React.useState(ADMIN_BOOKS_FILTER_ALL)
  const [cityFilter, setCityFilter] = React.useState(ADMIN_BOOKS_FILTER_ALL)
  const [authorFilter, setAuthorFilter] = React.useState(ADMIN_BOOKS_FILTER_ALL)
  const [coverFilter, setCoverFilter] = React.useState<
    typeof ADMIN_BOOKS_FILTER_ALL | "yes" | "no"
  >(ADMIN_BOOKS_FILTER_ALL)

  const categoryFilterId = React.useId()
  const publishingFilterId = React.useId()
  const cityFilterId = React.useId()
  const authorFilterId = React.useId()
  const coverFilterId = React.useId()

  const listFilters = React.useMemo((): LibraryBooksListFilters => {
    const f: LibraryBooksListFilters = {}
    if (categoryFilter !== ADMIN_BOOKS_FILTER_ALL) f.categoryId = categoryFilter
    if (publishingFilter !== ADMIN_BOOKS_FILTER_ALL) f.publishingHouseId = publishingFilter
    if (cityFilter !== ADMIN_BOOKS_FILTER_ALL) f.cityId = cityFilter
    if (authorFilter !== ADMIN_BOOKS_FILTER_ALL) f.authorId = authorFilter
    if (coverFilter === "yes") f.hasCover = true
    if (coverFilter === "no") f.hasCover = false
    return f
  }, [categoryFilter, publishingFilter, cityFilter, authorFilter, coverFilter])

  const loadRefs = React.useCallback(async () => {
    if (!token?.trim()) {
      return
    }
    try {
      const [cat, pub, cit, auth] = await Promise.all([
        libraryClient.listCategories(token),
        libraryClient.listPublishingHouses(token),
        libraryClient.listCities(token),
        libraryClient.listAuthors(token),
      ])
      setInternalCategories(cat)
      setInternalPublishingHouses(pub)
      setInternalCities(cit)
      setInternalAuthors(auth)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить справочники.")
    }
  }, [token])

  const categoryFilterOptions = React.useMemo(
    () => [
      { value: ADMIN_BOOKS_FILTER_ALL, label: "Все категории" },
      ...[...categories].sort((a, b) => a.name.localeCompare(b.name, "ru")).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    ],
    [categories],
  )

  const publishingFilterOptions = React.useMemo(
    () => [
      { value: ADMIN_BOOKS_FILTER_ALL, label: "Все издательства" },
      ...[...publishingHouses].sort((a, b) => a.name.localeCompare(b.name, "ru")).map((p) => ({
        value: p.id,
        label: p.name,
      })),
    ],
    [publishingHouses],
  )

  const cityFilterOptions = React.useMemo(
    () => [
      { value: ADMIN_BOOKS_FILTER_ALL, label: "Все города" },
      ...[...cities].sort((a, b) => a.name.localeCompare(b.name, "ru")).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    ],
    [cities],
  )

  const authorFilterOptions = React.useMemo(
    () => [
      { value: ADMIN_BOOKS_FILTER_ALL, label: "Все авторы" },
      ...[...authors]
        .sort((a, b) => authorLabel(a).localeCompare(authorLabel(b), "ru"))
        .map((a) => ({
          value: a.id,
          label: authorLabel(a),
        })),
    ],
    [authors],
  )

  const coverFilterOptions = React.useMemo(
    () => [
      { value: ADMIN_BOOKS_FILTER_ALL, label: "Обложка: любые" },
      { value: "yes", label: "С обложкой" },
      { value: "no", label: "Без обложки" },
    ],
    [],
  )

  React.useEffect(() => {
    try {
      const v = window.localStorage.getItem(viewStorageKey)
      if (v === "table") setViewMode("table")
    } catch {
      /* ignore */
    }
  }, [viewStorageKey])

  function persistView(mode: BooksViewMode) {
    setViewMode(mode)
    try {
      window.localStorage.setItem(viewStorageKey, mode)
    } catch {
      /* ignore */
    }
  }

  React.useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null
      const q = searchInput.trim()
      setDebouncedSearch((prev) => {
        return q
      })
    }, ADMIN_BOOKS_SEARCH_DEBOUNCE_MS)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [searchInput])

  function commitSearchImmediate() {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = null
    }
    const q = searchInput.trim()
    setDebouncedSearch((prev) => {
      return q
    })
  }

  React.useEffect(() => {
    setPage(1)
    setBooks([])
    setBooksTotal(0)
  }, [debouncedSearch, listFilters, listRevision])

  React.useEffect(() => {
    let cancelled = false
    const requestedPage = page
    ;(async () => {
      if (!token?.trim()) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        if (!sharedRefs) {
          await loadRefs()
        }
        const res = await libraryClient.listBooks(
          token,
          debouncedSearch,
          {
            page: requestedPage,
            limit: ADMIN_BOOKS_PAGE_SIZE,
          },
          listFilters,
        )
        if (!cancelled) {
          setBooksTotal(res.total)
          if (requestedPage <= 1) {
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
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Не удалось загрузить данные.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadRefs, token, debouncedSearch, page, listFilters, sharedRefs, listRevision])

  React.useEffect(() => {
    let cancelled = false
    const withCover = books.filter((b) => b.hasCover)
    if (withCover.length === 0) {
      setCoverUrlsById({})
      return
    }
    ;(async () => {
      const next: Record<string, string> = {}
      await Promise.all(
        withCover.map(async (b) => {
          try {
            const { url } = await libraryClient.getCoverUrl(b.id, token)
            next[b.id] = url
          } catch {
            /* без превью */
          }
        }),
      )
      if (!cancelled) setCoverUrlsById(next)
    })()
    return () => {
      cancelled = true
    }
  }, [books, token])

  async function openCover(bookId: string) {
    try {
      const { url } = await libraryClient.getCoverUrl(bookId, token)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch {
      toast.error("Не удалось открыть изображение.")
    }
  }

  function handlePick(book: LibraryBook) {
    onPickBook?.(book)
  }

  const booksHasMore = books.length < booksTotal

  const cardClass =
    "group flex w-full min-w-0 max-w-full cursor-pointer flex-col overflow-hidden rounded-xl text-left outline-none ring-offset-background transition-opacity hover:opacity-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

  return (
    <div className={className ?? "flex min-h-0 min-w-0 flex-1 flex-col gap-4"}>
      <div className="flex shrink-0 flex-col gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid flex-1 gap-1.5 sm:min-w-[240px] sm:max-w-md">
            <Label htmlFor="books-explorer-search">Поиск по названию или ISBN</Label>
            <Input
              id="books-explorer-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Например: Толстой или 978-5..."
              onKeyDown={(e) => {
                if (e.key === "Enter") commitSearchImmediate()
              }}
              aria-busy={loading}
            />
          </div>
          <div
            className="flex rounded-lg border border-border bg-muted/40 p-0.5"
            role="group"
            aria-label="Вид списка книг"
          >
            <Button
              type="button"
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => persistView("cards")}
            >
              <LayoutGrid className="size-4" />
              Карточки
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => persistView("table")}
            >
              <Table2 className="size-4" />
              Таблица
            </Button>
          </div>
          {toolbarEnd}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <AdminFormSelect
            id={categoryFilterId}
            label="Категория"
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v)
            }}
            placeholder="Все категории"
            disabled={categories.length === 0}
            options={categoryFilterOptions}
          />
          <AdminFormSelect
            id={publishingFilterId}
            label="Издательство"
            value={publishingFilter}
            onValueChange={(v) => {
              setPublishingFilter(v)
            }}
            placeholder="Все издательства"
            disabled={publishingHouses.length === 0}
            options={publishingFilterOptions}
          />
          <AdminFormSelect
            id={cityFilterId}
            label="Город"
            value={cityFilter}
            onValueChange={(v) => {
              setCityFilter(v)
            }}
            placeholder="Все города"
            disabled={cities.length === 0}
            options={cityFilterOptions}
          />
          <AdminFormSelect
            id={authorFilterId}
            label="Автор"
            value={authorFilter}
            onValueChange={(v) => {
              setAuthorFilter(v)
            }}
            placeholder="Все авторы"
            disabled={authors.length === 0}
            options={authorFilterOptions}
          />
          <AdminFormSelect
            id={coverFilterId}
            label="Обложка"
            value={coverFilter}
            onValueChange={(v) => {
              setCoverFilter(v === "yes" ? "yes" : v === "no" ? "no" : ADMIN_BOOKS_FILTER_ALL)
            }}
            placeholder="Любые"
            options={coverFilterOptions}
          />
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          {books.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col py-8">
              <p className="text-left text-sm text-muted-foreground">
                {loading ? "Загрузка…" : pickMode ? "Нет книг по фильтрам." : "Книги не найдены."}
              </p>
            </div>
          ) : (
              <div
                ref={setListScrollEl}
                className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto"
              >
              <div className={cn("w-full min-w-0", BOOK_CARD_GRID_CLASS)}>
                {books.map((book) =>
                  pickMode ? (
                    <button
                      key={book.id}
                      type="button"
                      className={cardClass}
                      onClick={() => handlePick(book)}
                    >
                      <div className="w-full overflow-hidden rounded-xl bg-muted">
                        <AdminBookCoverThumb
                          book={book}
                          url={coverUrlsById[book.id]}
                          layout="poster"
                          barePoster
                          className="w-full"
                        />
                      </div>
                      <div className="w-full space-y-2 pt-4">
                        <span className="line-clamp-2 text-left text-base font-semibold leading-snug tracking-tight">
                          {book.title}
                        </span>
                        <p className="font-mono text-xs text-muted-foreground">{book.isbn}</p>
                        <p className="text-sm text-muted-foreground">
                          {book.publicationYear} · {book.pages} стр. · {book.copyCount ?? 0} экз.
                        </p>
                        <p className="line-clamp-2 text-left text-xs leading-relaxed text-muted-foreground">
                          {bookAuthorsLine(book)}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <Link
                      key={book.id}
                      href={`/admin/books/${book.id}`}
                      className={cardClass}
                    >
                      <div className="w-full overflow-hidden rounded-xl bg-muted transition-[transform,opacity] duration-200 group-hover:opacity-[0.97]">
                        <AdminBookCoverThumb
                          book={book}
                          url={coverUrlsById[book.id]}
                          layout="poster"
                          barePoster
                          className="w-full"
                        />
                      </div>
                      <div className="w-full space-y-2 pt-4">
                        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">
                          {book.title}
                        </h3>
                        <p className="font-mono text-xs text-muted-foreground">{book.isbn}</p>
                        <p className="text-sm text-muted-foreground">
                          {book.publicationYear} · {book.pages} стр. · {book.copyCount ?? 0} экз.
                        </p>
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {bookAuthorsLine(book)}
                        </p>
                      </div>
                    </Link>
                  ),
                )}
              </div>
              <InfiniteScrollSentinel
                hasMore={booksHasMore}
                loading={loading}
                onLoadMore={() => setPage((p) => p + 1)}
                scrollRoot={listScrollEl}
              />
            </div>
          )}
          <p className="shrink-0 text-xs text-muted-foreground">
            {booksTotal > 0
              ? `Показано ${books.length} из ${booksTotal}${
                  loading && books.length > 0 ? " · Подгрузка…" : ""
                }`
              : null}
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          {books.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col py-8">
              <p className="text-left text-sm text-muted-foreground">
                {loading ? "Загрузка…" : pickMode ? "Нет книг по фильтрам." : "Книги не найдены."}
              </p>
            </div>
          ) : (
            <div ref={setListScrollEl} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Обложка</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead className="hidden lg:table-cell">ISBN</TableHead>
                    <TableHead className="hidden md:table-cell">Год</TableHead>
                    <TableHead className="hidden xl:table-cell">Стр.</TableHead>
                    <TableHead className="hidden xl:table-cell">Категория</TableHead>
                    <TableHead className="hidden 2xl:table-cell">Издательство</TableHead>
                    <TableHead className="hidden 2xl:table-cell">Город</TableHead>
                    <TableHead className="hidden lg:table-cell">Авторы</TableHead>
                    <TableHead className="text-center">Экз.</TableHead>
                    {!pickMode ? <TableHead className="text-right">Действия</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((book) =>
                    pickMode ? (
                      <TableRow
                        key={book.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handlePick(book)}
                      >
                        <TableCell
                          className="align-middle"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          <AdminBookCoverThumb
                            book={book}
                            url={coverUrlsById[book.id]}
                            layout="thumb"
                            onOpen={book.hasCover ? () => void openCover(book.id) : undefined}
                          />
                        </TableCell>
                        <TableCell className="max-w-[min(28rem,40vw)] whitespace-normal font-medium">
                          {book.title}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{book.isbn}</TableCell>
                        <TableCell className="hidden md:table-cell">{book.publicationYear}</TableCell>
                        <TableCell className="hidden xl:table-cell">{book.pages}</TableCell>
                        <TableCell className="hidden xl:table-cell">{book.category?.name ?? "—"}</TableCell>
                        <TableCell className="hidden 2xl:table-cell whitespace-normal">
                          {book.publishingHouse?.name ?? "—"}
                        </TableCell>
                        <TableCell className="hidden 2xl:table-cell">{book.city?.name ?? "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell max-w-xl whitespace-normal">
                          {bookAuthorsLine(book)}
                        </TableCell>
                        <TableCell className="text-center">{book.copyCount ?? 0}</TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={book.id}>
                        <TableCell className="align-middle">
                          <AdminBookCoverThumb
                            book={book}
                            url={coverUrlsById[book.id]}
                            layout="thumb"
                            onOpen={book.hasCover ? () => void openCover(book.id) : undefined}
                          />
                        </TableCell>
                        <TableCell className="max-w-[min(28rem,40vw)] whitespace-normal font-medium">
                          <Link href={`/admin/books/${book.id}`} className="hover:underline">
                            {book.title}
                          </Link>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{book.isbn}</TableCell>
                        <TableCell className="hidden md:table-cell">{book.publicationYear}</TableCell>
                        <TableCell className="hidden xl:table-cell">{book.pages}</TableCell>
                        <TableCell className="hidden xl:table-cell">{book.category?.name ?? "—"}</TableCell>
                        <TableCell className="hidden 2xl:table-cell whitespace-normal">
                          {book.publishingHouse?.name ?? "—"}
                        </TableCell>
                        <TableCell className="hidden 2xl:table-cell">{book.city?.name ?? "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell max-w-xl whitespace-normal">
                          {bookAuthorsLine(book)}
                        </TableCell>
                        <TableCell className="text-center">{book.copyCount ?? 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button type="button" variant="ghost" size="icon-sm" asChild>
                              <Link href={`/admin/books/${book.id}`}>
                                <Pencil className="size-4" />
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => onRequestDelete?.(book)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
              <InfiniteScrollSentinel
                hasMore={booksHasMore}
                loading={loading}
                onLoadMore={() => setPage((p) => p + 1)}
                scrollRoot={listScrollEl}
              />
            </div>
          )}
          <p className="shrink-0 text-xs text-muted-foreground">
            {booksTotal > 0
              ? `Показано ${books.length} из ${booksTotal}${
                  loading && books.length > 0 ? " · Подгрузка…" : ""
                }`
              : null}
          </p>
        </div>
      )}
    </div>
  )
}
