import * as XLSX from "xlsx"
import type { LibraryBookCopy } from "@/client/library-client"

/** Строка импорта: поля как в экспорте плюс необязательные bookId / storageId (UUID) для старых файлов. */
export type BookCopyImportPayload = Record<string, unknown>

function authorsFromBook(book: LibraryBookCopy["book"]): string {
  if (!book || !("authors" in book) || !book.authors?.length) return ""
  return book.authors
    .map((a) => [a.lastName, a.firstName, a.middleName].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(", ")
}

/** Экспорт только человекочитаемых полей (без UUID) — для сверки с каталогом и импорта обратно. */
export function bookCopiesToExportRows(
  copies: LibraryBookCopy[],
): Record<string, string | number | undefined>[] {
  return copies.map((c) => ({
    inventoryNumber: c.inventoryNumber,
    storageName: c.storage?.name ?? "",
    bookTitle: c.book && "title" in c.book ? c.book.title : "",
    isbn: c.book && "isbn" in c.book ? c.book.isbn : "",
    year: c.book && "publicationYear" in c.book ? c.book.publicationYear : "",
    authors: authorsFromBook(c.book),
  }))
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadBookCopiesCsv(copies: LibraryBookCopy[], filename = "book-copies.csv") {
  const rows = bookCopiesToExportRows(copies)
  const ws = XLSX.utils.json_to_sheet(rows)
  const csv = XLSX.utils.sheet_to_csv(ws, { FS: ",", RS: "\r\n" })
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
  downloadBlob(blob, filename)
}

export function downloadBookCopiesXlsx(copies: LibraryBookCopy[], filename = "book-copies.xlsx") {
  const rows = bookCopiesToExportRows(copies)
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Экземпляры")
  XLSX.writeFile(wb, filename)
}

function normalizeHeaderKey(key: string): string {
  return key
    .replace(/^\ufeff/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "")
}

function cellToTrimmedString(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }
  return String(value).trim()
}

function cellToYear(value: unknown): number | null {
  if (value == null || value === "") return null
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value)
  }
  const n = parseInt(String(value).trim(), 10)
  return Number.isFinite(n) ? n : null
}

function normalizeIsbnKey(isbn: string): string {
  return isbn.toLowerCase().replace(/[^0-9x]/g, "")
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function rawRowToPayload(row: Record<string, unknown>): BookCopyImportPayload {
  const out: BookCopyImportPayload = {}
  for (const [keyFull, val] of Object.entries(row)) {
    const nk = normalizeHeaderKey(keyFull)
    if (nk === "inventorynumber" || nk === "inv") {
      if (val !== "" && val != null) out.inventoryNumber = val
    } else if (nk === "storagename" || nk === "зал") {
      if (val !== "" && val != null) out.storageName = val
    } else if (nk === "booktitle" || nk === "title" || nk === "название") {
      if (val !== "" && val != null) out.bookTitle = val
    } else if (nk === "isbn") {
      if (val !== "" && val != null) out.isbn = val
    } else if (nk === "year" || nk === "publicationyear" || nk === "год") {
      if (val !== "" && val != null) out.publicationYear = val
    } else if (nk === "bookid") {
      if (val !== "" && val != null) out.bookId = val
    } else if (nk === "storageid") {
      if (val !== "" && val != null) out.storageId = val
    }
  }
  return out
}

function rowImportStatus(payload: BookCopyImportPayload): "ok" | "empty" | "partial" {
  const inv = cellToTrimmedString(payload.inventoryNumber)
  const st = cellToTrimmedString(payload.storageName)
  const sid = cellToTrimmedString(payload.storageId)
  const isbn = cellToTrimmedString(payload.isbn)
  const title = cellToTrimmedString(payload.bookTitle)
  const year = cellToYear(payload.publicationYear)
  const bid = cellToTrimmedString(payload.bookId)

  const onlySeparators =
    !inv && !st && !sid && !isbn && !title && year == null && !bid
  if (onlySeparators) return "empty"

  const hasStorage = !!st || !!sid
  const hasBook =
    (!!bid && UUID_RE.test(bid)) ||
    normalizeIsbnKey(isbn).length > 0 ||
    (!!title && year != null)

  if (inv && hasStorage && hasBook) return "ok"
  return "partial"
}

export async function parseBookCopiesImportFile(file: File): Promise<{
  rows: BookCopyImportPayload[]
  incompleteSkipped: number
}> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: "array", cellDates: false })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return { rows: [], incompleteSkipped: 0 }
  const sheet = wb.Sheets[sheetName]
  if (!sheet) return { rows: [], incompleteSkipped: 0 }
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true,
  })
  const rows: BookCopyImportPayload[] = []
  let incompleteSkipped = 0
  for (const rec of raw) {
    const payload = rawRowToPayload(rec)
    const st = rowImportStatus(payload)
    if (st === "ok") rows.push(payload)
    else if (st === "partial") incompleteSkipped++
  }
  return { rows, incompleteSkipped }
}
