"use client"

import { useState } from "react"
import { toast } from "sonner"
import { libraryClient, type LibraryCategory } from "@/client/library-client"
import { AdminSectionGuard } from "@/components/admin-section-guard"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

export default function AdminCategoriesPage() {
  const [name, setName] = useState("")
  const [items, setItems] = useState<LibraryCategory[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const created = await libraryClient.createCategory(name.trim())
      setItems((prev) => [created, ...prev])
      setName("")
      toast.success("Категория создана")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать категорию.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminSectionGuard title="Категории" description="Создание разделов каталога">
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Название категории"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняем..." : "Добавить"}
        </Button>
      </form>
      <div className="rounded-lg border bg-card p-4 text-sm">
        {items.length === 0 ? (
          <p className="text-muted-foreground">Пока нет созданных в этой сессии категорий.</p>
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
