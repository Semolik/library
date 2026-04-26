"use client"

import { useState } from "react"
import { toast } from "sonner"
import { libraryClient, type LibraryAuthor } from "@/client/library-client"
import { AdminSectionGuard } from "@/components/admin-section-guard"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

export default function AdminAuthorsPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [items, setItems] = useState<LibraryAuthor[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return
    setIsSubmitting(true)
    try {
      const created = await libraryClient.createAuthor({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: middleName.trim() || null,
      })
      setItems((prev) => [created, ...prev])
      setFirstName("")
      setLastName("")
      setMiddleName("")
      toast.success("Автор создан")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать автора.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminSectionGuard title="Авторы" description="Управление авторами книг">
      <form onSubmit={handleCreate} className="grid gap-2 sm:grid-cols-3">
        <Input
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          placeholder="Фамилия"
          required
        />
        <Input
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          placeholder="Имя"
          required
        />
        <Input
          value={middleName}
          onChange={(event) => setMiddleName(event.target.value)}
          placeholder="Отчество (опционально)"
        />
        <div className="sm:col-span-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Сохраняем..." : "Добавить"}
          </Button>
        </div>
      </form>
      <div className="rounded-lg border bg-card p-4 text-sm">
        {items.length === 0 ? (
          <p className="text-muted-foreground">Пока нет созданных в этой сессии авторов.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="rounded border p-2">
                {[item.lastName, item.firstName, item.middleName].filter(Boolean).join(" ")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminSectionGuard>
  )
}
