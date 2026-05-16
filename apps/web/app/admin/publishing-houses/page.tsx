"use client"

import { AdminLibraryNameCrud } from "@/components/admin-library-name-crud"
import { libraryClient } from "@/client/library-client"

export default function AdminPublishingHousesPage() {
  return (
    <AdminLibraryNameCrud
      title="Издательства"
      nounGenitive="издательства"
      placeholder="Название издательства"
      requireCatalogAdmin
      loadItems={(t) => libraryClient.listPublishingHouses(t)}
      createItem={(t, name) => libraryClient.createPublishingHouse(name, t)}
      updateItem={(t, id, name) => libraryClient.updatePublishingHouse(id, name, t)}
      deleteItem={(t, id) => libraryClient.deletePublishingHouse(id, t)}
    />
  )
}
