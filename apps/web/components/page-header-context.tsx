"use client"

import * as React from "react"

export type PageBreadcrumbItem = { label: string; href?: string }

type PageHeaderContextValue = {
  breadcrumbs: PageBreadcrumbItem[] | null
  setBreadcrumbs: React.Dispatch<React.SetStateAction<PageBreadcrumbItem[] | null>>
}

const PageHeaderContext = React.createContext<PageHeaderContextValue | null>(null)

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = React.useState<PageBreadcrumbItem[] | null>(null)

  const value = React.useMemo(
    () => ({
      breadcrumbs,
      setBreadcrumbs,
    }),
    [breadcrumbs],
  )

  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>
}

export function usePageHeaderOptional() {
  return React.useContext(PageHeaderContext)
}
