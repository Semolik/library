"use client"

import type * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

/** Выравнивает узкую форму по центру области по вертикали и горизонтали. */
export function CenteredFormShell({
  className,
  children,
  ...rest
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col items-center justify-center px-2 py-10 sm:px-4",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
