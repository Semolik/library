"use client"

import * as React from "react"
import { toast } from "sonner"
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
import { Pencil, Plus, Trash2 } from "lucide-react"

export type NameDirectoryItem = { id: string; name: string; bookCount?: number }

const SEARCH_DEBOUNCE_MS = 350

export type AdminLibraryNameCrudProps = {
  title: string
  description?: string
  /** Заголовок колонки счётчика связей (по умолчанию «Книги»). */
  countColumnHeader?: string
  nounGenitive: string
  placeholder: string
  /** Подсказка в поле поиска по таблице */
  searchPlaceholder?: string
  loadItems: (token: string | null) => Promise<NameDirectoryItem[]>
  createItem: (token: string | null, name: string) => Promise<NameDirectoryItem>
  updateItem: (token: string | null, id: string, name: string) => Promise<NameDirectoryItem>
  deleteItem: (token: string | null, id: string) => Promise<void>
  /** Только администратор каталога (SUPERUSER / ADMIN). */
  requireCatalogAdmin?: boolean
}

export function AdminLibraryNameCrud(props: AdminLibraryNameCrudProps) {
  const { token } = useAuth()
  const tableSearchFieldId = React.useId()
  const propsRef = React.useRef(props)
  propsRef.current = props

  const [items, setItems] = React.useState<NameDirectoryItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createName, setCreateName] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editId, setEditId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState("")
  const [deleteTarget, setDeleteTarget] = React.useState<NameDirectoryItem | null>(null)
  const [searchInput, setSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const refresh = React.useCallback(async () => {
    if (!token?.trim()) return
    try {
      const list = await propsRef.current.loadItems(token)
      setItems(list)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить список.")
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
        const list = await propsRef.current.loadItems(token)
        if (!cancelled) setItems(list)
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Не удалось загрузить список.")
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
    return items.filter((row) => row.name.toLowerCase().includes(q))
  }, [items, debouncedSearch])

  function commitSearchImmediate() {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = null
    }
    setDebouncedSearch(searchInput.trim())
  }

  function openCreateModal() {
    setCreateName("")
    setCreateOpen(true)
  }

  async function handleCreate() {
    const name = createName.trim()
    if (!name) {
      toast.error(`Укажите название ${propsRef.current.nounGenitive}.`)
      return
    }
    setSubmitting(true)
    try {
      await propsRef.current.createItem(token, name)
      setCreateName("")
      setCreateOpen(false)
      toast.success("Запись добавлена")
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать запись.")
    } finally {
      setSubmitting(false)
    }
  }

  function openEdit(row: NameDirectoryItem) {
    setEditId(row.id)
    setEditName(row.name)
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    if (!editId) return
    const name = editName.trim()
    if (!name) {
      toast.error(`Укажите название ${propsRef.current.nounGenitive}.`)
      return
    }
    setSubmitting(true)
    try {
      await propsRef.current.updateItem(token, editId, name)
      toast.success("Изменения сохранены")
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
      await propsRef.current.deleteItem(token, deleteTarget.id)
      toast.success("Запись удалена")
      setDeleteTarget(null)
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось удалить.")
    } finally {
      setSubmitting(false)
    }
  }

  const countColumnHeader = props.countColumnHeader ?? "Книги"
  const searchPlaceholder = props.searchPlaceholder ?? "Поиск по названию…"

  return (
    <AdminSectionGuard
      title={props.title}
      description={props.description}
      requireCatalogAdmin={props.requireCatalogAdmin}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid min-w-[200px] flex-1 gap-1.5 sm:max-w-md">
            <Label htmlFor={tableSearchFieldId}>Поиск</Label>
            <Input
              id={tableSearchFieldId}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={searchPlaceholder}
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
              <TableHead>Название</TableHead>
              <TableHead className="w-[88px] text-right tabular-nums">{countColumnHeader}</TableHead>
              <TableHead className="w-[100px] text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Загрузка…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Нет записей.
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Ничего не найдено.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
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
          if (!open) setCreateName("")
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новая запись</DialogTitle>
            <DialogDescription>Введите название и сохраните.</DialogDescription>
          </DialogHeader>
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault()
              void handleCreate()
            }}
          >
            <div className="grid gap-2 py-2">
              <Label htmlFor="create-name">Название</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={props.placeholder}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false)
                  setCreateName("")
                }}
              >
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
            <DialogTitle>Редактирование</DialogTitle>
            <DialogDescription>Измените название и сохраните.</DialogDescription>
          </DialogHeader>
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault()
              void handleSaveEdit()
            }}
          >
            <div className="grid gap-2 py-2">
              <Label htmlFor="edit-name">Название</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
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
            <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
            <AlertDialogDescription>
              Будет удалено: «{deleteTarget?.name}». Это действие необратимо.
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
