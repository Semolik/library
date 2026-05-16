"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, Building2, PenTool, User } from "lucide-react"
import {
  libraryPublicClient,
  type LibraryAuthorAtPublisher,
} from "@/client/library-public-client"
import type { LibraryPublishingHouse } from "@/client/library-client"
import { AppShell } from "@/components/app-shell"
import { CatalogBooksBrowser } from "@/components/catalog-books-browser"
import { catalogHomeWithFilters } from "@/lib/catalog-deep-link"
import { Button } from "@workspace/ui/components/button"

function authorFullName(a: Pick<LibraryAuthorAtPublisher, "lastName" | "firstName" | "middleName">) {
  return [a.lastName, a.firstName, a.middleName].filter(Boolean).join(" ")
}

function AuthorAtPublisherCard({ author }: { author: LibraryAuthorAtPublisher }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!author.hasPhoto) return
    let cancelled = false
    void libraryPublicClient
      .getAuthorPhotoUrl(author.id)
      .then((r) => {
        if (!cancelled) setPhotoUrl(r.url)
      })
      .catch(() => {
        if (!cancelled) setPhotoUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [author.id, author.hasPhoto])

  return (
    <Link
      href={`/authors/${author.id}`}
      className="flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center shadow-sm transition-colors hover:border-primary/40 hover:shadow"
    >
      <div className="relative flex size-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full min-h-0 object-cover" />
        ) : (
          <User className="size-8 text-muted-foreground/45" aria-hidden />
        )}
      </div>
      <span className="line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-tight">
        {authorFullName(author)}
      </span>
      <span className="text-[10px] text-muted-foreground tabular-nums">
        {author.booksAtPublisher} кн. у изд.
      </span>
    </Link>
  )
}

export default function PublishingHouseDetailPage() {
  const params = useParams()
  const raw = params.id
  const id = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : ""

  const [house, setHouse] = useState<LibraryPublishingHouse | null>(null)
  const [authors, setAuthors] = useState<LibraryAuthorAtPublisher[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [authorsLoading, setAuthorsLoading] = useState(true)

  const filter = useMemo(
    () => (id?.trim() ? { publishingHouseId: id.trim() } : {}),
    [id],
  )

  useEffect(() => {
    if (!id?.trim()) {
      setLoadingMeta(false)
      return
    }
    void libraryPublicClient
      .getPublishingHouse(id.trim())
      .then(setHouse)
      .catch(() => {
        toast.error("Издательство не найдено.")
        setHouse(null)
      })
      .finally(() => setLoadingMeta(false))
  }, [id])

  useEffect(() => {
    if (!id?.trim()) {
      setAuthors([])
      setAuthorsLoading(false)
      return
    }
    if (loadingMeta) return
    if (!house) {
      setAuthors([])
      setAuthorsLoading(false)
      return
    }

    let cancelled = false
    setAuthorsLoading(true)
    void libraryPublicClient
      .listAuthorsForPublishingHouse(id.trim())
      .then((rows) => {
        if (!cancelled) setAuthors(rows)
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Не удалось загрузить авторов.")
          setAuthors([])
        }
      })
      .finally(() => {
        if (!cancelled) setAuthorsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, house, loadingMeta])

  if (!id) {
    return null
  }

  return (
    <AppShell>
      <div className="flex w-full flex-col gap-8">
        <Button type="button" variant="outline" size="sm" className="w-fit" asChild>
          <Link href="/publishing-houses">
            <ArrowLeft className="mr-2 size-4" />
            Все издательства
          </Link>
        </Button>
        {loadingMeta ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : !house ? (
          <p className="text-sm text-muted-foreground">Раздел недоступен.</p>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 size-6 shrink-0 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{house.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                    Книг в каталоге: {house.bookCount ?? 0}
                  </p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="w-fit shrink-0" asChild>
                <Link href={catalogHomeWithFilters({ publishingHouseId: house.id })}>
                  Расширенный каталог
                </Link>
              </Button>
            </div>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Книги</h3>
              <CatalogBooksBrowser
                filter={filter}
                emptyHint="У этого издательства пока нет книг в каталоге."
              />
            </section>

            <section className="space-y-4 border-t pt-8">
              <div className="flex items-start gap-2">
                <PenTool className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <h3 className="text-lg font-semibold">Авторы</h3>
                  <p className="text-sm text-muted-foreground">
                    Авторы, у которых в каталоге есть книги этого издательства
                  </p>
                </div>
              </div>
              {authorsLoading ? (
                <p className="text-sm text-muted-foreground">Загрузка…</p>
              ) : !authors.length ? (
                <p className="text-sm text-muted-foreground">Авторов по этому издательству нет.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {authors.map((a) => (
                    <AuthorAtPublisherCard key={a.id} author={a} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}
