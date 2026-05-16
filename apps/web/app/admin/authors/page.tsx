"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import { libraryClient, type LibraryAuthor } from "@/client/library-client"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
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
import { Pencil, Plus, Trash2, User } from "lucide-react"

const SEARCH_DEBOUNCE_MS = 350

function authorFullName(a: LibraryAuthor) {
  return [a.lastName, a.firstName, a.middleName].filter(Boolean).join(" ")
}

function AdminAuthorThumb({
  authorId,
  hasPhoto,
  token,
}: {
  authorId: string
  hasPhoto?: boolean
  token: string | null
}) {
  const [url, setUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!hasPhoto || !token?.trim()) {
      setUrl(null)
      return
    }
    let cancelled = false
    void libraryClient
      .getAuthorPhotoUrl(authorId, token)
      .then((r) => {
        if (!cancelled) setUrl(r.url)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [authorId, hasPhoto, token])

  return (
    <div className="relative flex size-9 shrink-0 overflow-hidden rounded-full border bg-muted">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="absolute inset-0 h-full w-full min-h-0 object-cover" />
      ) : (
        <User className="m-auto size-4 text-muted-foreground/45" aria-hidden />
      )}
    </div>
  )
}

export default function AdminAuthorsPage() {
  const { token } = useAuth()
  const [items, setItems] = React.useState<LibraryAuthor[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [lastName, setLastName] = React.useState("")
  const [firstName, setFirstName] = React.useState("")
  const [middleName, setMiddleName] = React.useState("")
  const [createPhotoFile, setCreatePhotoFile] = React.useState<File | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editRow, setEditRow] = React.useState<LibraryAuthor | null>(null)
  const [editLastName, setEditLastName] = React.useState("")
  const [editFirstName, setEditFirstName] = React.useState("")
  const [editMiddleName, setEditMiddleName] = React.useState("")
  const [editPhotoFile, setEditPhotoFile] = React.useState<File | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<LibraryAuthor | null>(null)
  const [searchInput, setSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const refresh = React.useCallback(async () => {
    if (!token?.trim()) return
    try {
      const list = await libraryClient.listAuthors(token)
      setItems(list)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить авторов.")
    }
  }, [token])

  React.useEffect(() => {
    let cancelled = false
    if (!token?.trim()) {
      setLoading(false)
      return
    }
    ;(async () => {
      setLoading(true)
      try {
        const list = await libraryClient.listAuthors(token)
        if (!cancelled) setItems(list)
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Не удалось загрузить авторов.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  React.useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null
      setDebouncedSearch(searchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [searchInput])

  const filteredItems = React.useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => {
      const haystack = [
        row.lastName,
        row.firstName,
        row.middleName ?? "",
        authorFullName(row),
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [items, debouncedSearch])

  function commitSearchImmediate() {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = null
    }
    setDebouncedSearch(searchInput.trim())
  }

  function openCreateModal() {
    setLastName("")
    setFirstName("")
    setMiddleName("")
    setCreatePhotoFile(null)
    setCreateOpen(true)
  }

  async function handleCreate() {
    const ln = lastName.trim()
    const fn = firstName.trim()
    if (!ln || !fn) {
      toast.error("Укажите фамилию и имя.")
      return
    }
    setSubmitting(true)
    try {
      const created = await libraryClient.createAuthor(
        {
          lastName: ln,
          firstName: fn,
          middleName: middleName.trim() || null,
        },
        token,
      )
      if (createPhotoFile) {
        await libraryClient.uploadAuthorPhoto(created.id, createPhotoFile, token)
      }
      setCreateOpen(false)
      setLastName("")
      setFirstName("")
      setMiddleName("")
      setCreatePhotoFile(null)
      toast.success(createPhotoFile ? "Автор добавлен. Портрет загружен." : "Автор добавлен")
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать автора.")
    } finally {
      setSubmitting(false)
    }
  }

  function openEdit(row: LibraryAuthor) {
    setEditRow(row)
    setEditLastName(row.lastName)
    setEditFirstName(row.firstName)
    setEditMiddleName(row.middleName ?? "")
    setEditPhotoFile(null)
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    if (!editRow) return
    const ln = editLastName.trim()
    const fn = editFirstName.trim()
    if (!ln || !fn) {
      toast.error("Укажите фамилию и имя.")
      return
    }
    setSubmitting(true)
    try {
      await libraryClient.updateAuthor(
        editRow.id,
        {
          lastName: ln,
          firstName: fn,
          middleName: editMiddleName.trim() || null,
        },
        token,
      )
      if (editPhotoFile) {
        await libraryClient.uploadAuthorPhoto(editRow.id, editPhotoFile, token)
        setEditPhotoFile(null)
        toast.success("Сохранено. Портрет обновлён.")
      } else {
        toast.success("Данные автора сохранены")
      }
      setEditOpen(false)
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      await libraryClient.deleteAuthor(deleteTarget.id, token)
      toast.success("Автор удалён")
      setDeleteTarget(null)
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось удалить.")
    } finally {
      setSubmitting(false)
    }
  }

  const authorSearchFieldId = React.useId()

  return (
    <AdminSectionGuard title="Авторы" requireCatalogAdmin>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid min-w-[200px] flex-1 gap-1.5 sm:max-w-md">
            <Label htmlFor={authorSearchFieldId}>Поиск</Label>
            <Input
              id={authorSearchFieldId}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Фамилия, имя или строка каталога…"
              aria-busy={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commitSearchImmediate()
                }
              }}
            />
          </div>
          <Button type="button" className="shrink-0" onClick={openCreateModal}>
            <Plus className="size-4" />
            Добавить
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"> </TableHead>
              <TableHead>Фамилия</TableHead>
              <TableHead>Имя</TableHead>
              <TableHead className="hidden md:table-cell">Отчество</TableHead>
              <TableHead className="hidden lg:table-cell">Строка в каталоге</TableHead>
              <TableHead className="w-[88px] text-right tabular-nums">Книги</TableHead>
              <TableHead className="w-[100px] text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Загрузка…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Авторов пока нет. Нажмите «Добавить», чтобы создать первого.
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Ничего не найдено.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="w-12 align-middle">
                    <AdminAuthorThumb authorId={row.id} hasPhoto={row.hasPhoto} token={token} />
                  </TableCell>
                  <TableCell className="font-medium">{row.lastName}</TableCell>
                  <TableCell>{row.firstName}</TableCell>
                  <TableCell className="hidden md:table-cell">{row.middleName ?? "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{authorFullName(row)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {row.bookCount ?? 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => openEdit(row)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(row)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) {
            setLastName("")
            setFirstName("")
            setMiddleName("")
            setCreatePhotoFile(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новый автор</DialogTitle>
            <DialogDescription>
              Фамилия и имя обязательны. Состав авторов у конкретной книги задаётся в разделе{" "}
              <Link href="/admin/books" className="text-primary underline underline-offset-2">
                Книги
              </Link>
              .
            </DialogDescription>
          </DialogHeader>
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault()
              void handleCreate()
            }}
          >
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="cln">Фамилия</Label>
                <Input id="cln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cfn">Имя</Label>
                <Input id="cfn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cmn">Отчество</Label>
                <Input
                  id="cmn"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Необязательно"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cphoto">Портрет</Label>
                <Input
                  id="cphoto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => setCreatePhotoFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-muted-foreground text-xs">Необязательно. До 5 МБ.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Создание…" : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактирование автора</DialogTitle>
            <DialogDescription>
              ФИО автора. Состав авторов у книги меняется в карточке книги в разделе «Книги».
            </DialogDescription>
          </DialogHeader>
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault()
              void handleSaveEdit()
            }}
          >
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="eln">Фамилия</Label>
                <Input id="eln" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="efn">Имя</Label>
                <Input id="efn" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="emn">Отчество</Label>
                <Input id="emn" value={editMiddleName} onChange={(e) => setEditMiddleName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ephoto">Портрет</Label>
                <Input
                  id="ephoto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => setEditPhotoFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-muted-foreground text-xs">Необязательно. До 5 МБ.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Сохранение…" : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить автора?</AlertDialogTitle>
            <AlertDialogDescription>
              Будет удалён: {deleteTarget ? authorFullName(deleteTarget) : ""}. Связи с книгами в каталоге обновятся.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={submitting}>
                Отмена
              </Button>
            </AlertDialogCancel>
            <Button variant="destructive" disabled={submitting} onClick={() => void handleConfirmDelete()}>
              Удалить
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminSectionGuard>
  )
}
