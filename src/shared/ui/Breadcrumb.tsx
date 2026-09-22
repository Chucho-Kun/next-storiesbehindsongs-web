import Link from "next/link";

export type BreadcrumbItem = { label: string; href?: string; noTranslate?: boolean };

const VARIANT_CLASSES = {
  light: { separator: "text-neutral-500", link: "text-neutral-700", current: "text-neutral-900" },
  dark: { separator: "text-neutral-500", link: "text-neutral-300", current: "text-white" },
} as const;

export function Breadcrumb({
  items,
  variant = "light",
}: {
  items: BreadcrumbItem[];
  variant?: keyof typeof VARIANT_CLASSES;
}) {
  const classes = VARIANT_CLASSES[variant];

  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const translate = item.noTranslate ? "no" : undefined;
          const skip = item.noTranslate ? "notranslate " : "";

          return (
            <li key={`${index}-${item.label}`} className="flex items-center gap-x-2">
              {index > 0 && (
                <span aria-hidden="true" className={classes.separator}>
                  ›
                </span>
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  translate={translate}
                  className={`${skip}${classes.link} hover:underline`}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current="page"
                  translate={translate}
                  className={`${skip}font-semibold ${classes.current}`}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
