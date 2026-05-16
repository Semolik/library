"use client"

import type { LibraryBook } from "@/client/library-client"
import { AdminBooksExplorer } from "@/components/admin-books-explorer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

export function AdminBookPickerDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  token?: string | null
  onPick: (book: LibraryBook) => void
}) {
  const { open, onOpenChange, token, onPick } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(90vh,880px)] w-[calc(100vw-2rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-14 text-left">
          <DialogTitle>Выбор книги</DialogTitle>
          <DialogDescription>
            Фильтры и вид «Карточки» или «Таблица». Нажмите на карточку или строку, чтобы выбрать книгу.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6 pt-4">
          <AdminBooksExplorer
            token={token}
            purpose="pick"
            viewStorageKey="library-admin-book-picker-view"
            onPickBook={(book) => {
              onPick(book)
              onOpenChange(false)
            }}
            className="flex min-h-0 min-w-0 flex-1 flex-col gap-4"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
