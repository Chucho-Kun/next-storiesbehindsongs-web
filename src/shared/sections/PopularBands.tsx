import Image from "next/image";
import { getBands } from "@/db/queries";

export async function PopularBands() {
  const bands = await getBands(8, 0);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <h2 className="mb-4 text-2xl font-bold text-title">Bands More Popular</h2>
      <ul className="flex flex-wrap items-center gap-6">
        {bands.map((band) => (
          <li key={band.slug} className="relative h-16 w-32 bg-white p-2">
            <Image
              src={band.logoPath}
              alt={band.name}
              fill
              sizes="128px"
              className="object-contain"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
