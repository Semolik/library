import { AppShell } from "@/components/app-shell"
import { ProtectedContent } from "@/components/protected-content"

export default function GenresPage() {
  return (
    <AppShell>
      <ProtectedContent title="Жанры">Раздел жанров пока пуст.</ProtectedContent>
    </AppShell>
  )
}
