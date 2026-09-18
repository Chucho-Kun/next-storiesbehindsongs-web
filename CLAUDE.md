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

**Estado: en progreso (18 de 19 pasos completados)**

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

Pendiente:

- **Paso 19**: conectar el buscador del header a `/search?q=` (el `<form>` ya apunta ahí, falta verificar el flujo end-to-end) y agregar los metadatos SEO del home (title, description, canonical, Open Graph, JSON-LD `WebSite` con `SearchAction`).
- Verificar los criterios de aceptación completos de la spec (Lighthouse ≥90, build sin warnings, etc.) antes de marcarla como `Implementado`.
- Commit y merge de la rama de trabajo a `main` (pendiente de tu autorización explícita).

### Fuera de alcance de la SPEC 01 (para specs futuras)

- Página de historia `/read/[band]/[song]/` con JSON-LD `BlogPosting` + `FAQPage` → **SPEC 02**.
- Páginas `/bands/[band]/` y `/videos/[band]/` → **SPEC 02**.
- Contenido real de About Us, Notice of Privacy y Contact (hoy son placeholders).
- `sitemap.xml`, `robots.txt`, feed RSS → **SPEC 03**.
- AdSense, GTM, Meta Pixel, Trustpilot, Google Translate.
- Rutas en español (`/leer/`, `/banda/`).
- Panel de administración (reemplazo de `/plataforma/`).
- Despliegue del front y cambio de DNS del dominio.
- Reemplazo de los 3 recursos de marca placeholder por los definitivos que tú proporciones.

