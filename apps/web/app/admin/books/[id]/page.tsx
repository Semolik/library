"use client"

import { useParams, useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"
import {
  libraryClient,
  type LibraryAuthor,
  type LibraryBook,
  type LibraryCategory,
  type LibraryCity,
  type LibraryPublishingHouse,
} from "@/client/library-client"
import { BOOK_COVER_ASPECT_CLASS } from "@/components/admin-book-cover-thumb"
import { AdminBookEditorForm } from "@/components/admin-book-editor-form"
import { AdminSectionGuard } from "@/components/admin-section-guard"
import { useAuth } from "@/components/auth-provider"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { ImageIcon, Trash2 } from "lucide-react"

function authorLabel(a: LibraryAuthor) {
  return [a.lastName, a.firstName, a.middleName].filter(Boolean).join(" ")
}

function bookAuthorsLine(book: LibraryBook) {
  const list = book.bookAuthors?.map((row) => authorLabel(row.author)) ?? []
  return list.length ? list.join("; ") : "—"
}

export default function AdminBookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const rawId = params.id
  const bookId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : ""

  const { token } = useAuth()
  const [book, setBook] = React.useState<LibraryBook | null>(null)
  const [categories, setCategories] = React.useState<LibraryCategory[]>([])
  const [publishingHouses, setPublishingHouses] = React.useState<LibraryPublishingHouse[]>([])
  const [cities, setCities] = React.useState<LibraryCity[]>([])
  const [authors, setAuthors] = React.useState<LibraryAuthor[]>([])
  const [coverUrl, setCoverUrl] = React.useState<string | undefined>()
  const [loading, setLoading] = React.useState(true)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const refsReady =
    categories.length > 0 && publishingHouses.length > 0 && cities.length > 0 && authors.length > 0

  const loadRefs = React.useCallback(async () => {
    if (!token) return
    const [cat, pub, cit, auth] = await Promise.all([
      libraryClient.listCategories(token),
      libraryClient.listPublishingHouses(token),
      libraryClient.listCities(token),
      libraryClient.listAuthors(token),
    ])
    setCategories(cat)
    setPublishingHouses(pub)
    setCities(cit)
    setAuthors(auth)
  }, [token])

  const loadBook = React.useCallback(async () => {
    if (!bookId || !token) return
    try {
      const b = await libraryClient.getBook(bookId, token)
      setBook(b)
      if (b.hasCover) {
        try {
          const { url } = await libraryClient.getCoverUrl(bookId, token)
          setCoverUrl(url)
        } catch {
          setCoverUrl(undefined)
        }
      } else {
        setCoverUrl(undefined)
      }
    } catch {
      toast.error("Книга не найдена или нет доступа.")
      router.replace("/admin/books")
    }
  }, [bookId, token, router])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!bookId || !token) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        await loadRefs()
        if (!cancelled) await loadBook()
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [bookId, token, loadRefs, loadBook])

  const bookDetailBreadcrumbs = React.useMemo(
    () => [
      { label: "Главная", href: "/" },
      { label: "Книги", href: "/admin/books" },
      { label: book?.title ?? "Загрузка…" },
    ],
    [book?.title],
  )

  async function confirmDelete() {
    if (!token || !book) return
    setDeleting(true)
    try {
      await libraryClient.deleteBook(book.id, token)
      toast.success("Книга удалена")
      router.push("/admin/books")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось удалить.")
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (!bookId) {
    return null
  }

  return (
    <AdminSectionGuard
      title={book?.title ?? "Книга"}
      breadcrumbTrail={bookDetailBreadcrumbs}
      requireCatalogAdmin
    >
      <div className="flex w-full flex-col gap-8">
        {loading || !book ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:items-start lg:gap-10">
            <aside className="flex flex-col lg:sticky lg:top-4">
              <div className="w-full max-w-[280px] overflow-hidden rounded-xl bg-muted lg:max-w-none">
                <div className={cn("relative w-full overflow-hidden", BOOK_COVER_ASPECT_CLASS)}>
                  {book.hasCover && coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={book.title}
                      className="absolute inset-0 h-full w-full min-h-0 object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="size-16 opacity-25" aria-hidden />
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <div className="min-w-0 flex flex-col gap-6">
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-mono text-xs">{book.isbn}</p>
                <p>
                  {book.publicationYear} · {book.pages} стр. · {book.copyCount ?? 0} экз.
                </p>
                <p className="leading-relaxed">{bookAuthorsLine(book)}</p>
              </div>

              <div className="space-y-4 border-t pt-6 lg:border-t-0 lg:pt-0">
                <AdminBookEditorForm
                  key={`${book.id}-${categories.length}-${publishingHouses.length}-${cities.length}-${authors.length}`}
                  token={token}
                  book={book}
                  categories={categories}
                  publishingHouses={publishingHouses}
                  cities={cities}
                  authors={authors}
                  refsReady={refsReady}
                  onSaved={loadBook}
                />
              </div>

              <div className="border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Удалить книгу
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить книгу?</AlertDialogTitle>
            <AlertDialogDescription>
              {book ? (
                <>
                  Запись «{book.title}» будет удалена безвозвратно.
                  {(book.copyCount ?? 0) > 0 ? (
                    <span className="mt-2 block font-medium text-destructive">
                      Нельзя удалить книгу с экземплярами ({book.copyCount}). Сначала удалите экземпляры.
                    </span>
                  ) : null}
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={deleting}>
                Отмена
              </Button>
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleting || (book?.copyCount ?? 0) > 0}
              onClick={() => void confirmDelete()}
            >
              Удалить
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminSectionGuard>
  )
}
