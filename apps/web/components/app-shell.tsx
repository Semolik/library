import type * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <main className="flex flex-1 items-center justify-center p-6 md:p-10">{children}</main>
    </div>
  )
}
