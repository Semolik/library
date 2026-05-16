"use client"

import Link from "next/link"
import type { LibraryBook, LibraryFavoriteBookBrief } from "@/client/library-client"
import { AdminBookCoverThumb } from "@/components/admin-book-cover-thumb"
import { cn } from "@workspace/ui/lib/utils"

/** Данные для публичной карточки-постера (каталог, избранное, «популярное» и т.п.). */
export type CatalogPosterBookInput = Pick<
  LibraryBook,
  "id" | "title" | "isbn" | "publicationYear" | "pages" | "hasCover"
> &
  Partial<Pick<LibraryBook, "copyCount" | "bookAuthors">>

export function catalogBookPosterAuthorsLine(book: Pick<LibraryBook, "bookAuthors">): string {
  const parts =
    book.bookAuthors
      ?.map((ba) => {
        const a = ba.author
        return [a.lastName, a.firstName, a.middleName].filter(Boolean).join(" ").trim()
      })
      .filter(Boolean) ?? []
  return parts.length ? parts.join("; ") : "—"
}

export function favoriteBriefToPosterInput(b: LibraryFavoriteBookBrief): CatalogPosterBookInput {
  return {
    id: b.id,
    title: b.title,
    isbn: b.isbn,
    publicationYear: b.publicationYear,
    pages: b.pages,
    hasCover: b.hasCover,
    bookAuthors: b.authors?.map((author) => ({
      authorId: author.id,
      author,
    })),
  }
}

const posterCardClass = cn(
  "group flex w-full min-w-0 max-w-full flex-col text-left outline-none ring-offset-background transition-opacity hover:opacity-[0.97]",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
)

export function CatalogBookPosterCard({
  book,
  coverUrl,
  statsLine,
  authorsLine,
  className,
  hideAuthorsLine,
}: {
  book: CatalogPosterBookInput
  coverUrl?: string
  /** По умолчанию: «год · стр. · N экз.» */
  statsLine?: string
  /** По умолчанию из bookAuthors */
  authorsLine?: string
  className?: string
  /** Не показывать строку авторов (например, нет данных в API). */
  hideAuthorsLine?: boolean
}) {
  const thumbBook = { hasCover: book.hasCover, title: book.title }
  const metaStats =
    statsLine ?? `${book.publicationYear} · ${book.pages} стр. · ${book.copyCount ?? 0} экз.`
  const metaAuthors = authorsLine ?? catalogBookPosterAuthorsLine(book)

  return (
    <Link href={`/books/${book.id}`} className={cn(posterCardClass, className)}>
      <div className="w-full overflow-hidden rounded-xl bg-muted">
        <AdminBookCoverThumb
          book={thumbBook}
          url={coverUrl}
          layout="poster"
          barePoster
          className="w-full"
        />
      </div>
      <div className="w-full min-w-0 space-y-2 pt-4">
        <span className="line-clamp-2 text-left text-base font-semibold leading-snug tracking-tight group-hover:text-primary">
          {book.title}
        </span>
        <p className="truncate font-mono text-xs text-muted-foreground">{book.isbn}</p>
        <p className="truncate text-sm text-muted-foreground">{metaStats}</p>
        {!hideAuthorsLine ? (
          <p className="line-clamp-2 text-left text-xs leading-relaxed text-muted-foreground">
            {metaAuthors}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
