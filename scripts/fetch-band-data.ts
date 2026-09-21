import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { albums, bands } from "../src/db/schema";
import { slugify } from "./slug";

const API = "https://storiesbehindsongs.com/code/public";
// Public key the legacy site ships in its own client-side JS.
const API_KEY = "57530624";
const MAX_ATTEMPTS = 3;

/** The API returns city and country in Spanish; the front is English-only.
 * Fixed maps for the current bands: a missing entry fails loudly instead of
 * storing Spanish text. */
const CITIES_ES_EN: Record<string, string> = {
  Londres: "London",
  Liverpool: "Liverpool",
  Indiana: "Indiana",
  "Los Ángeles": "Los Angeles",
  Seattle: "Seattle",
  Washington: "Washington",
};

const COUNTRIES_ES_EN: Record<string, string> = {
  "Estados Unidos": "United States",
  "Reino Unido": "United Kingdom",
  Inglaterra: "England",
};

/** Legacy album id -> YouTube id, for covers whose own video no longer exists
 * on YouTube (2 = Nevermind: its link video has a working thumbnail). */
const COVER_YOUTUBE_ID_OVERRIDES: Record<number, string> = {
  2: "7NXz2sy6h40",
};

type ApiBand = {
  nombre: string;
  genero: string;
  pais: string;
  fundado: string;
  texto: string;
};

type ApiAlbum = {
  id: string;
  nombre: string;
  fecha: string;
  portada: string;
  url: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callApi<T>(endpoint: string, body?: Record<string, string>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(`${API}/${endpoint}`, {
        method: body ? "POST" : "GET",
        headers: { "X-API-KEY": API_KEY, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        throw new Error(`${endpoint} responded ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) throw error;
      await sleep(500 * attempt);
    }
  }
}

function translateLocation(pais: string): { location: string; countryCode: string } {
  // "Washington, Estados Unidos-us" -> city, country and ISO code.
  const dash = pais.lastIndexOf("-");
  const comma = pais.indexOf(",");
  if (dash === -1 || comma === -1 || comma > dash) {
    throw new Error(`Unexpected "pais" format: "${pais}"`);
  }
  const cityEs = pais.slice(0, comma).trim();
  const countryEs = pais.slice(comma + 1, dash).trim();
  const countryCode = pais.slice(dash + 1).trim().toLowerCase();

  const city = CITIES_ES_EN[cityEs];
  const country = COUNTRIES_ES_EN[countryEs];
  if (!city) throw new Error(`No English translation for city "${cityEs}" — add it to CITIES_ES_EN`);
  if (!country) {
    throw new Error(`No English translation for country "${countryEs}" — add it to COUNTRIES_ES_EN`);
  }
  if (!/^[a-z]{2}$/.test(countryCode)) {
    throw new Error(`Invalid country code "${countryCode}" in "${pais}"`);
  }
  return { location: `${city}, ${country}`, countryCode };
}

/** "Nevermind (1991)" -> "Nevermind". The year comes from `fecha`, so the
 * suffix is only trimmed when present. */
function albumName(nombre: string): string {
  return nombre.replace(/\s*\(\d{4}\)\s*$/, "").trim();
}

function normalizeDescription(texto: string): string {
  return texto
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .join("\n\n");
}

/** The legacy cover host is down, but every cover is the YouTube thumbnail of
 * a video: `.../miniaturas/{youtubeId}.jpg`. It is hotlinked, not downloaded,
 * so only the YouTube id is kept. Some legacy names carry a `portada` prefix
 * or a `?1` query string, hence the strip + last-11-characters rule. */
function albumCoverUrl(portada: string, albumName: string, legacyId: number): string {
  const override = COVER_YOUTUBE_ID_OVERRIDES[legacyId];
  if (override) return `https://i.ytimg.com/vi/${override}/hqdefault.jpg`;
  const file = (portada.split("?")[0].split("/").pop() ?? "").replace(/\.[a-z]+$/i, "");
  const youtubeId = file.slice(-11);
  if (!/^[\w-]{11}$/.test(youtubeId)) {
    throw new Error(`Album "${albumName}" has no valid YouTube id in "${portada}"`);
  }
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

async function upsertAlbum(album: ApiAlbum, bandId: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(album.fecha)) {
    throw new Error(`Album "${album.nombre}" has an invalid date: "${album.fecha}"`);
  }
  const legacyId = Number(album.id);
  const values = {
    bandId,
    name: albumName(album.nombre),
    releaseDate: album.fecha,
    coverPath: albumCoverUrl(album.portada, album.nombre, legacyId),
  };

  // `url` is only written on first insert: the legacy links are broken and the
  // user corrects them in the DB, so re-runs must never overwrite those edits.
  await db
    .insert(albums)
    .values({ legacyId, url: album.url, ...values })
    .onConflictDoUpdate({ target: albums.legacyId, set: values });
}

async function main() {
  const dbBands = await db.select({ id: bands.id, slug: bands.slug, name: bands.name }).from(bands);
  const apiBands = await callApi<ApiBand[]>("allBands");
  const apiBandBySlug = new Map(apiBands.map((band) => [slugify(band.nombre), band]));

  for (const dbBand of dbBands) {
    const apiBand = apiBandBySlug.get(dbBand.slug);
    if (!apiBand) {
      throw new Error(`Band "${dbBand.slug}" is in the DB but not in the legacy API`);
    }

    const { location, countryCode } = translateLocation(apiBand.pais);
    await db
      .update(bands)
      .set({
        location,
        countryCode,
        founded: apiBand.fundado.trim(),
        genre: apiBand.genero.trim(),
        description: normalizeDescription(apiBand.texto),
      })
      .where(eq(bands.id, dbBand.id));

    const apiAlbums = await callApi<ApiAlbum[]>("albumsxband", { banda: apiBand.nombre });
    for (const album of apiAlbums) {
      await upsertAlbum(album, dbBand.id);
    }

    console.log(`${dbBand.slug}: ${location} (${countryCode}), ${apiAlbums.length} albums`);
  }

  const totalAlbums = await db.select({ id: albums.id }).from(albums);
  console.log(`${dbBands.length} bands updated, ${totalAlbums.length} albums in DB`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
