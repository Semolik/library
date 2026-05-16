import Link from "next/link"
import { BookOpen, ImageIcon } from "lucide-react"
import type { LibraryPopularBookSnippet } from "@/client/library-public-client"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export function PopularBookCard({
  book,
  badgeLabel,
}: {
  book: LibraryPopularBookSnippet
  badgeLabel?: string | null
}) {
  const rentCount = book.rentCount > 0 ? book.rentCount : null

  return (
    <Link
      href={`/books/${book.id}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-lg border bg-card text-left shadow-sm transition-all",
        "hover:border-primary/35 hover:shadow",
        "outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className="relative flex h-[4.75rem] shrink-0 items-center justify-center bg-muted/70 text-muted-foreground sm:h-[5.25rem]">
        {book.hasCover ? (
          <ImageIcon className="size-7 opacity-40 sm:size-8" aria-hidden />
        ) : (
          <BookOpen className="size-7 opacity-40 sm:size-8" aria-hidden />
        )}
        {badgeLabel ? (
          <Badge
            variant="secondary"
            className="absolute bottom-1 left-1 right-1 max-w-[calc(100%-0.5rem)] truncate px-1 py-0 text-[9px] font-normal leading-tight"
          >
            {badgeLabel}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-2 pt-1.5">
        <span className="line-clamp-2 text-xs font-medium leading-tight text-foreground group-hover:text-primary">
          {book.title}
        </span>
        <span className="line-clamp-1 text-[10px] text-muted-foreground tabular-nums">
          {book.publicationYear} г. · {book.isbn}
          {rentCount != null ? ` · ${rentCount} в.` : null}
        </span>
      </div>
    </Link>
  )
}
