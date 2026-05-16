"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Building2 } from "lucide-react"
import { libraryPublicClient } from "@/client/library-public-client"
import type { LibraryPublishingHouse } from "@/client/library-client"
import { AppShell } from "@/components/app-shell"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function PublishingHousesPage() {
  const [items, setItems] = useState<LibraryPublishingHouse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void libraryPublicClient
      .listPublishingHouses()
      .then(setItems)
      .catch(() => {
        toast.error("Не удалось загрузить издательства.")
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      <div className="flex w-full flex-col gap-6">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 size-6 shrink-0 text-primary" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Издательства</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Список издательств, издания которых есть в фонде библиотеки.
            </p>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : !items.length ? (
          <p className="text-sm text-muted-foreground">Записей пока нет.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((h) => (
              <Link key={h.id} href={`/publishing-houses/${h.id}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base leading-snug">{h.name}</CardTitle>
                    <CardDescription className="tabular-nums">
                      Книг в фонде: {h.bookCount ?? 0}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
