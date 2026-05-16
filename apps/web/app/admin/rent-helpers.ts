import type { AdminUserListItem } from "@/client/admin-users-client"
import type { LibraryBookCopy, LibraryBorrowUrgency } from "@/client/library-client"

export function urgencyLabel(u: LibraryBorrowUrgency): string {
  switch (u) {
    case "overdue":
      return "Просрочено"
    case "due_soon":
      return "Скоро срок"
    case "ok":
      return "В сроке"
    default:
      return "Без даты возврата"
  }
}

export function borrowedReaderLabel(row: {
  userEmail: string
  userFirstName: string | null
  userLastName: string | null
}) {
  const name = [row.userFirstName, row.userLastName].filter(Boolean).join(" ").trim()
  return name ? `${name} · ${row.userEmail}` : row.userEmail
}

export function formatRub(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function copyLabel(c: LibraryBookCopy) {
  const title = c.book?.title ?? "Книга"
  const hall = c.storage?.name ?? "зал хранения"
  const year =
    c.book && "publicationYear" in c.book && typeof c.book.publicationYear === "number"
      ? ` (${c.book.publicationYear})`
      : ""
  return `${title}${year} · № ${c.inventoryNumber} · ${hall}`
}

/** Человекочитаемо: сколько дней до/после срока. */
export function dueHumanPhrase(daysUntilDue: number | null): string {
  if (daysUntilDue === null) return "—"
  if (daysUntilDue < 0) return `на ${Math.abs(daysUntilDue)} дн. позже срока`
  if (daysUntilDue === 0) return "вернуть сегодня"
  if (daysUntilDue === 1) return "вернуть завтра"
  return `ещё ${daysUntilDue} дн.`
}

/** ФИО первым — удобно при выдаче «на глаз». */
export function userLabel(u: AdminUserListItem) {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim()
  return name ? `${name} · ${u.email}` : u.email
}

/** Дата вида YYYY-MM-DD → «15 мая 2026 г.» */
export function formatRuDateFromIso(yyyyMmDd: string): string {
  const parts = yyyyMmDd.trim().split("-").map(Number)
  const [y, m, d] = parts
  if (!y || !m || !d || parts.length !== 3) return yyyyMmDd
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
}

export function mergeSelected<T extends { id: string }>(all: T[], filtered: T[], selectedId: string): T[] {
  if (!selectedId) return filtered
  if (filtered.some((x) => x.id === selectedId)) return filtered
  const sel = all.find((x) => x.id === selectedId)
  return sel ? [sel, ...filtered] : filtered
}

/** ISO 8601 с временем → дата и время по локали */
export function formatRuDateTimeFromIso(iso: string): string {
  const s = iso.trim()
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) {
    return s.length >= 10 ? formatRuDateFromIso(s.slice(0, 10)) : s
  }
  return d.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatIsoLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Календарная дата в локальной зоне без времени суток. */
export function addLocalCalendarDays(base: Date, days: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  d.setDate(d.getDate() + days)
  return d
}
