import { AppShell } from "@/components/app-shell"
import { ProtectedContent } from "@/components/protected-content"

export default function HistoryPage() {
  return (
    <AppShell>
      <ProtectedContent title="История">Раздел истории пока пуст.</ProtectedContent>
    </AppShell>
  )
}
