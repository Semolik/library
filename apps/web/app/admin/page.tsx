import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { AdminSectionGuard } from "@/components/admin-section-guard"

export default function AdminPage() {
  const sections = [
    { href: "/admin/categories", label: "Категории" },
    { href: "/admin/publishing-houses", label: "Издательства" },
    { href: "/admin/cities", label: "Города" },
    { href: "/admin/storages", label: "Залы хранения" },
    { href: "/admin/authors", label: "Авторы" },
    { href: "/admin/books", label: "Книги" },
    { href: "/admin/book-copies", label: "Экземпляры" },
    { href: "/admin/rentals", label: "Выдачи и возвраты" },
  ]

  return (
    <AdminSectionGuard title="Админка" description="Разделы управления библиотекой">
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <Button key={section.href} asChild variant="outline" className="justify-start">
            <Link href={section.href}>{section.label}</Link>
          </Button>
        ))}
      </div>
    </AdminSectionGuard>
  )
}
