"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PenTool, User } from "lucide-react"
import { libraryPublicClient } from "@/client/library-public-client"
import type { LibraryAuthor } from "@/client/library-client"
import { AppShell } from "@/components/app-shell"

function authorFullName(a: LibraryAuthor) {
  return [a.lastName, a.firstName, a.middleName].filter(Boolean).join(" ")
}

function AuthorGridCard({ author }: { author: LibraryAuthor }) {
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
        {author.bookCount ?? 0} кн.
      </span>
    </Link>
  )
}

export default function AuthorsPage() {
  const [items, setItems] = useState<LibraryAuthor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void libraryPublicClient
      .listAuthors()
      .then(setItems)
      .catch(() => {
        toast.error("Не удалось загрузить авторов.")
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      <div className="flex w-full flex-col gap-6">
        <div className="flex items-start gap-3">
          <PenTool className="mt-0.5 size-6 shrink-0 text-primary" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Авторы</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Участники каталога. У части авторов есть портрет — его добавляет администратор каталога.
            </p>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : !items.length ? (
          <p className="text-sm text-muted-foreground">Авторов пока нет.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {items.map((a) => (
              <AuthorGridCard key={a.id} author={a} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
