"use client"

import { useState } from "react"
import { toast } from "sonner"
import { libraryClient, type LibraryBook } from "@/client/library-client"
import { AdminSectionGuard } from "@/components/admin-section-guard"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

type CreateBookForm = {
  categoryId: string
  publishingHouseId: string
  cityId: string
  title: string
  publicationYear: string
  pages: string
  isbn: string
  authorIds: string
}

const initialForm: CreateBookForm = {
  categoryId: "",
  publishingHouseId: "",
  cityId: "",
  title: "",
  publicationYear: "",
  pages: "",
  isbn: "",
  authorIds: "",
}

export default function AdminBooksPage() {
  const [form, setForm] = useState<CreateBookForm>(initialForm)
  const [createdBook, setCreatedBook] = useState<LibraryBook | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const book = await libraryClient.createBook({
        categoryId: form.categoryId.trim(),
        publishingHouseId: form.publishingHouseId.trim(),
        cityId: form.cityId.trim(),
        title: form.title.trim(),
        publicationYear: Number(form.publicationYear),
        pages: Number(form.pages),
        isbn: form.isbn.trim(),
        authorIds: form.authorIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean),
      })
      setCreatedBook(book)
      setCoverUrl(null)
      toast.success("Книга создана")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать книгу.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUploadCover() {
    if (!createdBook || !coverFile) return
    setIsSubmitting(true)
    try {
      const uploaded = await libraryClient.uploadCover(createdBook.id, coverFile)
      setCoverUrl(uploaded.url)
      toast.success("Обложка загружена")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить обложку.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminSectionGuard
      title="Книги"
      description="Создание книги и загрузка обложки в MinIO (authorIds через запятую)"
    >
      <form onSubmit={handleCreate} className="grid gap-2 sm:grid-cols-2">
        <Input
          placeholder="UUID категории"
          value={form.categoryId}
          onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
          required
        />
        <Input
          placeholder="UUID издательства"
          value={form.publishingHouseId}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, publishingHouseId: event.target.value }))
          }
          required
        />
        <Input
          placeholder="UUID города"
          value={form.cityId}
          onChange={(event) => setForm((prev) => ({ ...prev, cityId: event.target.value }))}
          required
        />
        <Input
          placeholder="Название книги"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          required
        />
        <Input
          type="number"
          placeholder="Год публикации"
          value={form.publicationYear}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, publicationYear: event.target.value }))
          }
          required
        />
        <Input
          type="number"
          placeholder="Страниц"
          value={form.pages}
          onChange={(event) => setForm((prev) => ({ ...prev, pages: event.target.value }))}
          required
        />
        <Input
          placeholder="ISBN"
          value={form.isbn}
          onChange={(event) => setForm((prev) => ({ ...prev, isbn: event.target.value }))}
          required
        />
        <Input
          placeholder="UUID авторов через запятую"
          value={form.authorIds}
          onChange={(event) => setForm((prev) => ({ ...prev, authorIds: event.target.value }))}
        />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Сохраняем..." : "Создать книгу"}
          </Button>
        </div>
      </form>

      {createdBook ? (
        <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
          <p>
            Создана книга: <span className="font-medium">{createdBook.title}</span>
          </p>
          <p className="text-muted-foreground">ID: {createdBook.id}</p>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
              className="max-w-sm"
            />
            <Button type="button" variant="outline" disabled={!coverFile || isSubmitting} onClick={handleUploadCover}>
              Загрузить обложку
            </Button>
          </div>

          {coverUrl ? (
            <a className="text-primary underline" href={coverUrl} target="_blank" rel="noreferrer">
              Открыть обложку
            </a>
          ) : null}
        </div>
      ) : null}
    </AdminSectionGuard>
  )
}
