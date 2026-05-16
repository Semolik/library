/**
 * Ссылка на страницу каталога /browse с предвыбранными фильтрами (читает app/browse/page.tsx).
 * Только categoryId без остальных параметров с главной / перенаправляют на /categories/:id.
 */
export function catalogHomeWithFilters(
  filters: Partial<{
    categoryId: string
    publishingHouseId: string
    cityId: string
    authorId: string
  }>,
): string {
  const p = new URLSearchParams()
  if (filters.categoryId?.trim()) p.set("categoryId", filters.categoryId.trim())
  if (filters.publishingHouseId?.trim()) p.set("publishingHouseId", filters.publishingHouseId.trim())
  if (filters.cityId?.trim()) p.set("cityId", filters.cityId.trim())
  if (filters.authorId?.trim()) p.set("authorId", filters.authorId.trim())
  const qs = p.toString()
  return qs ? `/browse?${qs}` : "/browse"
}
