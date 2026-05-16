"use client"

import { AdminLibraryNameCrud } from "@/components/admin-library-name-crud"
import { libraryClient } from "@/client/library-client"

export default function AdminCategoriesPage() {
  return (
    <AdminLibraryNameCrud
      title="Категории"
      nounGenitive="категории"
      placeholder="Название категории"
      requireCatalogAdmin
      loadItems={(t) => libraryClient.listCategories(t)}
      createItem={(t, name) => libraryClient.createCategory(name, t)}
      updateItem={(t, id, name) => libraryClient.updateCategory(id, name, t)}
      deleteItem={(t, id) => libraryClient.deleteCategory(id, t)}
    />
  )
}
