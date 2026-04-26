"use client"

import { useState } from "react"
import { toast } from "sonner"
import { libraryClient, type LibraryPublishingHouse } from "@/client/library-client"
import { AdminSectionGuard } from "@/components/admin-section-guard"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

export default function AdminPublishingHousesPage() {
  const [name, setName] = useState("")
  const [items, setItems] = useState<LibraryPublishingHouse[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const created = await libraryClient.createPublishingHouse(name.trim())
      setItems((prev) => [created, ...prev])
      setName("")
      toast.success("Издательство создано")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать издательство.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminSectionGuard title="Издательства" description="Управление издательствами книг">
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Название издательства"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняем..." : "Добавить"}
        </Button>
      </form>
      <div className="rounded-lg border bg-card p-4 text-sm">
        {items.length === 0 ? (
          <p className="text-muted-foreground">Пока нет созданных в этой сессии издательств.</p>
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
