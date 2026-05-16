"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, PenTool, User } from "lucide-react"
import { libraryPublicClient } from "@/client/library-public-client"
import type { LibraryAuthor } from "@/client/library-client"
import { AppShell } from "@/components/app-shell"
import { CatalogBooksBrowser } from "@/components/catalog-books-browser"
import { Button } from "@workspace/ui/components/button"

function authorFullName(a: LibraryAuthor) {
  return [a.lastName, a.firstName, a.middleName].filter(Boolean).join(" ")
}

export default function AuthorDetailPage() {
  const params = useParams()
  const raw = params.id
  const id = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : ""

  const [author, setAuthor] = useState<LibraryAuthor | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const filter = useMemo(() => (id?.trim() ? { authorId: id.trim() } : {}), [id])

  useEffect(() => {
    if (!id?.trim()) {
      setLoading(false)
      return
    }
    void libraryPublicClient
      .getAuthor(id.trim())
      .then(setAuthor)
      .catch(() => {
        toast.error("Автор не найден.")
        setAuthor(null)
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!author?.hasPhoto || !id?.trim()) {
      setPhotoUrl(null)
      return
    }
    let cancelled = false
    void libraryPublicClient
      .getAuthorPhotoUrl(id.trim())
      .then((r) => {
        if (!cancelled) setPhotoUrl(r.url)
      })
      .catch(() => {
        if (!cancelled) setPhotoUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [author?.hasPhoto, id])

  if (!id) {
    return null
  }

  return (
    <AppShell>
      <div className="flex w-full flex-col gap-8">
        <Button type="button" variant="outline" size="sm" className="w-fit" asChild>
          <Link href="/authors">
            <ArrowLeft className="mr-2 size-4" />
            Все авторы
          </Link>
        </Button>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : !author ? (
          <p className="text-sm text-muted-foreground">Карточка недоступна.</p>
        ) : (
          <>
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted shadow-inner sm:size-36">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full min-h-0 object-cover" />
                ) : (
                  <User className="size-14 text-muted-foreground/45 sm:size-16" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <PenTool className="size-5 shrink-0 text-primary" />
                  <h2 className="text-2xl font-semibold tracking-tight">{authorFullName(author)}</h2>
                </div>
                <p className="text-sm text-muted-foreground tabular-nums">
                  Книг в каталоге: {author.bookCount ?? 0}
                </p>
              </div>
            </div>
            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Книги автора</h3>
              <CatalogBooksBrowser
                filter={filter}
                emptyHint="У этого автора пока нет книг в каталоге."
              />
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}
