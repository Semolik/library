"use client"

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
import { AdminBookEditorForm } from "@/components/admin-book-editor-form"
import { AdminBooksExplorer } from "@/components/admin-books-explorer"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Plus } from "lucide-react"

export default function AdminBooksPage() {
  const { token } = useAuth()
  const [categories, setCategories] = React.useState<LibraryCategory[]>([])
  const [publishingHouses, setPublishingHouses] = React.useState<LibraryPublishingHouse[]>([])
  const [cities, setCities] = React.useState<LibraryCity[]>([])
  const [authors, setAuthors] = React.useState<LibraryAuthor[]>([])
  const [loadingRefs, setLoadingRefs] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [createFormKey, setCreateFormKey] = React.useState(0)
  const [submitting, setSubmitting] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<LibraryBook | null>(null)
  const [listRevision, setListRevision] = React.useState(0)

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
      setCategories(cat)
      setPublishingHouses(pub)
      setCities(cit)
      setAuthors(auth)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить справочники.")
    }
  }, [token])

  React.useEffect(() => {
    let cancelled = false
    if (!token?.trim()) {
      setLoadingRefs(false)
      return
    }
    ;(async () => {
      setLoadingRefs(true)
      try {
        await loadRefs()
      } finally {
        if (!cancelled) setLoadingRefs(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadRefs, token])

  const refsReady =
    !loadingRefs &&
    categories.length > 0 &&
    publishingHouses.length > 0 &&
    cities.length > 0 &&
    authors.length > 0

  const sharedRefs = React.useMemo(
    () => ({
      categories,
      publishingHouses,
      cities,
      authors,
    }),
    [categories, publishingHouses, cities, authors],
  )

  function openCreate() {
    setCreateFormKey((n) => n + 1)
    setDialogOpen(true)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      await libraryClient.deleteBook(deleteTarget.id, token)
      toast.success("Книга удалена")
      setDeleteTarget(null)
      setListRevision((r) => r + 1)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось удалить книгу.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminSectionGuard title="Книги" requireCatalogAdmin>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <AdminBooksExplorer
          token={token}
          purpose="manage"
          sharedRefs={sharedRefs}
          listRevision={listRevision}
          onRequestDelete={(book) => setDeleteTarget(book)}
          toolbarEnd={
            <Button type="button" onClick={openCreate} disabled={!refsReady}>
              <Plus className="size-4" />
              Добавить книгу
            </Button>
          }
          className="flex min-h-0 min-w-0 flex-1 flex-col gap-4"
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Новая книга</DialogTitle>
          </DialogHeader>
          <AdminBookEditorForm
            key={createFormKey}
            token={token}
            book={null}
            categories={categories}
            publishingHouses={publishingHouses}
            cities={cities}
            authors={authors}
            refsReady={refsReady}
            onCancel={() => setDialogOpen(false)}
            onSaved={async () => {
              setDialogOpen(false)
              setListRevision((r) => r + 1)
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить книгу?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  Запись «{deleteTarget.title}» будет удалена безвозвратно.
                  {(deleteTarget.copyCount ?? 0) > 0 ? (
                    <span className="mt-2 block font-medium text-destructive">
                      У книги есть экземпляры ({deleteTarget.copyCount}). Удалите их перед удалением
                      книги.
                    </span>
                  ) : null}
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={submitting}>
                Отмена
              </Button>
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={submitting || (deleteTarget?.copyCount ?? 0) > 0}
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
