"use client"

import { useState } from "react"
import { toast } from "sonner"
import { libraryClient, type LibraryStorage } from "@/client/library-client"
import { AdminSectionGuard } from "@/components/admin-section-guard"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

export default function AdminStoragesPage() {
  const [name, setName] = useState("")
  const [items, setItems] = useState<LibraryStorage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const created = await libraryClient.createStorage(name.trim())
      setItems((prev) => [created, ...prev])
      setName("")
      toast.success("Зал хранения создан")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать зал.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminSectionGuard title="Залы хранения" description="Локации, где лежат экземпляры книг">
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Название зала"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняем..." : "Добавить"}
        </Button>
      </form>
      <div className="rounded-lg border bg-card p-4 text-sm">
        {items.length === 0 ? (
          <p className="text-muted-foreground">Пока нет созданных в этой сессии залов.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="rounded border p-2">
                {item.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminSectionGuard>
  )
}
