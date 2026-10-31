export function omitFields<T extends object>(record: T, fields: readonly string[]): T {
  return Object.fromEntries(
    Object.entries(record).filter(([field]) => !fields.includes(field)),
  ) as T;
}
