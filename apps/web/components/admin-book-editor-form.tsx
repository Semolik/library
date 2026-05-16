"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  libraryClient,
  type LibraryAuthor,
  type LibraryBook,
  type LibraryCategory,
  type LibraryCity,
  type LibraryPublishingHouse,
} from "@/client/library-client"
import { AdminFormSelect } from "@/components/admin-form-select"
import { AdminMultiSelect } from "@/components/admin-multi-select"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"

function authorLabel(a: LibraryAuthor) {
  return [a.lastName, a.firstName, a.middleName].filter(Boolean).join(" ")
}

type BookFormState = {
  categoryId: string
  publishingHouseId: string
  cityId: string
  title: string
  publicationYear: string
  pages: string
  isbn: string
  description: string
}

const emptyForm: BookFormState = {
  categoryId: "",
  publishingHouseId: "",
  cityId: "",
  title: "",
  publicationYear: "",
  pages: "",
  isbn: "",
  description: "",
}

function firstNonEmptyId(...values: Array<string | undefined | null>): string {
  for (const v of values) {
    const t = typeof v === "string" ? v.trim() : ""
    if (t) return t
  }
  return ""
}

export function AdminBookEditorForm({
  token,
  book,
  categories,
  publishingHouses,
  cities,
  authors,
  refsReady,
  onCancel,
  onSaved,
}: {
  token: string | null
  book: LibraryBook | null
  categories: LibraryCategory[]
  publishingHouses: LibraryPublishingHouse[]
  cities: LibraryCity[]
  authors: LibraryAuthor[]
  refsReady: boolean
  onCancel?: () => void
  onSaved: () => void | Promise<void>
}) {
  const [form, setForm] = React.useState<BookFormState>(emptyForm)
  const [selectedAuthorIds, setSelectedAuthorIds] = React.useState<string[]>([])
  const [coverFile, setCoverFile] = React.useState<File | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (book) {
      const categoryId = firstNonEmptyId(book.categoryId, book.category?.id)
      const publishingHouseId = firstNonEmptyId(
        book.publishingHouseId,
        book.publishingHouse?.id,
      )
      const cityId = firstNonEmptyId(book.cityId, book.city?.id)
      setForm({
        categoryId,
        publishingHouseId,
        cityId,
        title: book.title,
        publicationYear: String(book.publicationYear),
        pages: String(book.pages),
        isbn: book.isbn,
        description: book.description ?? "",
      })
      setSelectedAuthorIds(
        (book.bookAuthors ?? [])
          .map((row) => row.authorId ?? row.author?.id)
          .filter((id): id is string => Boolean(id)),
      )
    } else {
      setForm(emptyForm)
      setSelectedAuthorIds([])
    }
    setCoverFile(null)
  }, [
    book,
    categories.length,
    publishingHouses.length,
    cities.length,
  ])

  async function submit() {
    if (!form.title.trim() || !form.isbn.trim()) {
      toast.error("Укажите название и ISBN.")
      return
    }
    const publicationYear = Number(form.publicationYear)
    const pages = Number(form.pages)
    if (!Number.isFinite(publicationYear) || !Number.isFinite(pages)) {
      toast.error("Год и число страниц должны быть числами.")
      return
    }
    if (!form.categoryId || !form.publishingHouseId || !form.cityId) {
      toast.error("Выберите категорию, издательство и город.")
      return
    }

    const authorIds = selectedAuthorIds
    setSubmitting(true)
    try {
      let bookId: string
      if (!book) {
        const created = await libraryClient.createBook(
          {
            categoryId: form.categoryId,
            publishingHouseId: form.publishingHouseId,
            cityId: form.cityId,
            title: form.title.trim(),
            publicationYear,
            pages,
            isbn: form.isbn.trim(),
            description: form.description.trim() || null,
            authorIds,
          },
          token,
        )
        bookId = created.id
        toast.success("Книга создана")
      } else {
        await libraryClient.updateBook(
          book.id,
          {
            categoryId: form.categoryId,
            publishingHouseId: form.publishingHouseId,
            cityId: form.cityId,
            title: form.title.trim(),
            publicationYear,
            pages,
            isbn: form.isbn.trim(),
            description: form.description.trim() || null,
            authorIds,
          },
          token,
        )
        bookId = book.id
        toast.success("Сохранено")
      }

      if (coverFile) {
        await libraryClient.uploadCover(bookId, coverFile, token)
        toast.success("Обложка обновлена")
      }

      setCoverFile(null)
      await onSaved()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить.")
    } finally {
      setSubmitting(false)
    }
  }

  const formKey =
    `${book?.id ?? "new"}-${categories.length}-${publishingHouses.length}-${cities.length}-${authors.length}`

  return (
    <form
      key={formKey}
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="book-title">Название</Label>
        <Input
          id="book-title"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="book-description">Описание</Label>
        <textarea
          id="book-description"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Аннотация, что в книге — по желанию"
          rows={5}
          className={cn(
            "min-h-[120px] w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground md:text-sm dark:bg-input/30",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50",
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminFormSelect
          label="Категория"
          value={form.categoryId}
          onValueChange={(v) => setForm((p) => ({ ...p, categoryId: v }))}
          placeholder="Выберите категорию"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <AdminFormSelect
          label="Издательство"
          value={form.publishingHouseId}
          onValueChange={(v) => setForm((p) => ({ ...p, publishingHouseId: v }))}
          placeholder="Выберите издательство"
          options={publishingHouses.map((p) => ({ value: p.id, label: p.name }))}
        />
      </div>

      <AdminFormSelect
        label="Город издания"
        value={form.cityId}
        onValueChange={(v) => setForm((p) => ({ ...p, cityId: v }))}
        placeholder="Выберите город"
        options={cities.map((c) => ({ value: c.id, label: c.name }))}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="book-year">Год издания</Label>
          <Input
            id="book-year"
            type="number"
            value={form.publicationYear}
            onChange={(e) => setForm((p) => ({ ...p, publicationYear: e.target.value }))}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="book-pages">Страниц</Label>
          <Input
            id="book-pages"
            type="number"
            value={form.pages}
            onChange={(e) => setForm((p) => ({ ...p, pages: e.target.value }))}
            required
          />
        </div>
        <div className="grid gap-2 sm:col-span-1">
          <Label htmlFor="book-isbn">ISBN</Label>
          <Input
            id="book-isbn"
            value={form.isbn}
            onChange={(e) => setForm((p) => ({ ...p, isbn: e.target.value }))}
            required
          />
        </div>
      </div>

      <AdminMultiSelect
        label="Авторы"
        value={selectedAuthorIds}
        onChange={setSelectedAuthorIds}
        placeholder="Добавить автора"
        options={authors.map((a) => ({ value: a.id, label: authorLabel(a) }))}
      />

      <div className="grid gap-2">
        <Label htmlFor="book-cover-file">
          {book?.hasCover ? "Заменить обложку" : "Обложка"}
        </Label>
        <Input
          id="book-cover-file"
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting || !refsReady}>
          {submitting ? "Сохранение…" : book ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  )
}
