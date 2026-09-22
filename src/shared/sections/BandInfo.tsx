import Image from "next/image";
import type { BandDetail } from "@/db/queries";

export function BandInfo({ band }: { band: BandDetail }) {
  const paragraphs = band.description.split("\n\n").filter((paragraph) => paragraph.length > 0);
  // `location` is "City, Country"; the country doubles as the flag's alt text.
  const country = band.location.split(",").pop()?.trim() ?? "";

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative h-24 w-48 shrink-0 bg-white p-3">
          <Image
            src={band.logoPath}
            alt={`${band.name} logo`}
            fill
            sizes="192px"
            priority
            translate="no"
            className="notranslate object-contain p-3"
          />
        </div>

        <div className="min-w-0 space-y-4">
          <h1 translate="no" className="notranslate text-3xl font-bold text-title sm:text-4xl">{band.name}</h1>

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            {band.location && (
              <li className="flex items-center gap-2">
                {band.countryCode && (
                  <Image
                    src={`/flags/${band.countryCode}.svg`}
                    alt={country}
                    title={country}
                    width={30}
                    height={20}
                    unoptimized
                    className="h-5 w-[30px] rounded-sm object-cover"
                  />
                )}
                <span>{band.location}</span>
              </li>
            )}
            {band.founded && <li>Founded {band.founded}</li>}
            {band.genre && (
              <li className="rounded bg-neutral-800 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                {band.genre}
              </li>
            )}
          </ul>

          {paragraphs.length > 0 && (
            <div className="space-y-4 leading-relaxed text-neutral-700">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
