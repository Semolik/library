"use client"

import * as React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { PageHeaderProvider } from "@/components/page-header-context"
import { Toaster } from "@workspace/ui/components/sonner"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PageHeaderProvider>
          {children}
          <Toaster />
        </PageHeaderProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
