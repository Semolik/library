"use client"

import { AdminLibraryNameCrud } from "@/components/admin-library-name-crud"
import { libraryClient } from "@/client/library-client"

export default function AdminStoragesPage() {
  return (
    <AdminLibraryNameCrud
      title="Залы хранения"
      countColumnHeader="Экз."
      nounGenitive="зала"
      searchPlaceholder="По названию зала…"
      placeholder="Например: Читальный зал №1"
      requireCatalogAdmin
      loadItems={(t) => libraryClient.listStorages(t)}
      createItem={(t, name) => libraryClient.createStorage(name, t)}
      updateItem={(t, id, name) => libraryClient.updateStorage(id, name, t)}
      deleteItem={(t, id) => libraryClient.deleteStorage(id, t)}
    />
  )
}
