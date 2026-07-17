/** Pluralización simple es: plural(1, 'entreno', 'entrenos') → '1 entreno'. */
export function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Igual que plural pero con el número formateado en es-AR (separador de miles). */
export function pluralLocale(n: number, singular: string, plural: string): string {
  return `${n.toLocaleString('es-AR')} ${n === 1 ? singular : plural}`;
}
