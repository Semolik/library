"use client"

import { useEffect, useState } from "react"

/** Контейнер прокрутки из `AppShell` — для `InfiniteScrollSentinel` и IntersectionObserver. */
export function useAppScrollRoot(): Element | null {
  const [el, setEl] = useState<Element | null>(null)
  useEffect(() => {
    const found = document.querySelector("[data-app-scroll-region]")
    setEl(found)
  }, [])
  return el
}
