/** Роли персонала библиотеки (доступ к админ-разделам каталога и обращения). */
export const LIBRARY_STAFF_ROLES = ["SUPERUSER", "ADMIN", "LIBRARIAN"] as const

export type LibraryStaffRole = (typeof LIBRARY_STAFF_ROLES)[number]

/** Ведение справочников, записей книг и залов — только эти роли. */
export const LIBRARY_CATALOG_ADMIN_ROLES = ["SUPERUSER", "ADMIN"] as const

export type LibraryCatalogAdminRole = (typeof LIBRARY_CATALOG_ADMIN_ROLES)[number]

/** Нормализует роли из JWT/localStorage (строка или `{ name }`). */
export function normalizeUserRoles(roles?: unknown[] | null): string[] {
  if (!roles?.length) return []
  return roles.map((r) =>
    typeof r === "string" ? r : String((r as { name?: string })?.name ?? ""),
  )
}

export function isLibraryStaffRole(roles?: unknown[] | null): boolean {
  const list = normalizeUserRoles(roles)
  if (!list.length) return false
  return list.some((r) => LIBRARY_STAFF_ROLES.includes(r as LibraryStaffRole))
}

export function isLibraryCatalogAdminRole(roles?: unknown[] | null): boolean {
  const list = normalizeUserRoles(roles)
  return list.some((r) =>
    LIBRARY_CATALOG_ADMIN_ROLES.includes(r as LibraryCatalogAdminRole),
  )
}
