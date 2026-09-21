import Link from "next/link";

const VARIANT_CLASSES = {
  dark: "border-neutral-700 text-foreground hover:border-title hover:text-title",
  light: "border-neutral-400 text-neutral-800 hover:border-title hover:text-title",
} as const;

export function TagPill({
  tag,
  count,
  variant = "dark",
}: {
  tag: { slug: string; name: string };
  count?: number;
  variant?: keyof typeof VARIANT_CLASSES;
}) {
  return (
    <Link
      href={`/tags/${tag.slug}/`}
      className={`inline-block rounded-full border px-3 py-1 text-sm transition-colors ${VARIANT_CLASSES[variant]}`}
    >
      {tag.name}
      {count !== undefined && <span className="ml-1 text-muted">({count})</span>}
    </Link>
  );
}
