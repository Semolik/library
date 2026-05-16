"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, BookOpen, Building2, ChevronRight, MapPin, Pencil, Tags, Users } from "lucide-react"
import { libraryPublicClient, type LibraryBookAvailabilityRow } from "@/client/library-public-client"
import type { LibraryAuthor, LibraryBook } from "@/client/library-client"
import { ApiError } from "@/client/api-client"
import { AppShell } from "@/components/app-shell"
import { BookFavoriteToggle } from "@/components/book-favorite-toggle"
import { useAuth } from "@/components/auth-provider"
import { catalogHomeWithFilters } from "@/lib/catalog-deep-link"
import { isLibraryCatalogAdminRole } from "@/lib/library-staff"
import { BOOK_COVER_ASPECT_CLASS } from "@/components/admin-book-cover-thumb"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

const linkMeta = cn(
  "font-medium text-primary underline-offset-4 transition-colors hover:text-primary/90 hover:underline",
)

function authorShortName(a: LibraryAuthor): string {
  return [a.lastName, a.firstName].filter(Boolean).join(" ").trim() || "Автор"
}

export default function PublicBookPage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""
  const { user, isHydrated } = useAuth()

  const [book, setBook] = useState<LibraryBook | null>(null)
  const [availability, setAvailability] = useState<LibraryBookAvailabilityRow[] | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id?.trim()) return
    setLoading(true)
    setCoverUrl(null)
    try {
      const b = await libraryPublicClient.getBook(id.trim())
      setBook(b)
      const av = await libraryPublicClient.getBookAvailability(id.trim())
      setAvailability(av)
      if (b.hasCover) {
        try {
          const { url } = await libraryPublicClient.getCoverUrl(id.trim())
          setCoverUrl(url)
        } catch (e) {
          if (!(e instanceof ApiError && e.status === 404)) {
            /* ignore */
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось загрузить карточку."
      toast.error(msg)
      setBook(null)
      setAvailability(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const category = book?.category
  const house = book?.publishingHouse
  const city = book?.city
  const authorRows = book?.bookAuthors?.filter((ba) => ba.author?.id) ?? []

  const canEditInAdmin =
    isHydrated && book && isLibraryCatalogAdminRole(user?.roles ?? [])

  return (
    <AppShell>
      <article className="flex w-full flex-col gap-8">
        <nav aria-label="Навигация" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2" asChild>
            <Link href="/">
              <ArrowLeft className="mr-1 size-4" />
              Каталог
            </Link>
          </Button>
          <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden />
          {category ? (
            <>
              <Link href={`/categories/${category.id}`} className={cn(linkMeta, "text-sm")}>
                {category.name}
              </Link>
              <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden />
            </>
          ) : null}
          <span className="max-w-[min(100%,14rem)] truncate font-medium text-foreground" title={book?.title}>
            {book?.title ?? "Книга"}
          </span>
        </nav>

        <div className="flex flex-wrap gap-2">
          {canEditInAdmin ? (
            <Button type="button" size="sm" asChild>
              <Link href={`/admin/books/${id}`}>
                <Pencil className="mr-2 size-4" />
                Редактировать
              </Link>
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/my-books">Мои книги</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/favorites">Избранное</Link>
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : !book ? (
          <p className="text-sm text-muted-foreground">Книга не найдена.</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <div className="space-y-4 lg:sticky lg:top-6">
                <Card className="overflow-hidden py-0">
                  {coverUrl ? (
                    <div
                      className={cn(
                        "relative w-full overflow-hidden bg-muted",
                        BOOK_COVER_ASPECT_CLASS,
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full min-h-0 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 bg-muted/40 px-6 py-12 text-center">
                      <BookOpen className="size-12 text-muted-foreground/50" aria-hidden />
                      <CardDescription className="text-balance">Обложки нет или файл недоступен</CardDescription>
                    </div>
                  )}
                </Card>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-8 lg:col-span-7">
              <header className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{book.title}</h1>
                  <BookFavoriteToggle bookId={book.id} className="shrink-0" />
                </div>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {book.publicationYear} г. · {book.pages} стр. · ISBN{" "}
                  <span className="font-mono text-foreground/90">{book.isbn}</span>
                </p>
              </header>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Сведения о книге</CardTitle>
                  <CardDescription>Категория, издательство, город и авторы — ссылки на справочники</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-3">
                      <Tags className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Категория</p>
                        <p className="mt-1">
                          {category ? (
                            <>
                              <Link href={`/categories/${category.id}`} className={linkMeta}>
                                {category.name}
                              </Link>
                              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                                <Link href={catalogHomeWithFilters({ categoryId: category.id })} className={linkMeta}>
                                  Книги этой категории в каталоге
                                </Link>
                              </span>
                            </>
                          ) : (
                            "—"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-3">
                      <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Издательство
                        </p>
                        <p className="mt-1">
                          {house ? (
                            <>
                              <Link href={`/publishing-houses/${house.id}`} className={linkMeta}>
                                {house.name}
                              </Link>
                              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                                <Link
                                  href={catalogHomeWithFilters({ publishingHouseId: house.id })}
                                  className={linkMeta}
                                >
                                  Книги этого издательства в каталоге
                                </Link>
                              </span>
                            </>
                          ) : (
                            "—"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Город издания
                      </p>
                      <p className="mt-1">
                        {city ? (
                          <Link href={catalogHomeWithFilters({ cityId: city.id })} className={linkMeta}>
                            {city.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                        {city ? (
                          <span className="mt-1 block text-xs font-normal text-muted-foreground">
                            Открыть каталог с отбором по этому городу
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-3">
                    <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Авторы</p>
                      {authorRows.length ? (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {authorRows.map((ba) => {
                            const a = ba.author!
                            return (
                              <li key={a.id}>
                                <Link
                                  href={`/authors/${a.id}`}
                                  className={cn(
                                    "inline-flex rounded-full border border-transparent bg-background px-3 py-1 text-sm font-medium",
                                    "text-primary ring-offset-background hover:border-primary/25 hover:bg-muted/60",
                                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                                  )}
                                >
                                  {authorShortName(a)}
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      ) : (
                        <p className="mt-1 text-muted-foreground">—</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {book.description?.trim() ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Описание</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {book.description.trim()}
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="size-4" aria-hidden />
                    Филиалы и наличие
                  </CardTitle>
                  <CardDescription>Экземпляры в фонде по залам хранения</CardDescription>
                </CardHeader>
                <CardContent>
                  {!availability?.length ? (
                    <p className="text-sm text-muted-foreground">Нет экземпляров в фонде.</p>
                  ) : (
                    <ul className="space-y-3">
                      {availability.map((row) => (
                        <li
                          key={row.storageId}
                          className="rounded-lg border bg-muted/25 px-3 py-3 text-sm"
                        >
                          <span className="font-medium">{row.storageName}</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="secondary" className="tabular-nums">
                              всего {row.totalCopies}
                            </Badge>
                            <Badge variant={row.availableCopies > 0 ? "default" : "outline"} className="tabular-nums">
                              свободно {row.availableCopies}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </article>
    </AppShell>
  )
}
