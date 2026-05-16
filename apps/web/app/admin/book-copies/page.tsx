"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import {
  libraryClient,
  type LibraryAuthor,
  type LibraryBook,
  type LibraryBookCopy,
  type LibraryBookCopiesImportResult,
  type LibraryBookCopyActiveRentUser,
  type LibraryStorage,
} from "@/client/library-client"
import { AdminBookCoverThumb } from "@/components/admin-book-cover-thumb"
import { AdminBookPickerDialog } from "@/components/admin-book-picker-dialog"
import { AdminFormSelect } from "@/components/admin-form-select"
import { AdminSectionGuard } from "@/components/admin-section-guard"
import { useAuth } from "@/components/auth-provider"
import {
  downloadBookCopiesCsv,
  downloadBookCopiesXlsx,
  parseBookCopiesImportFile,
} from "@/lib/book-copies-import-export"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  LayoutGrid,
  Plus,
  Table2,
  Trash2,
  Upload,
  X,
} from "lucide-react"

const SEARCH_DEBOUNCE_MS = 350
const COPIES_VIEW_STORAGE_KEY = "library-admin-book-copies-view"

type CopiesViewMode = "cards" | "table"

function readerRentLabel(user: LibraryBookCopyActiveRentUser) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return name ? `${user.email} (${name})` : user.email
}

function formatAuthorsLine(
  authors: Pick<LibraryAuthor, "firstName" | "lastName" | "middleName">[],
): string {
  return authors
    .map((a) => [a.lastName, a.firstName, a.middleName].filter(Boolean).join(" ").trim())
    .filter(Boolean)
    .join(", ")
}

function BookCopyBookDetails({ book }: { book: NonNullable<LibraryBookCopy["book"]> }) {
  const authors =
    "authors" in book && book.authors?.length ? formatAuthorsLine(book.authors) : null
  const year = "publicationYear" in book ? book.publicationYear : undefined
  const pages = "pages" in book ? book.pages : undefined
  const isbn = "isbn" in book ? book.isbn : undefined
  const cat = "category" in book ? book.category?.name : undefined
  const pub = "publishingHouse" in book ? book.publishingHouse?.name : undefined
  const city = "city" in book ? book.city?.name : undefined

  const headLine = [
    year != null ? `${year} г.` : null,
    pages != null ? `${pages} стр.` : null,
    isbn ? isbn : null,
  ]
    .filter(Boolean)
    .join(" · ")

  const locLine = [cat, pub, city].filter(Boolean).join(" · ")

  if (!authors && !headLine && !locLine) {
    return null
  }

  return (
    <div className="mt-1 space-y-1 text-xs leading-relaxed text-muted-foreground">
      {authors ? <p className="line-clamp-3">{authors}</p> : null}
      {headLine ? (
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground/95">{headLine}</p>
      ) : null}
      {locLine ? <p className="line-clamp-2">{locLine}</p> : null}
    </div>
  )
}

function CopyStatusBadge({ copy }: { copy: LibraryBookCopy }) {
  const rented = Boolean(copy.activeRent)
  return (
    <Badge variant={rented ? "default" : "secondary"}>{rented ? "Выдана" : "В фонде"}</Badge>
  )
}

export default function AdminBookCopiesPage() {
  const { token } = useAuth()
  const [storages, setStorages] = React.useState<LibraryStorage[]>([])
  const [copies, setCopies] = React.useState<LibraryBookCopy[]>([])
  const [selectedBook, setSelectedBook] = React.useState<LibraryBook | null>(null)
  const [bookPickContext, setBookPickContext] = React.useState<null | "create" | "filter">(null)
  const [selectedCoverUrl, setSelectedCoverUrl] = React.useState<string | undefined>()
  const [storageId, setStorageId] = React.useState("")
  const [inventoryNumber, setInventoryNumber] = React.useState("")
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [tableSearchInput, setTableSearchInput] = React.useState("")
  const [debouncedTableSearch, setDebouncedTableSearch] = React.useState("")
  const tableSearchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const tableSearchFieldId = React.useId()
  const bookPickFieldId = React.useId()
  const inventoryFieldId = React.useId()
  const filterBookFieldId = React.useId()
  const [filterBook, setFilterBook] = React.useState<LibraryBook | null>(null)
  const [filterCoverUrl, setFilterCoverUrl] = React.useState<string | undefined>()
  const [viewMode, setViewMode] = React.useState<CopiesViewMode>("cards")
  const importFileInputRef = React.useRef<HTMLInputElement>(null)
  const [importBusy, setImportBusy] = React.useState(false)
  const [importReportOpen, setImportReportOpen] = React.useState(false)
  const [importReport, setImportReport] = React.useState<LibraryBookCopiesImportResult | null>(null)
  const [editCopy, setEditCopy] = React.useState<LibraryBookCopy | null>(null)
  const [editStorageId, setEditStorageId] = React.useState("")
  const [editInventory, setEditInventory] = React.useState("")
  const [editCoverUrl, setEditCoverUrl] = React.useState<string | undefined>()
  const [editSaving, setEditSaving] = React.useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [deleteBusy, setDeleteBusy] = React.useState(false)
  const editInventoryFieldId = React.useId()

  React.useEffect(() => {
    try {
      const v = window.localStorage.getItem(COPIES_VIEW_STORAGE_KEY)
      if (v === "table") setViewMode("table")
    } catch {
      /* ignore */
    }
  }, [])

  function persistCopiesView(mode: CopiesViewMode) {
    setViewMode(mode)
    try {
      window.localStorage.setItem(COPIES_VIEW_STORAGE_KEY, mode)
    } catch {
      /* ignore */
    }
  }

  function resetCreateForm() {
    setSelectedBook(null)
    setStorageId("")
    setInventoryNumber("")
  }

  React.useEffect(() => {
    let cancelled = false
    if (!selectedBook?.hasCover || !token) {
      setSelectedCoverUrl(undefined)
      return
    }
    ;(async () => {
      try {
        const { url } = await libraryClient.getCoverUrl(selectedBook.id, token)
        if (!cancelled) setSelectedCoverUrl(url)
      } catch {
        if (!cancelled) setSelectedCoverUrl(undefined)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedBook?.id, selectedBook?.hasCover, token])

  React.useEffect(() => {
    let cancelled = false
    if (!filterBook?.hasCover || !token) {
      setFilterCoverUrl(undefined)
      return
    }
    ;(async () => {
      try {
        const { url } = await libraryClient.getCoverUrl(filterBook.id, token)
        if (!cancelled) setFilterCoverUrl(url)
      } catch {
        if (!cancelled) setFilterCoverUrl(undefined)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [filterBook?.id, filterBook?.hasCover, token])

  React.useEffect(() => {
    if (!editCopy) {
      setEditStorageId("")
      setEditInventory("")
      return
    }
    setEditStorageId(editCopy.storageId)
    setEditInventory(editCopy.inventoryNumber)
  }, [editCopy?.id])

  React.useEffect(() => {
    let cancelled = false
    const book = editCopy?.book
    if (!book || !("hasCover" in book) || !book.hasCover || !token) {
      setEditCoverUrl(undefined)
      return
    }
    ;(async () => {
      try {
        const { url } = await libraryClient.getCoverUrl(book.id, token)
        if (!cancelled) setEditCoverUrl(url)
      } catch {
        if (!cancelled) setEditCoverUrl(undefined)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [editCopy?.book?.id, editCopy?.book, token])

  const refresh = React.useCallback(async () => {
    try {
      const [s, c] = await Promise.all([
        libraryClient.listStorages(token),
        libraryClient.listBookCopies(token),
      ])
      setStorages(s)
      setCopies(c)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить данные.")
    }
  }, [token])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        await refresh()
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  React.useEffect(() => {
    if (tableSearchDebounceRef.current) clearTimeout(tableSearchDebounceRef.current)
    tableSearchDebounceRef.current = setTimeout(() => {
      tableSearchDebounceRef.current = null
      setDebouncedTableSearch(tableSearchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (tableSearchDebounceRef.current) clearTimeout(tableSearchDebounceRef.current)
    }
  }, [tableSearchInput])

  function commitTableSearchImmediate() {
    if (tableSearchDebounceRef.current) {
      clearTimeout(tableSearchDebounceRef.current)
      tableSearchDebounceRef.current = null
    }
    setDebouncedTableSearch(tableSearchInput.trim())
  }

  const filteredCopies = React.useMemo(() => {
    let list = copies
    if (filterBook) {
      list = list.filter((row) => row.bookId === filterBook.id)
    }
    const q = debouncedTableSearch.trim().toLowerCase()
    if (!q) return list
    return list.filter((row) => {
      const u = row.activeRent?.user
      const nameParts = u ? [u.firstName, u.lastName].filter(Boolean).join(" ") : ""
      const authorParts =
        row.book && "authors" in row.book && row.book.authors?.length
          ? row.book.authors.flatMap((a) => [a.lastName, a.firstName, a.middleName ?? ""].filter(Boolean))
          : []
      const haystack = [
        row.inventoryNumber,
        row.book?.title ?? "",
        row.storage?.name ?? "",
        u?.email ?? "",
        nameParts,
        row.book && "isbn" in row.book ? row.book.isbn : "",
        row.book && "publicationYear" in row.book ? String(row.book.publicationYear) : "",
        row.book && "category" in row.book ? row.book.category?.name ?? "" : "",
        row.book && "publishingHouse" in row.book ? row.book.publishingHouse?.name ?? "" : "",
        row.book && "city" in row.book ? row.book.city?.name ?? "" : "",
        ...authorParts,
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [copies, debouncedTableSearch, filterBook])

  function openCreateDialog() {
    resetCreateForm()
    setCreateDialogOpen(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const bookId = selectedBook?.id
    if (!bookId || !storageId || !inventoryNumber.trim()) {
      toast.error("Выберите книгу и зал, укажите инвентарный номер.")
      return
    }
    setSubmitting(true)
    try {
      await libraryClient.createBookCopy(
        {
          bookId,
          storageId,
          inventoryNumber: inventoryNumber.trim(),
        },
        token,
      )
      toast.success("Экземпляр создан")
      resetCreateForm()
      setCreateDialogOpen(false)
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать экземпляр.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editCopy || !editStorageId || !editInventory.trim()) {
      toast.error("Укажите зал и инвентарный номер.")
      return
    }
    setEditSaving(true)
    try {
      await libraryClient.updateBookCopy(
        editCopy.id,
        { storageId: editStorageId, inventoryNumber: editInventory.trim() },
        token,
      )
      toast.success("Экземпляр обновлён")
      setEditCopy(null)
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить изменения.")
    } finally {
      setEditSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!editCopy) return
    setDeleteBusy(true)
    try {
      await libraryClient.deleteBookCopy(editCopy.id, token)
      toast.success("Экземпляр удалён")
      setDeleteConfirmOpen(false)
      setEditCopy(null)
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось удалить экземпляр.")
    } finally {
      setDeleteBusy(false)
    }
  }

  async function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    e.target.value = ""
    if (!file) return
    if (!token) {
      toast.error("Войдите в аккаунт.")
      return
    }
    setImportBusy(true)
    try {
      const { rows, incompleteSkipped } = await parseBookCopiesImportFile(file)
      if (incompleteSkipped > 0) {
        toast.info(`Пропущено записей с неполными полями: ${incompleteSkipped}.`)
      }
      if (rows.length === 0) {
        toast.error(
          "В файле нет ни одной полной записи: нужны inventoryNumber, storageName и isbn (или bookTitle + year).",
        )
        return
      }
      const res = await libraryClient.importBookCopies(rows, token)
      const skipped = res.skipped ?? []
      if (res.created > 0) {
        toast.success(`Импортировано экземпляров: ${res.created}`)
        await refresh()
      }
      if (skipped.length > 0) {
        toast.info(`Уже есть такой инвентарный номер — пропущено записей: ${skipped.length}`)
      }
      if (res.errors.length > 0) {
        toast.error(`Часть записей не импортирована из‑за ошибок (${res.errors.length}) — см. отчёт.`)
      }
      if (skipped.length > 0 || res.errors.length > 0) {
        setImportReport({ ...res, skipped })
        setImportReportOpen(true)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось импортировать файл.")
    } finally {
      setImportBusy(false)
    }
  }

  function bookCopiesExportBasename() {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    return `ekzempliary-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
  }

  const canCreate = storages.length > 0

  function openEditCopy(row: LibraryBookCopy) {
    setEditCopy(row)
  }

  return (
    <AdminSectionGuard
      title="Экземпляры книг"
      description="Фильтр по книге — выбор через тот же каталог, что при добавлении экземпляра. Экспорт в CSV/Excel — без UUID и без сведений о выдаче; импорт — по ISBN или названию+году и названию зала."
    >
      <AdminBookPickerDialog
        open={bookPickContext !== null}
        onOpenChange={(open) => {
          if (!open) setBookPickContext(null)
        }}
        token={token}
        onPick={(book) => {
          if (bookPickContext === "create") setSelectedBook(book)
          if (bookPickContext === "filter") setFilterBook(book)
        }}
      />

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) resetCreateForm()
        }}
      >
        <DialogContent className="flex h-[min(90vh,560px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 pb-4 pt-6 pr-14 text-left">
            <DialogTitle>Новый экземпляр</DialogTitle>
            <DialogDescription>
              Выберите книгу из каталога, укажите зал хранения и уникальный инвентарный номер экземпляра.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => void handleCreate(e)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor={bookPickFieldId}>Книга</Label>
              <div className="relative w-full">
                <button
                  id={bookPickFieldId}
                  type="button"
                  onClick={() => setBookPickContext("create")}
                  className={cn(
                    "flex w-full gap-4 rounded-lg border px-4 py-4 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selectedBook ? "pr-12" : "pr-4",
                    selectedBook
                      ? "border-border bg-muted/40 hover:bg-muted/55"
                      : "border-dashed border-muted-foreground/40 bg-muted/15 hover:border-muted-foreground/60 hover:bg-muted/30",
                  )}
                >
                  {selectedBook ? (
                    <>
                      <AdminBookCoverThumb
                        book={selectedBook}
                        url={selectedCoverUrl}
                        layout="thumb"
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-semibold leading-snug text-foreground">{selectedBook.title}</p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">{selectedBook.isbn}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {selectedBook.publicationYear} г. · {selectedBook.pages} стр.
                          {typeof selectedBook.copyCount === "number"
                            ? ` · ${selectedBook.copyCount} экз. в фонде`
                            : null}
                        </p>
                        <p className="mt-3 text-xs font-medium text-primary">Нажмите, чтобы выбрать другую книгу</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                        <BookOpen className="size-5 text-muted-foreground" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">Выберите книгу</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Каталог с поиском и фильтрами откроется поверх этого окна.
                        </p>
                      </div>
                    </>
                  )}
                  <ChevronRight className="size-5 shrink-0 self-center text-muted-foreground" aria-hidden />
                </button>
                {selectedBook ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                    aria-label="Сбросить выбор книги"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedBook(null)
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>

            <AdminFormSelect
              label="Зал хранения"
              value={storageId}
              onValueChange={setStorageId}
              placeholder="Выберите зал"
              disabled={!canCreate}
              options={storages.map((s) => ({ value: s.id, label: s.name }))}
            />

            <div className="grid gap-2">
              <Label htmlFor={inventoryFieldId}>Инвентарный номер</Label>
              <Input
                id={inventoryFieldId}
                value={inventoryNumber}
                onChange={(e) => setInventoryNumber(e.target.value)}
                placeholder="Уникальный номер экземпляра"
                disabled={!canCreate}
                autoComplete="off"
              />
            </div>
              </div>
            </div>

            <DialogFooter className="mx-0 mb-0 shrink-0 gap-3 rounded-none border-t bg-muted/50 p-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setCreateDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={submitting || !canCreate}>
                {submitting ? "Сохранение…" : "Добавить экземпляр"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editCopy !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditCopy(null)
            setDeleteConfirmOpen(false)
          }
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,560px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 pb-4 pt-6 pr-14 text-left">
            <DialogTitle>Экземпляр</DialogTitle>
            <DialogDescription>
              Инвентарный номер и зал можно изменить. Книга у экземпляра не меняется.
            </DialogDescription>
          </DialogHeader>
          {editCopy ? (
            <form
              onSubmit={(e) => void handleEditSave(e)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <div className="grid gap-4">
                  <div className="grid gap-1.5">
                    <Label>Книга</Label>
                    <div
                      className={cn(
                        "flex gap-4 rounded-lg border border-border bg-muted/40 px-4 py-4",
                      )}
                    >
                      {editCopy.book &&
                      "isbn" in editCopy.book &&
                      editCopy.book.id ? (
                        <>
                          <AdminBookCoverThumb
                            book={editCopy.book as LibraryBook}
                            url={editCoverUrl}
                            layout="thumb"
                            className="shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/admin/books/${editCopy.book.id}`}
                              className="line-clamp-2 font-semibold leading-snug text-foreground hover:underline"
                            >
                              {editCopy.book.title}
                            </Link>
                            <BookCopyBookDetails book={editCopy.book} />
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>
                  </div>
                  <AdminFormSelect
                    label="Зал хранения"
                    value={editStorageId}
                    onValueChange={setEditStorageId}
                    placeholder="Выберите зал"
                    disabled={storages.length === 0}
                    options={storages.map((s) => ({ value: s.id, label: s.name }))}
                  />
                  <div className="grid gap-2">
                    <Label htmlFor={editInventoryFieldId}>Инвентарный номер</Label>
                    <Input
                      id={editInventoryFieldId}
                      value={editInventory}
                      onChange={(e) => setEditInventory(e.target.value)}
                      placeholder="Уникальный номер экземпляра"
                      disabled={storages.length === 0}
                      autoComplete="off"
                    />
                  </div>
                  {editCopy.activeRent ? (
                    <p className="text-xs text-amber-700 dark:text-amber-500">
                      Экземпляр выдан читателю — удаление недоступно, пока не будет возврат. Перенос между залами
                      допустим.
                    </p>
                  ) : null}
                </div>
              </div>
              <DialogFooter className="mx-0 mb-0 shrink-0 gap-3 rounded-none border-t bg-muted/50 p-5 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 sm:me-auto"
                  disabled={deleteBusy || Boolean(editCopy.activeRent) || editSaving}
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Удалить
                </Button>
                <div className="flex w-full flex-wrap justify-end gap-3 sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={editSaving || deleteBusy}
                    onClick={() => setEditCopy(null)}
                  >
                    Отмена
                  </Button>
                  <Button type="submit" disabled={editSaving || deleteBusy || storages.length === 0}>
                    {editSaving ? "Сохранение…" : "Сохранить"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить экземпляр?</AlertDialogTitle>
            <AlertDialogDescription>
              {editCopy
                ? `Будет удалена запись с инвентарным номером «${editCopy.inventoryNumber}». Действие необратимо.`
                : "Удалить запись?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Отмена</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteBusy}
              onClick={() => void handleConfirmDelete()}
            >
              {deleteBusy ? "Удаление…" : "Удалить"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid min-w-[200px] flex-1 gap-1.5 sm:max-w-md">
            <Label htmlFor={tableSearchFieldId}>Поиск</Label>
            <Input
              id={tableSearchFieldId}
              value={tableSearchInput}
              onChange={(e) => setTableSearchInput(e.target.value)}
              placeholder="Инв. номер, название, ISBN, авторы, издательство, зал, читатель…"
              aria-busy={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commitTableSearchImmediate()
                }
              }}
            />
          </div>
          <div className="grid min-w-[200px] flex-1 gap-1.5 sm:max-w-md">
            <Label htmlFor={filterBookFieldId}>Книга</Label>
            <div className="relative w-full">
              <button
                id={filterBookFieldId}
                type="button"
                onClick={() => setBookPickContext("filter")}
                className={cn(
                  "flex h-8 w-full items-center gap-2 rounded-lg border px-2.5 text-left text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50",
                  filterBook ? "pr-8" : "pr-2",
                  filterBook
                    ? "border-border bg-muted/40 hover:bg-muted/55"
                    : "border-dashed border-muted-foreground/40 bg-muted/15 hover:border-muted-foreground/60 hover:bg-muted/30",
                )}
              >
                {filterBook ? (
                  <>
                    <AdminBookCoverThumb
                      book={filterBook}
                      url={filterCoverUrl}
                      layout="thumb"
                      className="h-8 w-6 shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate" title={`${filterBook.title} · ${filterBook.isbn}`}>
                      <span className="font-medium text-foreground">{filterBook.title}</span>
                      <span className="text-muted-foreground"> · </span>
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">{filterBook.isbn}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex size-6 shrink-0 items-center justify-center rounded border border-border bg-background">
                      <BookOpen className="size-3.5 text-muted-foreground" aria-hidden />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">Все книги — нажмите, чтобы выбрать</span>
                  </>
                )}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
              {filterBook ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 size-8 text-muted-foreground hover:text-foreground"
                  aria-label="Сбросить фильтр по книге"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setFilterBook(null)
                  }}
                >
                  <X className="size-3.5" />
                </Button>
              ) : null}
            </div>
          </div>
          <div
            className="flex rounded-lg border border-border bg-muted/40 p-0.5"
            role="group"
            aria-label="Вид списка экземпляров"
          >
            <Button
              type="button"
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => persistCopiesView("cards")}
            >
              <LayoutGrid className="size-4" />
              Карточки
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => persistCopiesView("table")}
            >
              <Table2 className="size-4" />
              Таблица
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                disabled={loading || filteredCopies.length === 0}
              >
                <Download className="size-4" />
                Экспорт
                <ChevronDown className="size-4 opacity-70" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => downloadBookCopiesCsv(filteredCopies, `${bookCopiesExportBasename()}.csv`)}
              >
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => downloadBookCopiesXlsx(filteredCopies, `${bookCopiesExportBasename()}.xlsx`)}
              >
                Excel (.xlsx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            disabled={!token || importBusy}
            onClick={() => importFileInputRef.current?.click()}
          >
            <Upload className="size-4" />
            {importBusy ? "Импорт…" : "Импорт"}
          </Button>
          <input
            ref={importFileInputRef}
            type="file"
            className="sr-only"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => void handleImportFileChange(e)}
          />
          <Button type="button" className="shrink-0" disabled={!canCreate} onClick={openCreateDialog}>
            <Plus className="size-4" />
            Добавить
          </Button>
        </div>

        {!canCreate ? (
          <p className="text-sm text-muted-foreground">
            Чтобы добавить экземпляр, сначала создайте хотя бы один зал хранения в разделе «Залы хранения».
          </p>
        ) : null}

        {viewMode === "cards" ? (
          <div className="flex min-h-0 min-w-0 flex-1 overflow-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">Загрузка…</p>
            ) : copies.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет записей.</p>
            ) : filteredCopies.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ничего не найдено.</p>
            ) : (
              <div className="grid w-full min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCopies.map((row) => (
                  <div
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openEditCopy(row)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        openEditCopy(row)
                      }
                    }}
                    className={cn(
                      "flex cursor-pointer flex-col rounded-xl border border-border bg-card p-4 text-sm shadow-sm transition-colors",
                      "hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                        {row.inventoryNumber}
                      </span>
                      <CopyStatusBadge copy={row} />
                    </div>
                    {row.book?.id ? (
                      <>
                        <Link
                          href={`/admin/books/${row.book.id}`}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="mt-2 line-clamp-2 font-semibold leading-snug text-foreground hover:underline"
                        >
                          {row.book.title}
                        </Link>
                        <BookCopyBookDetails book={row.book} />
                      </>
                    ) : (
                      <p className="mt-2 line-clamp-2 font-semibold leading-snug">—</p>
                    )}
                    <p className="mt-1 text-muted-foreground">{row.storage?.name ?? "—"}</p>
                    {row.activeRent ? (
                      <div className="mt-3 space-y-1 text-xs leading-relaxed text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">Читатель: </span>
                          {readerRentLabel(row.activeRent.user)}
                        </p>
                        {row.activeRent.dueDate ? (
                          <p>
                            <span className="font-medium text-foreground">Вернуть до: </span>
                            {row.activeRent.dueDate}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground">В зале хранения</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[1%] whitespace-nowrap tabular-nums">Инв. №</TableHead>
                  <TableHead>Книга</TableHead>
                  <TableHead>Зал</TableHead>
                  <TableHead className="w-[1%] whitespace-nowrap">Статус</TableHead>
                  <TableHead className="min-w-[12rem]">Читатель</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Загрузка…
                    </TableCell>
                  </TableRow>
                ) : copies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Нет записей.
                    </TableCell>
                  </TableRow>
                ) : filteredCopies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Ничего не найдено.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCopies.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => openEditCopy(row)}
                    >
                      <TableCell className="font-medium tabular-nums whitespace-nowrap">{row.inventoryNumber}</TableCell>
                      <TableCell className="max-w-[min(28rem,50vw)] align-top">
                        {row.book?.id ? (
                          <div className="space-y-1">
                            <Link
                              href={`/admin/books/${row.book.id}`}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="font-medium hover:underline"
                            >
                              {row.book.title}
                            </Link>
                            <BookCopyBookDetails book={row.book} />
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.storage?.name ?? "—"}</TableCell>
                      <TableCell>
                        <CopyStatusBadge copy={row} />
                      </TableCell>
                      <TableCell className="max-w-[min(24rem,40vw)] whitespace-normal text-muted-foreground">
                        {row.activeRent ? (
                          <div className="space-y-1">
                            <div>{readerRentLabel(row.activeRent.user)}</div>
                            {row.activeRent.dueDate ? (
                              <div className="text-xs text-muted-foreground">до {row.activeRent.dueDate}</div>
                            ) : null}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={importReportOpen} onOpenChange={setImportReportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Отчёт об импорте</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-1 text-left text-sm text-muted-foreground">
                <p>
                  Успешно создано: <span className="font-medium text-foreground">{importReport?.created ?? 0}</span>
                </p>
                {importReport && (importReport.skipped?.length ?? 0) > 0 ? (
                  <p>
                    Не импортировано (номер уже в каталоге или повтор в файле):{" "}
                    <span className="font-medium text-amber-700 dark:text-amber-500">
                      {importReport.skipped?.length ?? 0}
                    </span>
                  </p>
                ) : null}
                {importReport && importReport.errors.length > 0 ? (
                  <p>
                    Ошибок:{" "}
                    <span className="font-medium text-destructive">{importReport.errors.length}</span>
                  </p>
                ) : null}
              </div>
            </DialogDescription>
          </DialogHeader>
          {importReport && (importReport.skipped?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Что не попало в каталог</p>
              <ul className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-amber-600/25 bg-amber-600/5 p-3 text-xs leading-snug">
                {importReport.skipped!.map((s, i) => (
                  <li key={`skip-${s.row}-${i}`}>{s.message}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {importReport && importReport.errors.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Не удалось добавить</p>
              <ul className="max-h-60 space-y-1.5 overflow-y-auto rounded-md border bg-muted/30 p-3 text-xs leading-snug">
                {importReport.errors.map((err, i) => (
                  <li key={`${err.row}-${i}`}>{err.message}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" onClick={() => setImportReportOpen(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminSectionGuard>
  )
}
