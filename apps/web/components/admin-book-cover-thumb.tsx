"use client"

import * as React from "react"
import type { LibraryBook } from "@/client/library-client"
import { cn } from "@workspace/ui/lib/utils"
import { ImageIcon } from "lucide-react"

/** Ширина к высоте 3∶4 — одно соотношение для всех обложек в интерфейсе */
export const BOOK_COVER_ASPECT_CLASS = "aspect-[3/4]"

function PosterPlaceholder({ className }: { className?: string }) {
  return (
    <span className={cn("absolute inset-0 flex items-center justify-center", className)}>
      <ImageIcon className="size-5 opacity-40" aria-hidden />
    </span>
  )
}

export function AdminBookCoverThumb(props: {
  book: LibraryBook
  url?: string
  className?: string
  imgClassName?: string
  onOpen?: () => void
  layout?: "poster" | "thumb"
  /** Без рамки и скругления у самой обложки (родитель задаёт форму и скругление) */
  barePoster?: boolean
}) {
  const { book, url, className, imgClassName, onOpen, layout = "poster", barePoster } = props

  const thumbShell = cn(
    "relative shrink-0 overflow-hidden rounded-md border border-border bg-muted text-muted-foreground",
    "h-14 w-auto",
    BOOK_COVER_ASPECT_CLASS,
  )

  const posterShell = cn(
    "relative w-full overflow-hidden bg-muted text-muted-foreground",
    BOOK_COVER_ASPECT_CLASS,
  )

  const posterFramed = cn(posterShell, "rounded-md border border-border")
  const posterBare = posterShell

  const shell =
    layout === "thumb"
      ? cn(thumbShell, className)
      : barePoster
        ? cn(posterBare, className)
        : cn(posterFramed, className)

  const imgClasses = cn("absolute inset-0 h-full w-full min-h-0 object-cover", imgClassName)

  if (!book.hasCover) {
    return (
      <div className={shell} title="Нет обложки">
        <PosterPlaceholder />
      </div>
    )
  }

  if (!url) {
    return <div className={cn(shell, "animate-pulse")} aria-hidden title="Загрузка обложки…" />
  }

  const inner = (
    <img src={url} alt={book.title} className={imgClasses} loading="lazy" decoding="async" />
  )

  if (onOpen) {
    return (
      <button
        type="button"
        className={cn(shell, "cursor-pointer p-0 transition-opacity hover:opacity-90")}
        onClick={onOpen}
        title="Открыть обложку"
      >
        {inner}
      </button>
    )
  }

  return (
    <div className={shell} title={book.title}>
      {inner}
    </div>
  )
}
