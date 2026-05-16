"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Heart } from "lucide-react"
import { libraryClient } from "@/client/library-client"
import { ApiError } from "@/client/api-client"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type BookFavoriteToggleProps = {
  bookId: string
  className?: string
}

export function BookFavoriteToggle({ bookId, className }: BookFavoriteToggleProps) {
  const { isHydrated, isAuthenticated, token } = useAuth()
  const [favorited, setFavorited] = useState(false)
  const [busy, setBusy] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    if (!bookId?.trim() || !isHydrated || !token?.trim()) {
      setFavorited(false)
      setStatusLoading(false)
      return
    }
    let cancelled = false
    setStatusLoading(true)
    void libraryClient
      .isBookFavorited(bookId.trim(), token)
      .then((res) => {
        if (!cancelled) setFavorited(res.favorited)
      })
      .catch(() => {
        if (!cancelled) setFavorited(false)
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [bookId, isHydrated, token])

  const toggle = useCallback(async () => {
    const id = bookId?.trim()
    if (!id || !token?.trim() || busy) return
    setBusy(true)
    try {
      if (favorited) {
        await libraryClient.removeBookFavorite(id, token)
        setFavorited(false)
        toast.success("Убрано из избранного.")
      } else {
        await libraryClient.addBookFavorite(id, token)
        setFavorited(true)
        toast.success("Добавлено в избранное.")
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setFavorited(true)
        return
      }
      const msg = e instanceof Error ? e.message : "Не удалось обновить избранное."
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }, [bookId, token, favorited, busy])

  if (!isHydrated) {
    return null
  }

  if (!isAuthenticated || !token?.trim()) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Войдите
        </Link>
        , чтобы добавлять книги в избранное.
      </p>
    )
  }

  const disabled = busy || statusLoading || !bookId?.trim()

  return (
    <Button
      type="button"
      variant={favorited ? "secondary" : "outline"}
      size="sm"
      className={cn("shrink-0", className)}
      disabled={disabled}
      onClick={() => void toggle()}
      aria-pressed={favorited}
    >
      <Heart
        className={cn(
          "mr-2 size-4 transition-colors",
          favorited && "fill-red-500 text-red-500",
        )}
        aria-hidden
      />
      {statusLoading ? "…" : favorited ? "В избранном" : "В избранное"}
    </Button>
  )
}
