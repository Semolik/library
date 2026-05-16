import { redirect } from "next/navigation"

type Props = { params: Promise<{ id: string }> }

/** Книги раздела — единый каталог с фильтрами (`/browse`). */
export default async function CategoryDetailPage({ params }: Props) {
  const { id } = await params
  const clean = typeof id === "string" ? id.trim() : ""
  if (!clean) redirect("/categories")
  redirect(`/browse?categoryId=${encodeURIComponent(clean)}`)
}
