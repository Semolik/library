import { AppShell } from "@/components/app-shell"
import { ProtectedContent } from "@/components/protected-content"

export default function CatalogPage() {
  return (
    <AppShell>
      <ProtectedContent title="Каталог">Раздел каталога пока пуст.</ProtectedContent>
    </AppShell>
  )
}
