import { ApiClient } from "@/client/api-client"

export interface LibraryCategory {
  id: string
  name: string
}

export interface LibraryPublishingHouse {
  id: string
  name: string
}

export interface LibraryCity {
  id: string
  name: string
}

export interface LibraryAuthor {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
}

export interface LibraryBook {
  id: string
  categoryId: string
  publishingHouseId: string
  cityId: string
  title: string
  publicationYear: number
  pages: number
  isbn: string
  hasCover: boolean
  category?: LibraryCategory
  publishingHouse?: LibraryPublishingHouse
  city?: LibraryCity
  bookAuthors?: Array<{ authorId: string; author: LibraryAuthor }>
}

export interface LibraryStorage {
  id: string
  name: string
}

export interface LibraryBookCopy {
  id: string
  bookId: string
  storageId: string
  inventoryNumber: string
}

export interface LibraryRent {
  id: string
  copyId: string
  userId: string
  rentedAt: string
}

export interface LibraryReturn {
  rentId: string
  returnedAt: string
}

export interface LibraryFinePayment {
  rentId: string
  fineAmount: number
  paidAt: string
}

export interface UploadCoverResponse {
  objectName: string
  url: string
}

export interface CoverUrlResponse {
  url: string
}

class LibraryClient extends ApiClient {
  async createCategory(name: string) {
    return this.request<LibraryCategory>("/library/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
  }

  async createPublishingHouse(name: string) {
    return this.request<LibraryPublishingHouse>("/library/publishing-houses", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
  }

  async createCity(name: string) {
    return this.request<LibraryCity>("/library/cities", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
  }

  async createAuthor(input: Pick<LibraryAuthor, "firstName" | "lastName" | "middleName">) {
    return this.request<LibraryAuthor>("/library/authors", {
      method: "POST",
      body: JSON.stringify(input),
    })
  }

  async createBook(input: {
    categoryId: string
    publishingHouseId: string
    cityId: string
    title: string
    publicationYear: number
    pages: number
    isbn: string
    authorIds: string[]
  }) {
    return this.request<LibraryBook>("/library/books", {
      method: "POST",
      body: JSON.stringify(input),
    })
  }

  async getBook(id: string) {
    return this.request<LibraryBook>(`/library/books/${id}`, {
      method: "GET",
    })
  }

  async createStorage(name: string) {
    return this.request<LibraryStorage>("/library/storage", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
  }

  async createBookCopy(input: Pick<LibraryBookCopy, "bookId" | "storageId" | "inventoryNumber">) {
    return this.request<LibraryBookCopy>("/library/book-copies", {
      method: "POST",
      body: JSON.stringify(input),
    })
  }

  async createRent(input: Pick<LibraryRent, "copyId" | "userId">) {
    return this.request<LibraryRent>("/library/rents", {
      method: "POST",
      body: JSON.stringify(input),
    })
  }

  async returnRent(rentId: string) {
    return this.request<LibraryReturn>(`/library/rents/${rentId}/return`, {
      method: "POST",
    })
  }

  async payFine(rentId: string, fineAmount: number) {
    return this.request<LibraryFinePayment>(`/library/rents/${rentId}/fine`, {
      method: "POST",
      body: JSON.stringify({ fineAmount }),
    })
  }

  async uploadCover(bookId: string, file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return this.request<UploadCoverResponse>(`/library/books/${bookId}/cover`, {
      method: "POST",
      body: formData,
    })
  }

  async getCoverUrl(bookId: string) {
    return this.request<CoverUrlResponse>(`/library/books/${bookId}/cover-url`, {
      method: "GET",
    })
  }
}

export const libraryClient = new LibraryClient()
