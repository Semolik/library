"use client"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { BookOpen, LayoutGrid } from "lucide-react"
import { libraryPublicClient } from "@/client/library-public-client"
import type { LibraryCategory } from "@/client/library-client"
import { AppShell } from "@/components/app-shell"
import { cn } from "@workspace/ui/lib/utils"

function HomePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [categories, setCategories] = useState<LibraryCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  useEffect(() => {
    const cat = searchParams.get("categoryId")?.trim() ?? ""
    const house = searchParams.get("publishingHouseId")?.trim() ?? ""
    const city = searchParams.get("cityId")?.trim() ?? ""
    const author = searchParams.get("authorId")?.trim() ?? ""
    if (!cat && !house && !city && !author) return

    if (cat && !house && !city && !author) {
      router.replace(`/browse?categoryId=${encodeURIComponent(cat)}`)
      return
    }
    const p = new URLSearchParams()
    if (cat) p.set("categoryId", cat)
    if (house) p.set("publishingHouseId", house)
    if (city) p.set("cityId", city)
    if (author) p.set("authorId", author)
    router.replace(`/browse?${p.toString()}`)
  }, [router, searchParams])

  useEffect(() => {
    let cancelled = false
    void libraryPublicClient
      .listCategories()
      .then((c) => {
        if (!cancelled) setCategories(c)
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Не удалось загрузить категории.")
          setCategories([])
        }
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AppShell>
      <div className="flex w-full flex-col gap-10 pb-10">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <BookOpen className="size-7 shrink-0 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Каталог библиотеки</h1>
          </div>
          <p className="text-sm text-muted-foreground text-pretty">
            Выберите раздел ниже или воспользуйтесь поиском в шапке (
            <kbd className="rounded border bg-muted px-1 font-mono text-xs">⌘K</kbd>
            ). Полный список книг с фильтрами — в разделе{" "}
            <Link href="/browse" className="font-medium text-primary underline-offset-4 hover:underline">
              Каталог книг
            </Link>
            . Подборку популярного по разделам смотрите на странице{" "}
            <Link href="/categories" className="font-medium text-primary underline-offset-4 hover:underline">
              Категории
            </Link>
            .
          </p>
        </header>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="flex items-center gap-2">
              <LayoutGrid className="size-5 text-muted-foreground" aria-hidden />
              <div>
                <h2 className="text-lg font-semibold">Категории</h2>
                <p className="text-sm text-muted-foreground">
                  Переход к книгам выбранного раздела
                </p>
              </div>
            </div>
            <Link
              href="/categories"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Все категории →
            </Link>
          </div>
          {categoriesLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка…</p>
          ) : !categories.length ? (
            <p className="text-sm text-muted-foreground">Категории пока не заведены.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.id}`}
                  className={cn(
                    "flex min-h-[5.5rem] flex-col justify-between rounded-xl border bg-card p-4 text-left shadow-sm transition-all",
                    "hover:border-primary/35 hover:shadow-md",
                    "outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <span className="font-medium leading-snug text-foreground">{c.name}</span>
                  <span className="mt-2 text-xs tabular-nums text-muted-foreground">
                    {c.bookCount ?? 0} книг
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        </AppShell>
      }
    >
      <HomePageInner />
    </Suspense>
  )
}
