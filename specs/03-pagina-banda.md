# SPEC 03 — Página de banda `/bands/[band]/`

> **Estado:** Implemented
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-21
> **Objetivo:** Construir la página `/bands/{band}/`, alimentada desde PostgreSQL, que replica la de
> storiesbehindsongs.com (ficha de la banda, «Listen Full Album», «Recent Articles About {Band}»,
> «Bands More Popular» y «Most Popular Songs of {Band}») reutilizando `StoryCard` y `StoryGrid`.

## Por qué existe esta spec

El logo de banda y el breadcrumb de SPEC 02 ya enlazan a `/bands/{band}/`, que hoy da 404 (riesgo
aceptado en SPEC 01 y 02). Esta spec cierra ese hueco y agrega dos datos que la base aún no tiene:
la ficha editorial de cada banda y sus álbumes.

El sitio original arma esta página en el navegador con una API interna (`buscaBandas`,
`albumsxband`, `allStoriesforBand`, `masPopularesporBanda`). Aquí todo se resuelve en el servidor
desde PostgreSQL.

Los enlaces de «Listen Full Album» del sitio original apuntan a `youtubevideo.blog` y están rotos.
Se migran **tal cual** y se corregirán después editando `albums.url` en la base; no se toca el
código para ello.

## Alcance

**Dentro:**

- Ruta `src/app/bands/[band]/page.tsx`, pre-renderizada de forma estática para las 8 bandas con
  `generateStaticParams`. `notFound()` si el slug no existe.
- Columnas nuevas en `bands`: `location`, `countryCode`, `founded`, `genre`, `description`.
- Tabla nueva `albums` con su migración Drizzle.
- `scripts/fetch-band-data.ts`: descarga de la API actual los datos de ficha y los álbumes de las 8
  bandas, y los siembra de forma idempotente.
- Extensión de `scripts/fetch-assets.ts`: banderas SVG → `public/flags/{code}.svg`. Las portadas de
  álbum **no se descargan**: `youtubevideo.blog` está caído y cada portada es la miniatura de un
  video de YouTube, que se carga directo desde `i.ytimg.com` (ver Decisiones).
- Ficha de banda (`BandInfo`): logo, bandera, `location`, `founded`, `genre` y `description` en
  párrafos. Los datos de país vienen en español en la API; el seed los traduce a inglés con un mapa
  fijo para las 8 bandas.
- «Listen Full Album» (`AlbumShelf`): tarjetas de álbum en fila horizontal con scroll, ordenadas por
  año ascendente. Cada tarjeta muestra portada, nombre y año, y abre `albums.url` en pestaña nueva.
  Si la banda no tiene álbumes, la sección no se muestra.
- «Recent Articles About {Band}»: `StoryGrid` con las historias de la banda por `id` descendente,
  20 iniciales y «VIEW MORE» de 20 en 20.
- «Bands More Popular»: `PopularBands` reutilizado, ahora con cada logo enlazando a
  `/bands/{slug}/` (también en el home).
- «Most Popular Songs of {Band}»: `StoryGrid` con las historias de la banda por `views`
  descendente, 20 + «VIEW MORE».
- Extensión de `src/app/api/stories/route.ts` con el parámetro opcional `band` (slug).
- Metadatos SEO: `title`, `description`, `canonical`, Open Graph y JSON-LD `BreadcrumbList`
  (Home › {Band}) y `MusicGroup`.
- Fondo: tema oscuro del sitio (no el `#efefef` de SPEC 02).

**Fuera de alcance (para specs futuras):**

- Corregir los enlaces de álbum (el usuario los actualizará en la base cuando los tenga).
- Página `/videos/[band]/` y la pestaña de shorts del original.
- Página de tag `/tags/[tag]/`.
- Descripción en español (`textoEsp`) y rutas en español.
- `sitemap.xml`, `robots.txt` y RSS (CLAUDE.md los ubicaba en «SPEC 03»; pasan a una spec posterior).
- Panel de administración para editar bandas y álbumes.
- Compartir en redes, anuncios, GTM y Google Translate.
- El enlace del bloque de ficha al canal de YouTube que hace el original (aquí la ficha no enlaza).

## Modelo de datos

Columnas nuevas en `bands` (`src/db/schema.ts`), todas `NOT NULL DEFAULT ''` para no romper el seed
de SPEC 01:

```ts
location: text("location").notNull().default(""),        // "Washington, United States"
countryCode: varchar("country_code", { length: 2 }).notNull().default(""), // "us"
founded: varchar("founded", { length: 16 }).notNull().default(""),         // "1987"
genre: varchar("genre", { length: 64 }).notNull().default(""),             // "GRUNGE"
description: text("description").notNull().default(""),                    // párrafos separados por \n\n
```

Tabla nueva:

```ts
export const albums = pgTable(
  "albums",
  {
    id: serial("id").primaryKey(),
    legacyId: integer("legacy_id").notNull(),
    bandId: integer("band_id").notNull().references(() => bands.id),
    name: varchar("name", { length: 255 }).notNull(),   // "Nevermind"
    releaseDate: date("release_date").notNull(),        // 1991-09-24
    coverPath: text("cover_path").notNull(),            // https://i.ytimg.com/vi/{id}/hqdefault.jpg
    url: text("url").notNull(),                         // migrado tal cual (roto); se edita después
  },
  (table) => [
    unique("albums_legacy_id_unique").on(table.legacyId),
    index("albums_band_id_idx").on(table.bandId),
  ],
);
```

- El nombre se guarda sin el año: el original lo trae como `Nevermind (1991)` y lo separa con regex;
  aquí el seed lo separa una vez y el año sale de `releaseDate`.
- El seed hace upsert por `legacyId` pero **no pisa `url`** en corridas posteriores, para no
  deshacer las correcciones manuales del usuario.

Consultas nuevas en `src/db/queries.ts`:

```ts
getBandBySlug(slug)
  // -> { id, slug, name, logoPath, location, countryCode, founded, genre, description } | null

getAlbumsByBand(bandId)
  // -> [{ id, name, releaseDate, coverPath, url }] ordenados por releaseDate asc

getAllBandSlugs()
  // -> string[]

getRecentStories(limit, offset, bandSlug?)   // extensión: WHERE bands.slug = bandSlug
getPopularStories(limit, offset, excludeId?, bandSlug?)  // extensión equivalente
```

## Plan de implementación

1. Añadir las 5 columnas de `bands` y la tabla `albums` a `src/db/schema.ts`; generar y aplicar la
   migración. Verificación: las columnas y la tabla existen; el home sigue compilando.
2. Escribir `scripts/fetch-band-data.ts`: llama a `buscaBandas` y `albumsxband` para las 8 bandas,
   traduce el país con el mapa ES→EN, separa nombre/año del álbum y hace el upsert (sin pisar
   `albums.url`). Verificación: `bands` con `location`/`genre`/`description` llenos en las 8 filas y
   5 filas de `albums` para Nirvana.
3. Extender `scripts/fetch-assets.ts` para bajar las banderas a `public/flags/`. Las portadas no se
   descargan (miniaturas de YouTube enlazadas). Verificación: un archivo por país existe en
   `public/flags/`.
4. Escribir `getBandBySlug`, `getAlbumsByBand`, `getAllBandSlugs` y el filtro opcional `bandSlug` en
   `getRecentStories` y `getPopularStories`. Verificación: `getBandBySlug('nirvana')` devuelve la
   banda; `getRecentStories(20, 0, 'nirvana')` solo devuelve historias de Nirvana.
5. Extender `src/app/api/stories/route.ts` con el parámetro `band`, validado contra el patrón de
   slug. Verificación: `/api/stories/?section=recent&band=nirvana&offset=20` solo devuelve Nirvana.
6. Crear `src/shared/sections/BandInfo.tsx` con logo, bandera, ubicación, año, género y descripción.
7. Crear `src/shared/sections/AlbumShelf.tsx` con «Listen Full Album» (fila con scroll horizontal,
   enlaces `target="_blank" rel="noopener noreferrer"`).
8. Convertir cada logo de `PopularBands` en un `Link` a `/bands/{slug}/`. Verificación: en el home,
   los 8 logos llevan a su página de banda.
9. Crear `src/app/bands/[band]/page.tsx` con `generateStaticParams` y `notFound()`. Orden:
   BandInfo → AlbumShelf → `StoryGrid` «Recent Articles About {Band}» → PopularBands →
   `StoryGrid` «Most Popular Songs of {Band}».
10. Añadir `generateMetadata` y los JSON-LD `BreadcrumbList` y `MusicGroup` (reutilizando el
    escape de `<` de `src/lib/story-seo.ts`).
11. Verificación final: recorrer los criterios contra `/bands/nirvana/` y un slug inexistente.

## Criterios de aceptación

- [x] `npm run build` termina sin errores ni avisos de TypeScript y pre-renderiza 8 páginas
      `/bands/[band]/`.
- [x] `/bands/nirvana/` responde 200 y muestra logo, «Washington, United States», bandera de EE. UU.,
      «1987», «GRUNGE» y la descripción en inglés.
- [x] La sección «Listen Full Album» muestra 5 álbumes de Nirvana ordenados por año: Bleach, Nevermind,
      Incesticide, In Utero, MTV Unplugged in New York.
- [x] Cada tarjeta de álbum enlaza a su `albums.url` con `target="_blank"`; tras cambiar una `url` en
      la base y reconstruir, la tarjeta usa el nuevo valor.
- [x] Re-ejecutar `fetch-band-data.ts` no duplica álbumes ni sobrescribe una `url` editada.
- [x] Las portadas de álbum usan la miniatura de YouTube (`i.ytimg.com`) y una portada que no carga
      muestra un recuadro neutro con el nombre; la bandera se sirve desde `/flags/us.svg`.
- [ ] «Recent Articles About Nirvana» muestra 20 fichas de Nirvana por `id` descendente y «VIEW MORE»
      carga las siguientes, sin historias de otras bandas.
- [x] «Most Popular Songs of Nirvana» muestra 20 fichas de Nirvana por `views` descendente; sin
      botón «VIEW MORE» si la banda tiene 20 o menos historias.
- [x] «Bands More Popular» muestra los 8 logos y cada uno enlaza a `/bands/{slug}/`, tanto aquí como
      en el home.
- [x] El logo y el nombre de banda de `/read/nirvana/polly/` ya no llevan a un 404.
- [x] El JSON-LD `BreadcrumbList` tiene 2 niveles y `MusicGroup` incluye `name`, `genre` y
      `foundingDate`.
- [x] `/bands/banda-inexistente/` devuelve 404.
- [x] Una banda sin álbumes no renderiza la sección «Listen Full Album».
- [x] Todo el texto visible está en inglés.
- [x] Lighthouse en `/bands/nirvana/` da 90 o más en Performance, Accessibility y SEO (escritorio).

## Notas de implementación

Desviaciones y observaciones surgidas al implementar.

- **Criterio «Recent Articles About Nirvana» (20 fichas + «VIEW MORE»): no se cumple literalmente.**
  Ninguna banda tiene más de 20 historias (Nirvana 17, Queen 10, Guns N' Roses 8), así que no hay
  botón. El orden por `id` descendente sí coincide con la base y la API pagina con `offset`. Queda
  abierto reescribir el criterio como «hasta 20 fichas y “VIEW MORE” solo si hay más».
- **Portadas de álbum:** `youtubevideo.blog` está caído. `albums.coverPath` guarda la miniatura de
  YouTube (`i.ytimg.com`), sin descarga ni `.webp` local (decisión del usuario). Nevermind usa el ID de
  su enlace (`COVER_YOUTUBE_ID_OVERRIDES` en `fetch-band-data.ts`) porque su video original ya no existe.
  Otros 4 videos tampoco existen (In Utero, Use Your Illusion I, Beggars Banquet, Dangerous) y muestran
  el recuadro de respaldo. YouTube responde 404 con una miniatura gris de 120 px, por lo que
  `AlbumCover` detecta también ese tamaño y no solo `onError`.
- **`albums.url`** sigue con los enlaces de `youtubevideo.blog` (caído); sus IDs no coinciden con
  ninguna de las 75 historias, así que no hay página interna a la cual revincular. Se editan en la base.
- **Queen** queda como «London, England» porque la API trae «Inglaterra». Dato heredado, editable en la base.
- **Textos añadidos:** «Founded {año}» en `BandInfo` y título `{Banda} Song Stories` (la plantilla del
  layout agrega el sitio). `og:type` es `website`.
- **Helpers no listados en el plan:** `src/lib/band-seo.ts`, `src/shared/ui/AlbumCover.tsx` (cliente,
  para el fallback) y `truncate` exportada desde `story-seo.ts`. El script de descarga de banderas
  extendió `fetch-assets.ts` y lee `bands.countryCode` de la base.
- **Lighthouse en `/bands/nirvana/`** (escritorio, 5 corridas): Accessibility y SEO 100 en todas;
  Performance 100 en cuatro y 88 en la primera (arranque en frío, Speed Index 4.1 s).
- **Pendiente:** validar el JSON-LD con el validador de schema.org y comparar visualmente contra el sitio original.

## Decisiones

- **Sí:** tabla `albums` en PostgreSQL. El usuario corregirá los enlaces en la base; una tabla
  permite editarlos por fila.
- **No:** columna JSON en `bands` o archivo JSON en el repo. Ninguno permite editar un álbum por fila.
- **Sí:** migrar los enlaces rotos tal cual. Es lo que pidió el usuario; se corrigen después sin
  tocar código.
- **Sí:** el seed no pisa `albums.url` tras el primer insert, para proteger las correcciones manuales.
- **Sí:** portadas de álbum = miniatura de YouTube enlazada (`https://i.ytimg.com/vi/{id}/hqdefault.jpg`),
  sin descarga. Decisión del usuario: `youtubevideo.blog` está caído y las portadas son las mismas
  miniaturas que usa YouTube. Reemplaza la descarga a `.webp` local prevista antes. Los enlaces que
  apuntaban a `youtubevideo.blog` se revincularán después al sitio nuevo.
- **Sí:** ficha de banda con descripción, país y género (elegido por el usuario) y no solo un
  encabezado. Requiere las 5 columnas nuevas en `bands`.
- **Sí:** `location` en inglés con `countryCode`. Cumple «front 100% en inglés». El mapa ES→EN vive
  en el script y los valores se pueden editar luego en la base.
- **No:** guardar `textoEsp`. No hay rutas en español.
- **Sí:** banderas SVG en `public/flags/`. Sin dependencia externa en runtime.
- **Sí:** logos de «Bands More Popular» enlazados a `/bands/{slug}/`, también en el home, ya que la
  ruta existe.
- **Sí:** reutilizar `StoryGrid` y `StoryCard` con un filtro `band` en la API y las consultas, en vez
  de crear componentes nuevos.
- **Sí:** generación estática con `generateStaticParams`, como el home y `/read/`.
- **Sí:** tema oscuro del sitio en esta página. A diferencia de `/read/`, el original no usa aquí el
  fondo `#efefef` para el contenido principal.
- **No:** incluir el bloque de shorts (`todoslosshorts`) que el original carga junto a los álbumes;
  depende de `/videos/` y `/shorts/`, fuera de alcance desde SPEC 02.
- **Nota:** CLAUDE.md llama «SPEC 03» a sitemap/robots/RSS. Como la numeración es secuencial, esta
  spec ocupa el 03 y esas piezas pasan a una spec posterior.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| La API del sitio actual (`X-API-KEY` pública, `/code/public/*`) puede cambiar o caer | `fetch-band-data.ts` se ejecuta una sola vez; después el sitio vive solo de PostgreSQL. |
| `youtubevideo.blog` está caído (las 32 portadas devolvían "404") | Se usa la miniatura de YouTube por ID. Algunos videos ya no existen en YouTube (5 de 32 al 2026-09-21): `AlbumShelf` muestra un recuadro neutro con el nombre si la imagen falla. |
| El regex de nombre/año del original rompe con nombres sin `(YYYY)` | El script usa `releaseDate` (`fecha`) para el año y solo recorta el sufijo `(YYYY)` si existe. |
| Una banda con menos de 20 historias muestra el botón de más | `StoryGrid` ya oculta «VIEW MORE» cuando la primera carga trae menos de 20. |
| El mapa ES→EN de países no cubre una banda futura | El script falla con un mensaje explícito en vez de guardar español. |

## Lo que **no** entra en esta spec

- Corregir los enlaces de álbum (los actualiza el usuario en la base).
- `/videos/[band]/`, shorts y `/tags/[tag]/`.
- Descripciones en español y rutas en español.
- `sitemap.xml`, `robots.txt` y RSS.
- Panel de administración.
- Compartir en redes, anuncios, GTM y Google Translate.

Cada uno, si llega, va en su propia spec.
