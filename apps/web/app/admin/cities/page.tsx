"use client"

import { AdminLibraryNameCrud } from "@/components/admin-library-name-crud"
import { libraryClient } from "@/client/library-client"

export default function AdminCitiesPage() {
  return (
    <AdminLibraryNameCrud
      title="Города"
      nounGenitive="города"
      placeholder="Название города"
      requireCatalogAdmin
      loadItems={(t) => libraryClient.listCities(t)}
      createItem={(t, name) => libraryClient.createCity(name, t)}
      updateItem={(t, id, name) => libraryClient.updateCity(id, name, t)}
      deleteItem={(t, id) => libraryClient.deleteCity(id, t)}
    />
  )
}
