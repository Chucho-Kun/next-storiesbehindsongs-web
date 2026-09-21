import Link from "next/link";
import type { ReactNode } from "react";

export function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-block bg-title px-6 py-2 text-sm font-bold uppercase tracking-wide text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
    >
      {children}
    </Link>
  );
}
