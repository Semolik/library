import { ApiClient } from "@/client/api-client"
import type {
  LibraryAuthor,
  LibraryBook,
  LibraryBooksListFilters,
  LibraryBooksPage,
  LibraryCategory,
  LibraryCity,
  LibraryPublishingHouse,
} from "@/client/library-client"

export interface LibraryPopularBookSnippet {
  id: string
  title: string
  publicationYear: number
  pages: number
  isbn: string
  hasCover: boolean
  rentCount: number
}

export interface LibraryPopularByCategoryResponse {
  sections: Array<{
    category: { id: string; name: string }
    books: LibraryPopularBookSnippet[]
  }>
}

export interface LibraryBookAvailabilityRow {
  storageId: string
  storageName: string
  totalCopies: number
  availableCopies: number
}

export interface CoverUrlResponse {
  url: string
}

export interface LibraryAuthorAtPublisher {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  hasPhoto: boolean
  /** Книг этого издательства у автора */
  booksAtPublisher: number
}

const PREFIX = "/library/public"

class LibraryPublicClient extends ApiClient {
  async popularByCategory(limitPerCategory = 5) {
    const params = new URLSearchParams({ limitPerCategory: String(limitPerCategory) })
    return this.request<LibraryPopularByCategoryResponse>(`${PREFIX}/popular-by-category?${params}`, {
      method: "GET",
    })
  }

  async listCategories() {
    return this.request<LibraryCategory[]>(`${PREFIX}/categories`, { method: "GET" })
  }

  async listPublishingHouses(q?: string, limit?: number) {
    const params = new URLSearchParams()
    if (q?.trim()) params.set("q", q.trim())
    if (limit != null) params.set("limit", String(limit))
    const qs = params.toString()
    return this.request<LibraryPublishingHouse[]>(
      `${PREFIX}/publishing-houses${qs ? `?${qs}` : ""}`,
      { method: "GET" },
    )
  }

  async listCities() {
    return this.request<LibraryCity[]>(`${PREFIX}/cities`, { method: "GET" })
  }

  async listAuthors(q?: string, limit?: number) {
    const params = new URLSearchParams()
    if (q?.trim()) params.set("q", q.trim())
    if (limit != null) params.set("limit", String(limit))
    const qs = params.toString()
    return this.request<LibraryAuthor[]>(`${PREFIX}/authors${qs ? `?${qs}` : ""}`, { method: "GET" })
  }

  async getCategory(id: string) {
    return this.request<LibraryCategory>(`${PREFIX}/categories/${encodeURIComponent(id)}`, {
      method: "GET",
    })
  }

  async getPublishingHouse(id: string) {
    return this.request<LibraryPublishingHouse>(
      `${PREFIX}/publishing-houses/${encodeURIComponent(id)}`,
      { method: "GET" },
    )
  }

  async listAuthorsForPublishingHouse(houseId: string) {
    return this.request<LibraryAuthorAtPublisher[]>(
      `${PREFIX}/publishing-houses/${encodeURIComponent(houseId)}/authors`,
      { method: "GET" },
    )
  }

  async getAuthor(id: string) {
    return this.request<LibraryAuthor>(`${PREFIX}/authors/${encodeURIComponent(id)}`, {
      method: "GET",
    })
  }

  async getAuthorPhotoUrl(authorId: string) {
    return this.request<CoverUrlResponse>(
      `${PREFIX}/authors/${encodeURIComponent(authorId)}/photo-url`,
      { method: "GET" },
    )
  }

  async listBooks(
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
    return this.request<LibraryBooksPage>(`${PREFIX}/books${qs ? `?${qs}` : ""}`, { method: "GET" })
  }

  async getBook(id: string) {
    return this.request<LibraryBook>(`${PREFIX}/books/${encodeURIComponent(id)}`, { method: "GET" })
  }

  async getBookAvailability(id: string) {
    return this.request<LibraryBookAvailabilityRow[]>(
      `${PREFIX}/books/${encodeURIComponent(id)}/availability`,
      { method: "GET" },
    )
  }

  async getCoverUrl(bookId: string) {
    return this.request<CoverUrlResponse>(`${PREFIX}/books/${encodeURIComponent(bookId)}/cover-url`, {
      method: "GET",
    })
  }
}

export const libraryPublicClient = new LibraryPublicClient()
