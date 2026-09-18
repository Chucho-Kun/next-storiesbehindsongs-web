export function slugify(value: string): string {
  return value.toLowerCase().replace(/'/g, "").replace(/\s+/g, "-");
}

export function splitTitle(titulo: string): { title: string; subtitle: string | null } {
  const [title, ...rest] = titulo.split("|");
  const subtitle = rest.join("|").trim();
  return { title: title.trim(), subtitle: subtitle.length > 0 ? subtitle : null };
}
