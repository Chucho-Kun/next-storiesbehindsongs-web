Este proyecto será realizado en la ultima version de Next.js y tomará el diseño que tiene el sitio web https://storiesbehindsongs.com/ pero ajustandolo a nuevas tecnologias como

- TailwindCSS
- Next (ultima version)
- Base de datos en PostgreSQL
- Componentes reciclables
- Optimización para SEO
- Optimización de imágenes en .webp

La base de datos tendrá una estructura parecida a la de /ejemplos/bd/stories.sql

* El front del sitio web deberá estar en idioma inglés y deberá mostrar las siguientes secciones que deberán ser componentes de next separados en la carpeta src/shared/  

Componentes:

A- Header: Fondo color negro con el logo que yo subiré y un buscador a la derecha para encontrar alguna canción por el nombre o la banda 

B- Secciones:

1.- Banner de youtube con vinculo directo al canal https://www.youtube.com/@StoriesBehindTheSongs, esta imagen la proporciono yo

2.- Una sección de tags más populares que se alimenta de la base de datos en postgre

3.- Una sección de "Bands More Popular" que mostrará los logos de las bandas que tienen historias hasta ahora

4.- Una sección de "Recent Articles" que se alimenta de la base de datos de postgre. Estas fichas serán un componente reutilizable que muestra las caracteristicas que muestran en /ejemplos/screenshots/ficha.png (muestra 20 resultados al principio pero deberá llevar un botón "VIEW MORE" para cargar otros 20 siguientes)

5.- Una sección de "Most Popular Songs" igualmente alimentado desde la base de datos de postgre y con el diseño reutilizado de la ficha /ejemplos/screenshots/ficha.png (muestra 20 resultados al principio pero deberá llevar un botón "VIEW MORE" para cargar otros 20 siguientes)

Footer: Se agregan secciones como "About Us", "Notice of Privacy", "Contact", y la lista de las Redes Sociales que te puedo proporcionar

Finalmente un liston negro con el siguiente texto "storiesbehindsongs.com is a platform that publishes and stores information from different articles about popular songs, for the sole purpose of entertainment | 2026"

## Estado de implementación

Este proyecto se está construyendo siguiendo specs versionadas en `specs/`. Este bloque se actualiza a medida que avanza el trabajo; refleja el estado real del código, no solo lo planeado.

### SPEC 01 — Fundación Next.js, PostgreSQL y home completo

**Estado: Implementado (19 de 19 pasos completados, 17 de 17 criterios de aceptación verificados)**

Completado:

- Proyecto Next.js 16 (App Router, TypeScript, `src/`, alias `@/*`) + Tailwind CSS 4 + ESLint. `agentRules: false` y `trailingSlash: true` en `next.config.ts`.
- Tokens de diseño en `src/app/globals.css`: fondo negro fijo (`--bg`), texto blanco (`--fg`), gris (`--muted`), rojo de títulos (`--title-red`, muestreado de `ficha.png`).
- PostgreSQL en Railway conectado por `DATABASE_URL` en `.env.local`. Esquema Drizzle en `src/db/schema.ts` (`bands`, `stories`, `tags`, `storyTags`) migrado con `drizzle-kit`.
- `scripts/parse-legacy-sql.ts`: parsea las 10 sentencias `INSERT` del dump legacy (`ejemplos/bd/stories.sql`) → 75 filas, 8 bandas.
- `scripts/normalize-content.ts`: las 6 reglas de normalización de `texto`/`letra` a HTML limpio, con tests unitarios (`node --test`).
- `scripts/seed.ts`: siembra idempotente por `legacyId` → 75 historias, 8 bandas, 51 tags, 0 historias sin tags.
- `scripts/fetch-assets.ts`: descarga logos, portadas, imágenes de cuerpo y los 3 recursos de marca placeholder (`logo.svg`, `eye.svg`, `youtube-banner.webp`, reutilizados del sitio actual según la spec) → 472/472 descargas exitosas.
- `src/db/queries.ts`: `getRecentStories`, `getPopularStories`, `getPopularTags`, `getBands`, `searchStories` (todas con `limit`/`offset`).
- Componentes en `src/shared/`: `ui/StoryCard`, `layout/Header` (con buscador), `layout/Footer` (redes reales + franja legal), `sections/YoutubeBanner`, `sections/PopularTags`, `sections/PopularBands`, `sections/StoryGrid` (con paginación "VIEW MORE").
- `src/app/page.tsx`: home con las 5 secciones en orden. `src/app/api/stories/route.ts` para la paginación.
- `src/app/api/search/route.ts` + `src/app/search/page.tsx`: búsqueda por ILIKE (título, banda, álbum) con estado vacío.
- Páginas placeholder de rutas del footer: `/about`, `/notice-of-privacy`, `/contact` (solo rutas y enlace, sin contenido real — así lo pide la spec).
- **Paso 19**: buscador del header (`src/shared/layout/Header.tsx`) verificado end-to-end: `<form action="/search" method="GET">` → `src/app/search/page.tsx` (lee `q`, llama `searchStories`) → `StoryGrid` pagina siguientes resultados contra `/api/search/?q=...`. Metadatos SEO del home añadidos en `src/app/page.tsx`: `title`, `description`, `alternates.canonical`, Open Graph (con `youtube-banner.webp`) y JSON-LD `WebSite` con `potentialAction` `SearchAction` apuntando a `/search/?q={search_term_string}`.
- Commit `1609f5b` en la rama `spec-01-fundacion-next-postgres-home`: 502 archivos (schema/queries/scripts, componentes de `src/shared/`, rutas API, páginas placeholder y todos los assets descargados en `public/`).

Verificación final (17 de 17 criterios de `specs/01-fundacion-next-postgres-home.md` pasan):

- Build de producción sin errores ni avisos de TypeScript; conteos 75/8/51 en BD; 0 filas con `::` o `=*` sin convertir; `legacyId` 77 → `polly`/`nirvana`; `friend-fake.webp` y los 389 `.webp` de `public/stories/` presentes; las cinco secciones del home en orden; Recent Articles 20→40 con VIEW MORE; Most Popular Songs encabezado por *We Are the World* (mayor `views`); búsqueda de «polly» con resultado y de «zzzz» con estado vacío; «Popular Tags» encabezado por *based on real events*; los 8 logos de bandas sirviendo desde `public/bands/`; texto 100% en inglés; línea legal del footer exacta.
- Lighthouse en el home (modo escritorio, `npx lighthouse@12`): Performance 92, Accessibility 100, SEO 100.

Pendiente:

- Merge de la rama `spec-01-fundacion-next-postgres-home` a `main` (pendiente de tu autorización explícita).

### SPEC 02 — Página de historia `/read/[band]/[song]/`

**Estado: Implementado (14 de 14 pasos completados, 18 de 18 criterios de aceptación verificados)**

Completado:

- `stories.publishedAt` (`timestamptz`, `NOT NULL DEFAULT now()`) con migración `drizzle/0001_add_published_at.sql`. `scripts/seed.ts` la fija solo en el insert inicial (idempotente); las 75 historias comparten la fecha de migración (2026-09-18).
- `src/db/queries.ts`: `getStoryBySlugs`, `getRelatedStories`, `getAllStorySlugs` y `excludeId` opcional en `getPopularStories`. Tipo `StoryDetail`.
- `src/app/read/[band]/[song]/page.tsx`: pre-renderizada estática (75 páginas con `generateStaticParams`), `notFound()` para slugs inexistentes, `generateMetadata` y los 3 JSON-LD. Fondo `#efefef` solo dentro de esta ruta; Header y Footer negros no cambian.
- Orden de la página: Breadcrumb → StoryHero (título, banda, subtítulo, fecha, vistas, logo + álbum, iframe de YouTube, tags) → YoutubeBanner → StoryBody → StoryLyrics (`#lyrics`) → StoryFaq → MostPopularStories → RelatedSongs.
- Componentes nuevos en `src/shared/`: `ui/Breadcrumb`, `ui/StoryCardGrid`, `sections/StoryHero`, `StoryBody`, `StoryLyrics`, `StoryFaq` (exporta `buildFaqEntries`), `MostPopularStories`, `RelatedSongs`.
- `src/lib/story-seo.ts`: metadatos (title `{Song} by {Band}`, canonical, Open Graph `article`) y JSON-LD `BreadcrumbList`, `BlogPosting` y `FAQPage` (la 4.ª respuesta usa `stories.lyrics` normalizado, no `faqs.lyrics`).
- Decisiones: `dateModified` = `datePublished` (no hay fecha de modificación); `description` sale de `subtitle` (≤160 caracteres) o `faqs.meaning`; sin pestaña «TRANSLATED»; `views` no se incrementa por visita.

Verificación final (18 de 18 criterios de `specs/02-pagina-historia-read.md` pasan):

- Build sin errores ni avisos de TypeScript, 75 páginas SSG; `/read/nirvana/polly/` responde 200 con título, banda, álbum y subtítulo correctos; fecha igual a `publishedAt`; 30 vistas estáticas tras 3 recargas; `friend-fake.webp` en el cuerpo; 6 estrofas de letra; FAQ con las 4 preguntas; 4 tags sin enlace; «Most Popular Stories» (8) y «Related Songs» (8) sin Polly ni duplicados; logo y nombre enlazan a `/bands/nirvana/`; slugs inexistentes → 404; texto 100% en inglés.
- Lighthouse en `/read/nirvana/polly/` (escritorio, `npx lighthouse@12`): tres corridas con Performance 99, Accessibility 100, SEO 100. Una primera corrida dio Performance 87 (Speed Index 3.4 s), atribuida a ruido.

Pendiente:

- Decidir la incoherencia entre el orden Letra → FAQ y el texto «See the full lyrics below ↓» (ver «Notas de implementación» de la spec).
- Confirmar el JSON-LD con el validador de schema.org (no se pasó) y comparar visualmente contra el sitio original.
- Commit de la SPEC 02 y merge de las ramas `spec-01-fundacion-next-postgres-home` y `spec-02-pagina-historia-read` a `main` (pendiente de tu autorización explícita; la rama 02 sale de la 01).

### Fuera de alcance de las SPEC 01 y 02 (para specs futuras)

- Páginas `/bands/[band]/` y `/videos/[band]/` (hoy el logo y el breadcrumb de la historia enlazan a `/bands/{band}/` y dan 404) → spec futura.
- Página de filtrado por tag `/tags/[tag]/` (las pills de tags no llevan a ningún sitio), widget de información de banda (país, bandera), botones «VIEW ONLY VIDEO» / «SHORT VIDEO» y pestaña de letra traducida.
- Compartir en redes (ShareThis) e incremento de `views` por visita.
- Contenido real de About Us, Notice of Privacy y Contact (hoy son placeholders).
- `sitemap.xml`, `robots.txt`, feed RSS → **SPEC 03**.
- AdSense, GTM, Meta Pixel, Trustpilot, Google Translate.
- Rutas en español (`/leer/`, `/banda/`).
- Panel de administración (reemplazo de `/plataforma/`).
- Despliegue del front y cambio de DNS del dominio.
- Reemplazo de los 3 recursos de marca placeholder por los definitivos que tú proporciones.

