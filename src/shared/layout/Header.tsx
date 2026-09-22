import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-black text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link href="/" className="shrink-0" aria-label="Stories Behind Songs — home">
          <Image src="/brand/logo.svg" alt="Stories Behind Songs" width={44} height={44} priority />
        </Link>

        <form action="/search" method="GET" role="search" className="flex w-full max-w-sm">
          <input
            type="search"
            name="q"
            placeholder="Search by song or band"
            aria-label="Search by song or band"
            className="w-full rounded-l-sm border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-title"
          />
          <button
            type="submit"
            className="shrink-0 rounded-r-sm bg-title px-4 py-2 text-sm font-semibold text-white"
          >
            Search
          </button>
        </form>
      </div>
    </header>
  );
}
