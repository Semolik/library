"use client"

import { useEffect, useRef } from "react"

type InfiniteScrollSentinelProps = {
  /** Есть ли ещё данные для подгрузки */
  hasMore: boolean
  /** Любая загрузка страницы списка (первая или следующая) — блокирует повторный вызов */
  loading: boolean
  onLoadMore: () => void
  /** Контейнер с overflow: scroll (если список крутится не во viewport) */
  scrollRoot?: Element | null
  rootMargin?: string
  className?: string
}

/**
 * Невидимый якорь в конце списка: при появлении в зоне видимости вызывает onLoadMore.
 */
export function InfiniteScrollSentinel({
  hasMore,
  loading,
  onLoadMore,
  scrollRoot = null,
  rootMargin = "160px",
  className,
}: InfiniteScrollSentinelProps) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const loadingRef = useRef(loading)
  const onLoadMoreRef = useRef(onLoadMore)
  loadingRef.current = loading
  onLoadMoreRef.current = onLoadMore

  useEffect(() => {
    const el = elRef.current
    if (!el || !hasMore) return

    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting)
        if (hit && !loadingRef.current) onLoadMoreRef.current()
      },
      { root: scrollRoot ?? null, rootMargin, threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, scrollRoot, rootMargin])

  if (!hasMore) return null

  return (
    <div
      ref={elRef}
      className={className ?? "h-4 w-full shrink-0"}
      aria-hidden
    />
  )
}
