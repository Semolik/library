"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import type { PageBreadcrumbItem } from "@/components/page-header-context"

export function AppBreadcrumb({
  items,
  className,
}: {
  items: PageBreadcrumbItem[]
  className?: string
}) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Навигационная цепочка" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const content =
            !isLast && item.href ? (
              <Link
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={isLast ? "font-medium text-foreground" : "text-muted-foreground"}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )

          return (
            <li key={`${index}-${item.label}`} className="flex items-center gap-2">
              {index > 0 ? (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              ) : null}
              {content}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
