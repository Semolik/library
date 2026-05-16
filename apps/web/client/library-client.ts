import { ApiClient } from "@/client/api-client"

export interface LibraryCategory {
  id: string
  name: string
  /** Число книг в категории (из списков API). */
  bookCount?: number
}

export interface LibraryPublishingHouse {
  id: string
  name: string
  bookCount?: number
}

export interface LibraryCity {
  id: string
  name: string
  bookCount?: number
}

export interface LibraryAuthor {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  /** Связей с книгами (участие в составе авторов). */
  bookCount?: number
  /** Портрет в MinIO (публичный URL через /photo-url). */
  hasPhoto?: boolean
}

export interface LibraryBook {
  id: string
  /** Плоские FK; при ответе API иногда приходят только вложенные category / publishingHouse / city. */
  categoryId?: string
  publishingHouseId?: string
  cityId?: string
  title: string
  publicationYear: number
  pages: number
  isbn: string
  hasCover: boolean
  /** Аннотация или описание (только в полной карточке GET …/books/:id). */
  description?: string | null
  category?: LibraryCategory
  publishingHouse?: LibraryPublishingHouse
  city?: LibraryCity
  bookAuthors?: Array<{ authorId: string; author: LibraryAuthor }>
  /** Счётчик экземпляров (из списка книг). */
  copyCount?: number
}

export interface LibraryBooksPage {
  items: LibraryBook[]
  total: number
  page: number
  limit: number
}

/** Краткое описание книги в ответе избранного (см. LibraryFavoritesService). */
export interface LibraryFavoriteBookBrief {
  id: string
  title: string
  publicationYear: number
  pages: number
  isbn: string
  hasCover: boolean
  category?: { id: string; name: string }
  publishingHouse?: { id: string; name: string }
  city?: { id: string; name: string }
  authors?: Pick<LibraryAuthor, "id" | "firstName" | "lastName" | "middleName" | "hasPhoto">[]
}

export interface LibraryFavoriteRow {
  favoriteId: string
  bookId: string
  addedAt: string
  book: LibraryFavoriteBookBrief | null
}

export interface LibraryBooksListFilters {
  categoryId?: string
  publishingHouseId?: string
  cityId?: string
  authorId?: string
  /** Обложка загружена или нет */
  hasCover?: boolean
}

export interface LibraryStorage {
  id: string
  name: string
  /** Число экземпляров в зале (из списка API). */
  bookCount?: number
}

export interface LibraryBookCopyActiveRentUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

/** Текущая выдача (нет записи о возврате). */
export interface LibraryBookCopyActiveRent {
  rentId: string
  rentedAt: string
  /** Планируемая дата возврата (YYYY-MM-DD), если задана. */
  dueDate?: string | null
  user: LibraryBookCopyActiveRentUser
}

/** Книга в ответе списка экземпляров — расширенное описание для каталога на месте. */
export interface LibraryBookCopyBookSummary extends Pick<
  LibraryBook,
  "id" | "title" | "publicationYear" | "pages" | "isbn" | "hasCover"
> {
  category?: Pick<LibraryCategory, "id" | "name">
  publishingHouse?: Pick<LibraryPublishingHouse, "id" | "name">
  city?: Pick<LibraryCity, "id" | "name">
  authors?: Pick<LibraryAuthor, "id" | "firstName" | "lastName" | "middleName" | "hasPhoto">[]
}

export interface LibraryBookCopy {
  id: string
  bookId: string
  storageId: string
  inventoryNumber: string
  book?: LibraryBookCopyBookSummary | Pick<LibraryBook, "id" | "title">
  storage?: LibraryStorage
  /** Активная аренда; при создании экземпляра через API может отсутствовать до следующего списка. */
  activeRent?: LibraryBookCopyActiveRent | null
}

export interface LibraryBookCopiesImportResult {
  created: number
  /** Пропуски: дубликат инв. номера в БД или повтор в файле после успешного импорта. */
  skipped: Array<{ row: number; message: string }>
  errors: Array<{ row: number; message: string }>
}

export interface LibraryRent {
  id: string
  copyId: string
  userId: string
  rentedAt: string
  /** Планируемая дата возврата YYYY-MM-DD. */
  dueDate?: string | null
}

export interface LibrarySettings {
  defaultLoanDays: number
  /** Рублей за каждый день просрочки после льготного периода. */
  finePerOverdueDay: number
  /** Дней после срока без штрафа. */
  fineGraceDays: number
}

export type LibraryBorrowUrgency = "overdue" | "due_soon" | "ok" | "no_due_date"

export interface LibraryBorrowedBookRow {
  rentId: string
  copyId: string
  bookId: string
  bookTitle: string
  inventoryNumber: string
  storageName: string
  userId: string
  userEmail: string
  userFirstName: string | null
  userLastName: string | null
  rentedAt: string
  dueDate: string | null
  daysUntilDue: number | null
  urgency: LibraryBorrowUrgency
  accruedFineAmount: number
  paidFineAmount: number
  outstandingFineAmount: number
}

export interface LibraryBorrowedBooksResponse {
  items: LibraryBorrowedBookRow[]
  summary: {
    total: number
    overdue: number
    dueSoon: number
    ok: number
    noDueDate: number
    soonDays: number
    outstandingTotalRub: number
  }
}

export interface LibraryFineLedgerRow {
  rentId: string
  copyId: string
  bookId: string
  bookTitle: string
  inventoryNumber: string
  storageName: string
  userId: string
  userEmail: string
  userFirstName: string | null
  userLastName: string | null
  rentedAt: string
  dueDate: string | null
  returnedAt: string | null
  isActive: boolean
  accruedFineAmount: number
  paidFineAmount: number
  outstandingFineAmount: number
  paidAt: string | null
  accruedFineUpdatedAt: string | null
}

export interface LibraryFinesListResponse {
  items: LibraryFineLedgerRow[]
  summary: {
    count: number
    outstandingTotalRub: number
    accruedTotalRub: number
    paidTotalRub: number
  }
}

export type LibraryRentFineSnapshot = LibraryFineLedgerRow

export interface LibraryReturn {
  rentId: string
  returnedAt: string
}

export interface LibraryFinePayment {
  rentId: string
  /** Сумма этой операции. */
  paidAmountThisTransaction: number
  paidTotal: number
  outstandingAfter: number
  accruedFineAmount: number
  paidAt: string
}

export interface UploadCoverResponse {
  objectName: string
  url: string
}

export interface CoverUrlResponse {
  url: string
}

function authHeaders(token?: string | null): HeadersInit | undefined {
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

class LibraryClient extends ApiClient {
  async listCategories(token?: string | null) {
    return this.request<LibraryCategory[]>("/library/categories", {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async createCategory(name: string, token?: string | null) {
    return this.request<LibraryCategory>("/library/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ name }),
    })
  }

  async updateCategory(id: string, name: string, token?: string | null) {
    return this.request<LibraryCategory>(`/library/categories/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ name }),
    })
  }

  async deleteCategory(id: string, token?: string | null) {
    await this.request<void>(`/library/categories/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    })
  }

  async listPublishingHouses(token?: string | null) {
    return this.request<LibraryPublishingHouse[]>("/library/publishing-houses", {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async createPublishingHouse(name: string, token?: string | null) {
    return this.request<LibraryPublishingHouse>("/library/publishing-houses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ name }),
    })
  }

  async updatePublishingHouse(id: string, name: string, token?: string | null) {
    return this.request<LibraryPublishingHouse>(`/library/publishing-houses/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ name }),
    })
  }

  async deletePublishingHouse(id: string, token?: string | null) {
    await this.request<void>(`/library/publishing-houses/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    })
  }

  async listCities(token?: string | null) {
    return this.request<LibraryCity[]>("/library/cities", {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async createCity(name: string, token?: string | null) {
    return this.request<LibraryCity>("/library/cities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ name }),
    })
  }

  async updateCity(id: string, name: string, token?: string | null) {
    return this.request<LibraryCity>(`/library/cities/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ name }),
    })
  }

  async deleteCity(id: string, token?: string | null) {
    await this.request<void>(`/library/cities/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    })
  }

  async listAuthors(token?: string | null) {
    return this.request<LibraryAuthor[]>("/library/authors", {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async createAuthor(input: Pick<LibraryAuthor, "firstName" | "lastName" | "middleName">, token?: string | null) {
    return this.request<LibraryAuthor>("/library/authors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(input),
    })
  }

  async updateAuthor(
    id: string,
    input: Pick<LibraryAuthor, "firstName" | "lastName" | "middleName">,
    token?: string | null,
  ) {
    return this.request<LibraryAuthor>(`/library/authors/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(input),
    })
  }

  async deleteAuthor(id: string, token?: string | null) {
    await this.request<void>(`/library/authors/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    })
  }

  async listBooks(
    token?: string | null,
    search?: string,
    pagination?: { page?: number; limit?: number },
    filters?: LibraryBooksListFilters,
  ) {
    const params = new URLSearchParams()
    if (search?.trim()) params.set("q", search.trim())
    if (pagination?.page != null) params.set("page", String(pagination.page))
    if (pagination?.limit != null) params.set("limit", String(pagination.limit))
    if (filters?.categoryId) params.set("categoryId", filters.categoryId)
    if (filters?.publishingHouseId) params.set("publishingHouseId", filters.publishingHouseId)
    if (filters?.cityId) params.set("cityId", filters.cityId)
    if (filters?.authorId) params.set("authorId", filters.authorId)
    if (filters?.hasCover === true) params.set("hasCover", "true")
    if (filters?.hasCover === false) params.set("hasCover", "false")
    const qs = params.toString()
    return this.request<LibraryBooksPage>(`/library/books${qs ? `?${qs}` : ""}`, {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async createBook(
    input: {
      categoryId: string
      publishingHouseId: string
      cityId: string
      title: string
      publicationYear: number
      pages: number
      isbn: string
      description?: string | null
      authorIds: string[]
    },
    token?: string | null,
  ) {
    return this.request<LibraryBook>("/library/books", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(input),
    })
  }

  async getBook(id: string, token?: string | null) {
    return this.request<LibraryBook>(`/library/books/${id}`, {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async updateBook(
    id: string,
    input: {
      categoryId?: string
      publishingHouseId?: string
      cityId?: string
      title?: string
      publicationYear?: number
      pages?: number
      isbn?: string
      description?: string | null
      authorIds?: string[]
    },
    token?: string | null,
  ) {
    return this.request<LibraryBook>(`/library/books/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(input),
    })
  }

  async deleteBook(id: string, token?: string | null) {
    await this.request<void>(`/library/books/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    })
  }

  async createStorage(name: string, token?: string | null) {
    return this.request<LibraryStorage>("/library/storage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ name }),
    })
  }

  async listStorages(token?: string | null) {
    return this.request<LibraryStorage[]>("/library/storage", {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async updateStorage(id: string, name: string, token?: string | null) {
    return this.request<LibraryStorage>(`/library/storage/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ name }),
    })
  }

  async deleteStorage(id: string, token?: string | null) {
    await this.request<void>(`/library/storage/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    })
  }

  async listBookCopies(token?: string | null) {
    return this.request<LibraryBookCopy[]>("/library/book-copies", {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async getLibrarySettings(token?: string | null) {
    return this.request<LibrarySettings>("/library/settings", {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async updateLibrarySettings(
    body: Partial<
      Pick<LibrarySettings, "defaultLoanDays" | "finePerOverdueDay" | "fineGraceDays">
    >,
    token?: string | null,
  ) {
    return this.request<LibrarySettings>("/library/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(body),
    })
  }

  async listBorrowedBooks(
    token?: string | null,
    opts?: { userId?: string; soonDays?: number },
  ) {
    const params = new URLSearchParams()
    if (opts?.userId?.trim()) params.set("userId", opts.userId.trim())
    if (opts?.soonDays !== undefined) params.set("soonDays", String(opts.soonDays))
    const q = params.toString()
    const path = q ? `/library/borrowed?${q}` : "/library/borrowed"
    return this.request<LibraryBorrowedBooksResponse>(path, {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async listMyRentHistory(token?: string | null) {
    return this.request<{ items: LibraryFineLedgerRow[] }>("/library/my-rents/history", {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async listFines(token?: string | null) {
    return this.request<LibraryFinesListResponse>("/library/fines", {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async getRentFineSnapshot(rentId: string, token?: string | null) {
    return this.request<LibraryRentFineSnapshot>(`/library/rents/${encodeURIComponent(rentId)}`, {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async createBookCopy(
    input: Pick<LibraryBookCopy, "bookId" | "storageId" | "inventoryNumber">,
    token?: string | null,
  ) {
    return this.request<LibraryBookCopy>("/library/book-copies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(input),
    })
  }

  async updateBookCopy(
    id: string,
    input: Pick<LibraryBookCopy, "storageId" | "inventoryNumber">,
    token?: string | null,
  ) {
    return this.request<LibraryBookCopy>(`/library/book-copies/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(input),
    })
  }

  async deleteBookCopy(id: string, token?: string | null) {
    await this.request<void>(`/library/book-copies/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders(token),
    })
  }

  async importBookCopies(rows: Record<string, unknown>[], token?: string | null) {
    return this.request<LibraryBookCopiesImportResult>("/library/book-copies/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ rows }),
    })
  }

  async createRent(
    input: Pick<LibraryRent, "copyId" | "userId"> & { dueDate?: string | null },
    token?: string | null,
  ) {
    return this.request<LibraryRent>("/library/rents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(input),
    })
  }

  async returnRent(rentId: string, token?: string | null) {
    return this.request<LibraryReturn>(`/library/rents/${rentId}/return`, {
      method: "POST",
      headers: authHeaders(token),
    })
  }

  async payFine(rentId: string, fineAmount: number, token?: string | null) {
    return this.request<LibraryFinePayment>(`/library/rents/${rentId}/fine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ fineAmount }),
    })
  }

  async uploadCover(bookId: string, file: File, token?: string | null) {
    const formData = new FormData()
    formData.append("file", file)

    return this.request<UploadCoverResponse>(`/library/books/${bookId}/cover`, {
      method: "POST",
      body: formData,
      headers: authHeaders(token),
    })
  }

  async getCoverUrl(bookId: string, token?: string | null) {
    return this.request<CoverUrlResponse>(`/library/books/${bookId}/cover-url`, {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async getAuthorPhotoUrl(authorId: string, token?: string | null) {
    return this.request<CoverUrlResponse>(`/library/authors/${encodeURIComponent(authorId)}/photo-url`, {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async uploadAuthorPhoto(authorId: string, file: File, token?: string | null) {
    const formData = new FormData()
    formData.append("file", file)

    return this.request<UploadCoverResponse>(`/library/authors/${encodeURIComponent(authorId)}/photo`, {
      method: "POST",
      body: formData,
      headers: authHeaders(token),
    })
  }

  async listFavorites(
    token?: string | null,
    pagination?: { page?: number; limit?: number },
  ) {
    const params = new URLSearchParams()
    if (pagination?.page != null) params.set("page", String(pagination.page))
    if (pagination?.limit != null) params.set("limit", String(pagination.limit))
    const q = params.toString()
    return this.request<{
      items: LibraryFavoriteRow[]
      total: number
      page: number
      limit: number
    }>(`/library/favorites${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: authHeaders(token),
    })
  }

  async isBookFavorited(bookId: string, token?: string | null) {
    return this.request<{ favorited: boolean }>(
      `/library/favorites/check/${encodeURIComponent(bookId)}`,
      {
        method: "GET",
        headers: authHeaders(token),
      },
    )
  }

  async addBookFavorite(bookId: string, token?: string | null) {
    return this.request<{ bookId: string; favorited: true }>("/library/favorites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ bookId }),
    })
  }

  async removeBookFavorite(bookId: string, token?: string | null) {
    await this.request<void>(`/library/favorites/${encodeURIComponent(bookId)}`, {
      method: "DELETE",
      headers: authHeaders(token),
    })
  }
}

export const libraryClient = new LibraryClient()
