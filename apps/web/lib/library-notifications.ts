import type { LibraryBorrowedBooksResponse, LibraryFinesListResponse } from "@/client/library-client"
import { formatRub } from "@/app/admin/rent-helpers"

/**
 * Уведомления в колокольчике строятся из уже доступных API (без отдельной таблицы в БД).
 *
 * Читатель (USER):
 * - Просроченный возврат — есть активные выдачи с urgency overdue
 * - Скоро срок — есть выдачи в окне «скоро» (soonDays с API)
 * - Долг по штрафу — положительный outstanding по текущим выдачам
 *
 * Персонал (SUPERUSER / ADMIN / LIBRARIAN):
 * - Сводка по фонду: сколько просрочено и скоро срок (все читатели)
 * - Задолженность по журналу штрафов — сумма к доплате и число записей
 *
 * Будущие расширения (при появлении бэкенда):
 * - Персональные push / email
 * - «Книга зарезервирована» / очередь
 * - Системные объявления библиотеки
 */
export type AppNotificationSeverity = "critical" | "warning" | "info"

export type AppNotification = {
  /** Стабильный id для скрытия в localStorage */
  id: string
  severity: AppNotificationSeverity
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
}

const DISMISSED_STORAGE_KEY = "library.notifications.dismissed"

function pluralBook(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return "книг"
  if (mod10 === 1) return "книга"
  if (mod10 >= 2 && mod10 <= 4) return "книги"
  return "книг"
}

function pluralRent(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return "выдач"
  if (mod10 === 1) return "выдача"
  if (mod10 >= 2 && mod10 <= 4) return "выдачи"
  return "выдач"
}

type DismissedStore = Record<string, string[]>

function readStore(): DismissedStore {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(DISMISSED_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as DismissedStore
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export function getDismissedNotificationIds(userId: string): Set<string> {
  const store = readStore()
  return new Set(store[userId] ?? [])
}

export function dismissNotification(userId: string, notificationId: string): void {
  if (typeof window === "undefined") return
  const store = readStore()
  const prev = new Set(store[userId] ?? [])
  prev.add(notificationId)
  store[userId] = [...prev]
  window.localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(store))
}

export function buildReaderNotifications(data: LibraryBorrowedBooksResponse | null): AppNotification[] {
  if (!data?.summary) return []
  const { summary } = data
  const soonDays = summary.soonDays
  const out: AppNotification[] = []

  if (summary.overdue > 0) {
    out.push({
      id: "reader_overdue",
      severity: "critical",
      title: "Просроченный возврат",
      description: `У вас ${summary.overdue} ${pluralBook(summary.overdue)} с истёкшим сроком. Верните их в библиотеку или согласуйте продление.`,
      actionHref: "/my-books",
      actionLabel: "Мои книги",
    })
  }

  if (summary.dueSoon > 0) {
    out.push({
      id: "reader_due_soon",
      severity: "warning",
      title: "Скоро срок возврата",
      description: `${summary.dueSoon} ${pluralBook(summary.dueSoon)} нужно вернуть в ближайшие ${soonDays} дн. (настройка библиотеки).`,
      actionHref: "/my-books",
      actionLabel: "Мои книги",
    })
  }

  if (summary.outstandingTotalRub > 0) {
    out.push({
      id: "reader_fine",
      severity: "warning",
      title: "Штраф к оплате",
      description: `По текущим выдачам к доплате ${formatRub(summary.outstandingTotalRub)}. Оплата в библиотеке.`,
      actionHref: "/my-books",
      actionLabel: "Мои книги",
    })
  }

  return out
}

export function buildStaffCirculationNotifications(data: LibraryBorrowedBooksResponse | null): AppNotification[] {
  if (!data?.summary) return []
  const { summary } = data
  const soonDays = summary.soonDays
  const out: AppNotification[] = []

  if (summary.overdue > 0) {
    out.push({
      id: "staff_overdue",
      severity: "critical",
      title: "Просрочено по фонду",
      description: `Сейчас ${summary.overdue} ${pluralRent(summary.overdue)} с просрочкой по всем читателям.`,
      actionHref: "/admin/on-loan",
      actionLabel: "На руках",
    })
  }

  if (summary.dueSoon > 0) {
    out.push({
      id: "staff_due_soon",
      severity: "warning",
      title: "Скоро срок по фонду",
      description: `${summary.dueSoon} ${pluralRent(summary.dueSoon)} нужно вернуть в течение ${soonDays} дн.`,
      actionHref: "/admin/on-loan",
      actionLabel: "На руках",
    })
  }

  return out
}

export function buildStaffFinesNotification(data: LibraryFinesListResponse | null): AppNotification | null {
  if (!data?.summary) return null
  const { outstandingTotalRub } = data.summary
  if (outstandingTotalRub <= 0) return null
  return {
    id: "staff_fines",
    severity: "warning",
    title: "Задолженности по штрафам",
    description: `По журналу штрафов есть записи к доплате на сумму ${formatRub(outstandingTotalRub)}.`,
    actionHref: "/admin/fines",
    actionLabel: "Штрафы",
  }
}

export function filterVisibleNotifications(items: AppNotification[], dismissed: Set<string>): AppNotification[] {
  return items.filter((n) => !dismissed.has(n.id))
}
