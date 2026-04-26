"use client"

import { useState } from "react"
import { toast } from "sonner"
import { libraryClient, type LibraryBookCopy } from "@/client/library-client"
import { AdminSectionGuard } from "@/components/admin-section-guard"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

export default function AdminBookCopiesPage() {
  const [bookId, setBookId] = useState("")
  const [storageId, setStorageId] = useState("")
  const [inventoryNumber, setInventoryNumber] = useState("")
  const [items, setItems] = useState<LibraryBookCopy[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const copy = await libraryClient.createBookCopy({
        bookId: bookId.trim(),
        storageId: storageId.trim(),
        inventoryNumber: inventoryNumber.trim(),
      })
      setItems((prev) => [copy, ...prev])
      setBookId("")
      setStorageId("")
      setInventoryNumber("")
      toast.success("Экземпляр создан")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать экземпляр.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminSectionGuard title="Экземпляры книг" description="Создание записей book_copies">
      <form onSubmit={handleCreate} className="grid gap-2 sm:grid-cols-3">
        <Input
          placeholder="UUID книги (book_id)"
          value={bookId}
          onChange={(event) => setBookId(event.target.value)}
          required
        />
        <Input
          placeholder="UUID зала (storage_id)"
          value={storageId}
          onChange={(event) => setStorageId(event.target.value)}
          required
        />
        <Input
          placeholder="Инвентарный номер"
          value={inventoryNumber}
          onChange={(event) => setInventoryNumber(event.target.value)}
          required
        />
        <div className="sm:col-span-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Сохраняем..." : "Добавить экземпляр"}
          </Button>
        </div>
      </form>

      <div className="rounded-lg border bg-card p-4 text-sm">
        {items.length === 0 ? (
          <p className="text-muted-foreground">Пока нет созданных в этой сессии экземпляров.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="rounded border p-2">
                #{item.inventoryNumber} (book: {item.bookId})
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminSectionGuard>
  )
}
