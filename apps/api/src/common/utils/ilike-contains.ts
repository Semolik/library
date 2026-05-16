/** Безопасная подстрока для PostgreSQL ILIKE ... ESCAPE '\\'. */
export function ilikeContainsPattern(raw: string): string {
  const escaped = raw
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
  return `%${escaped}%`;
}
