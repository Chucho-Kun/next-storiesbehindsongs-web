# SPEC 01 — Fundación Next.js, PostgreSQL en Railway y home completo

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-09-17
> **Objetivo:** Levantar el proyecto Next.js 16 con Tailwind 4, migrar las 75 historias de
> `ejemplos/bd/stories.sql` a un PostgreSQL normalizado en Railway y renderizar el home completo
> con sus cinco secciones y el buscador.

## Por qué existe esta spec

El sitio actual construye el HTML con JavaScript a mano y expone una API PHP con la API-key escrita
en el propio HTML. Antes de rediseñar nada hay que tener el contenido en una base consultable y un
proyecto Next donde montar los componentes. Esta spec es el suelo sobre el que se apoyan la página
`/read/` y el resto del sitio.

## Alcance

**Dentro:**

- Proyecto Next.js 16 (App Router, TypeScript, `src/`) con Tailwind CSS 4 y ESLint.
- Esquema PostgreSQL normalizado con Drizzle ORM y migraciones versionadas en `drizzle/`.
- Servicio PostgreSQL en Railway, conectado por `DATABASE_URL` en `.env.local`.
- Script de migración que parsea `ejemplos/bd/stories.sql` y puebla la base.
- Normalización del pseudo-markup de `texto` y `letra` a HTML limpio durante la migración.
- Script de descarga de assets: 8 logos, 77 portadas, 389 imágenes de cuerpo y los 3 recursos de marca.
- Header negro con logo y buscador.
- Las cinco secciones del home: banner de YouTube, Popular Tags, Bands More Popular,
  Recent Articles y Most Popular Songs.
- Componente de ficha reutilizable según `ejemplos/screenshots/ficha.png`.
- Paginación «VIEW MORE» de 20 en 20 en las dos secciones de fichas.
- Página `/search?q=` con resultados en formato ficha y su route handler.
- Footer con About Us, Notice of Privacy, Contact, redes sociales y la línea legal negra.

**Fuera de alcance (para specs futuras):**

- Página de historia `/read/[band]/[song]/` con su JSON-LD `BlogPosting` + `FAQPage`. → SPEC 02.
- Páginas `/bands/[band]/` y `/videos/[band]/`. → SPEC 02.
- Contenido real de About Us, Notice of Privacy y Contact (aquí solo las rutas y el enlace).
- `sitemap.xml`, `robots.txt` y feed RSS. → SPEC 03.
- AdSense `ca-pub-1429265610923949`, GTM `GTM-TNMTP9C7`, Meta Pixel, Trustpilot y Google Translate.
- Rutas en español `/leer/` y `/banda/`.
- Panel de administración que sustituya a `/plataforma/`.
- Despliegue del front y cambio de DNS del dominio.
- Contador real de visitas (se migra el valor de `vistas`, no se incrementa).

## Modelo de datos

Esquema Drizzle en `src/db/schema.ts`. Cuatro tablas:

```ts
bands      // 8 filas
  id, slug ('guns-n-roses'), name ('Guns N Roses'), logoPath ('/bands/guns-n-roses.webp')

stories    // 75 filas
  id, legacyId (id original del dump), bandId, slug ('sweet-child-o-mine'),
  title ('Sweet Child O' Mine'), subtitle (lo que va tras el '|' en titulo),
  album ('Appetite for Destruction (1987)'),
  youtubeId ('1w7OgIMMRc4'), shortId ('PynHCsv4APo' | null), shortRange ('00:49-605' | null),
  bodyHtml (texto normalizado), lyrics (letra normalizada),
  faqs (jsonb: { author, meaning, facts, lyrics }),
  coverPath ('/covers/guns-n-roses-sweet-child-o-mine.webp'), views (int)

tags       // 51 filas
  id, slug ('based-on-real-events'), name ('based on real events')

storyTags  // tabla puente, PK compuesta (storyId, tagId)
```

Restricciones e índices: `unique(bands.slug)`, `unique(stories.bandId, stories.slug)`,
`unique(tags.slug)`, índice en `stories.views` e índice en `stories.id` descendente.

**Reglas de derivación del slug** (deben reproducir exactamente la URL actual):

1. `slug = valor.toLowerCase()`, se eliminan los apóstrofos, los espacios pasan a `-`.
2. El título de la historia es `titulo.split('|')[0].trim()`; el subtítulo es el resto.
3. La URL canónica queda `/read/{band.slug}/{story.slug}/`.

**Reglas de normalización del contenido** (se aplican una sola vez, en la migración):

1. En `texto`, dentro de cada etiqueta `<...>` el carácter `*` pasa a `"`.
2. Fuera de las etiquetas, `*texto*` pasa a `<em>texto</em>`.
3. `::` separa párrafos: cada fragmento se envuelve en `<p>`.
4. Los `src` `img/NOMBRE.webp` pasan a `/stories/{band.slug}/{story.slug}/NOMBRE.webp`.
5. El HTML resultante se saneja a la lista blanca `p, em, strong, br, a, img, iframe`.
6. En `letra`, `*` pasa a salto de línea y `__` a línea en blanco entre estrofas.

**Rutas de assets en `public/`:**

- `public/bands/{band.slug}.webp` — 8 logos.
- `public/covers/{band.slug}-{story.slug}.webp` — 77 portadas.
- `public/stories/{band.slug}/{story.slug}/{archivo}.webp` — 389 imágenes de cuerpo.
- `public/brand/logo.svg`, `public/brand/youtube-banner.webp`, `public/brand/eye.svg`.

Las imágenes de cuerpo se guardan por historia y no en una carpeta plana: `album.webp` existe en 26
historias con contenido distinto y una carpeta común las machacaría.

## Plan de implementación

1. Crear el proyecto Next 16 con `create-next-app` (TypeScript, Tailwind, ESLint, App Router,
   `src/`, alias `@/*`), sin tocar `CLAUDE.md` ni `ejemplos/`. Verificación: `npm run dev` sirve la
   página por defecto.
2. Inicializar git y añadir `.gitignore` con `.env*.local`. Primer commit.
3. Configurar `trailingSlash: true` en `next.config.ts` y los tokens de diseño en
   `src/app/globals.css` con `@theme` (negro de fondo, rojo de títulos, tipografías).
4. Instalar `drizzle-orm`, `drizzle-kit`, `pg` y `dotenv`. Crear `drizzle.config.ts` y
   `src/db/index.ts` leyendo `DATABASE_URL`.
5. Escribir `src/db/schema.ts` con las cuatro tablas. Generar la migración con `drizzle-kit generate`.
6. **Punto de bloqueo:** creas el servicio PostgreSQL en Railway y pegas la `DATABASE_URL` pública
   en `.env.local`. Aplicar la migración con `drizzle-kit migrate`. Verificación: las cuatro tablas
   existen y están vacías.
7. Escribir `scripts/parse-legacy-sql.ts`: parsea los `INSERT` de `ejemplos/bd/stories.sql` (con sus
   escapes `\'`) y devuelve 75 objetos. Verificación: imprime 75 filas y 8 bandas distintas.
8. Escribir `scripts/normalize-content.ts` con las seis reglas de normalización y sus tests unitarios
   sobre las filas 20 (Patience, con letra) y 77 (Polly, con imágenes).
9. Escribir `scripts/seed.ts`: inserta bandas, tags, historias y la tabla puente. Idempotente por
   `legacyId`. Verificación: 75 historias, 8 bandas, 51 tags, 0 historias sin tags.
10. Escribir `scripts/fetch-assets.ts`: descarga los logos, las portadas y, por cada historia, sus
    imágenes desde `https://storiesbehindsongs.com/read/{band}/{song}/img/{archivo}.webp`.
    Verificación: 389 archivos en `public/stories/` y cero errores 302.
11. Crear las consultas en `src/db/queries.ts`: `getRecentStories`, `getPopularStories`,
    `getPopularTags`, `getBands`, `searchStories`. Todas con `limit`/`offset`.
12. Crear `src/shared/ui/StoryCard.tsx` reproduciendo `ejemplos/screenshots/ficha.png`: portada,
    logo de banda arriba a la derecha, título en rojo, álbum en cursiva, visitas con el icono de ojo
    y subtítulo. Enlaza a `/read/{band}/{song}/`.
13. Crear `src/shared/layout/Header.tsx` (fondo negro, logo, buscador) y `src/shared/layout/Footer.tsx`
    (enlaces, redes y la franja legal negra). Montarlos en `src/app/layout.tsx` con los metadatos
    base y `metadataBase`.
14. Crear `src/shared/sections/YoutubeBanner.tsx` enlazando a
    `https://www.youtube.com/@StoriesBehindTheSongs`.
15. Crear `src/shared/sections/PopularTags.tsx` y `src/shared/sections/PopularBands.tsx` como Server
    Components que leen de Postgres.
16. Crear `src/shared/sections/StoryGrid.tsx` con el botón «VIEW MORE» y el route handler
    `src/app/api/stories/route.ts` que devuelve los siguientes 20 por `section` y `offset`.
17. Montar `src/app/page.tsx` con las cinco secciones en orden. Verificación: el home muestra 20
    fichas en cada rejilla y «VIEW MORE» carga las siguientes.
18. Crear `src/app/api/search/route.ts` (ILIKE sobre título, banda y álbum) y `src/app/search/page.tsx`
    con los resultados en formato ficha y su estado vacío.
19. Conectar el buscador del header a `/search?q=` y añadir los metadatos SEO del home
    (title, description, canonical, Open Graph, JSON-LD `WebSite` con `SearchAction`).

## Criterios de aceptación

- [ ] `npm run build` termina sin errores ni avisos de TypeScript.
- [ ] `SELECT count(*)` devuelve 75 en `stories`, 8 en `bands` y 51 en `tags`.
- [ ] Ninguna fila de `stories` tiene `bodyHtml` con `::` o con `=*` sin convertir.
- [ ] La historia con `legacyId` 77 tiene `slug = 'polly'` y su banda `slug = 'nirvana'`.
- [ ] La ficha de esa historia enlaza exactamente a `/read/nirvana/polly/`.
- [ ] `public/stories/nirvana/polly/friend-fake.webp` existe y pesa más de 0 bytes.
- [ ] `public/stories/` contiene 389 archivos `.webp`.
- [ ] El home muestra las cinco secciones en el orden del `CLAUDE.md`.
- [ ] «Recent Articles» muestra 20 fichas y tras pulsar «VIEW MORE» muestra 40.
- [ ] «Most Popular Songs» está ordenada por `views` descendente y su primera ficha es la de mayor
      número de visitas.
- [ ] Buscar «polly» en el header lleva a `/search?q=polly` y devuelve al menos un resultado.
- [ ] Buscar «zzzz» muestra el estado vacío y no un error.
- [ ] «Popular Tags» muestra «based on real events» en primer lugar (14 apariciones).
- [ ] «Bands More Popular» muestra los 8 logos servidos desde `public/bands/`.
- [ ] Todo el texto visible del front está en inglés.
- [ ] El footer termina con la línea legal exacta del `CLAUDE.md`.
- [ ] Lighthouse en el home da 90 o más en Performance, Accessibility y SEO en modo escritorio.

## Decisiones

- **Sí:** esquema normalizado en cuatro tablas. Las secciones de tags y bandas del home necesitan
  conteos reales y los logos necesitan una fila propia por banda.
- **No:** tabla plana con `text[]`. Habría obligado a agregar en cada consulta del home.
- **Sí:** Drizzle ORM. Esquema en TypeScript, migraciones SQL versionadas y sin cliente generado.
- **No:** Prisma. Añade peso al servidor sin aportar nada que aquí haga falta.
- **Sí:** conservar `/read/{band}/{song}/` con `trailingSlash: true`. El sitio ya está indexado y
  cualquier cambio de URL diluiría autoridad sin ganancia.
- **Sí:** normalizar el pseudo-markup durante la migración. Postgres guarda HTML correcto y el
  render en Next no arrastra la deuda del sitio viejo.
- **No:** guardar `texto` crudo y convertirlo al renderizar. Perpetúa un formato propietario.
- **Sí:** imágenes de cuerpo en `public/stories/{band}/{song}/`. Los nombres colisionan entre
  historias y una carpeta plana perdería 44 archivos.
- **Sí:** `faqs` como `jsonb` con claves `author`, `meaning`, `facts`, `lyrics`. Son cuatro campos
  fijos que solo se leen juntos para el `FAQPage` de la SPEC 02.
- **No:** tabla `faqs` aparte. Normalización sin ningún uso previsto.
- **Sí:** buscador con página `/search` propia. Es indexable y compartible, al contrario que el
  desplegable actual.
- **No:** reutilizar la API PHP `/code/public/buscador`. Expone la API-key en el HTML y ata el sitio
  nuevo al servidor viejo.
- **No:** full-text search con `tsvector`. Con 75 artículos `ILIKE` sobra; se reconsidera al crecer.
- **Sí:** «VIEW MORE» paginado en servidor de 20 en 20. Mantiene el HTML inicial ligero aunque el
  catálogo crezca.
- **No:** ads, GTM, Meta Pixel y Google Translate. Se portan en una spec posterior, ya con el
  rediseño medible.
- **No:** rutas en español. El contenido en español no está en `stories.sql`.
- **Sí:** reutilizar logo, banner y iconos del sitio actual. No bloquea la implementación y son
  reemplazables después.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Las fichas del home enlazan a `/read/...`, que no existe hasta la SPEC 02 | Aceptado y conocido. Mientras tanto se verifica el `href` generado, no la navegación. La SPEC 02 es la siguiente. |
| El servidor actual puede caer o bloquear la descarga de las 389 imágenes | El script descarga con reintentos y registra los fallos. Las imágenes quedan en el repo, así que se ejecuta una sola vez. |
| Una regla de normalización puede romper un HTML concreto entre los 75 textos | Tests unitarios sobre los casos con imágenes, cursivas y letra. Un criterio de aceptación comprueba que no queda `::` ni `=*` en la base. |
| Las reglas de slug podrían no reproducir alguna URL actual | El script compara cada slug generado contra la URL en vivo antes del seed y aborta si alguna devuelve 302. |
| La `DATABASE_URL` pública de Railway consume cuota de red en cada consulta en desarrollo | Solo se usa en local y con volumen bajo. Al desplegar el front en Railway se pasa a la URL interna. |

## Lo que **no** entra en esta spec

- La página `/read/[band]/[song]/` y su JSON-LD.
- Las páginas `/bands/` y `/videos/`.
- `sitemap.xml`, `robots.txt` y feed RSS.
- Publicidad y analítica.
- Las rutas en español.
- El panel de administración.
- El despliegue del front y el cambio de dominio.

Cada uno, si llega, va en su propia spec.
