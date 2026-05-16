"use client"

import { useEffect, useState } from "react"
import { libraryPublicClient } from "@/client/library-public-client"

/** Подгружает presigned URL обложек для списка книг публичного каталога. */
export type BookCoverFetchKey = { id: string; hasCover: boolean }

export function usePublicBookCoverUrls(books: BookCoverFetchKey[]) {
  const [coverUrlsById, setCoverUrlsById] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    const withCover = books.filter((b) => b.hasCover)
    if (withCover.length === 0) {
      setCoverUrlsById({})
      return
    }
    void (async () => {
      const next: Record<string, string> = {}
      await Promise.all(
        withCover.map(async (b) => {
          try {
            const { url } = await libraryPublicClient.getCoverUrl(b.id)
            next[b.id] = url
          } catch {
            /* превью недоступно */
          }
        }),
      )
      if (!cancelled) setCoverUrlsById(next)
    })()
    return () => {
      cancelled = true
    }
  }, [books])

  return coverUrlsById
}
