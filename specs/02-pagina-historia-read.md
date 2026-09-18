# SPEC 02 — Página de historia `/read/[band]/[song]/`

> **Estado:** Implemented
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-18
> **Objetivo:** Construir la página `/read/{band}/{song}/`, alimentada 100% desde PostgreSQL, que
> clona visualmente el diseño actual de storiesbehindsongs.com (breadcrumb, video, cuerpo, letra,
> FAQ visible, tags, «Most Popular Stories» y «Related Songs») usando los componentes reciclables
> ya construidos en SPEC 01.

## Por qué existe esta spec

Las fichas del home (SPEC 01) ya enlazan a `/read/{band}/{song}/`, pero esa ruta responde 404 hoy —
era un riesgo aceptado y documentado en SPEC 01. Esta spec cierra ese hueco: es la página que
realmente posiciona y muestra el contenido migrado, y el primer lugar donde se leen los campos
`bodyHtml`, `lyrics` y `faqs` que SPEC 01 dejó listos en la base pero sin consumir.

## Alcance

**Dentro:**

- Ruta dinámica `src/app/read/[band]/[song]/page.tsx`, pre-renderizada de forma estática para las
  75 combinaciones existentes con `generateStaticParams` (mismo patrón «estático primero» que el
  home).
- Columna nueva `stories.publishedAt` (con su migración Drizzle) y backfill en `scripts/seed.ts`.
- Consultas nuevas en `src/db/queries.ts`: `getStoryBySlugs`, `getRelatedStories`, y una extensión
  de `getPopularStories` con un `excludeId` opcional.
- Breadcrumb «Home › {Band} › {Song}» con JSON-LD `BreadcrumbList`.
- Cabecera de la historia: título (rojo), banda, subtítulo/intro, fecha de publicación, vistas
  (estático), logo de banda enlazando a `/bands/{band}/` (fuera de alcance, se acepta 404 igual
  que hicieron las fichas del home con `/read/` en SPEC 01), nombre del álbum en texto plano.
- Video de YouTube embebido directamente (iframe, sin miniatura ni clic previo).
- Tags de la historia como pills sin enlace (mismo estilo que «Popular Tags» del home).
- Cuerpo de la historia (`bodyHtml`) en una caja de contenido.
- Reutilización de `YoutubeBanner` (ya construido en SPEC 01) entre el video y la letra, en el
  mismo lugar donde el sitio actual promociona su canal.
- Sección de letra (`lyrics`, ancla `#lyrics`), solo el original — sin pestaña «TRANSLATED».
- Sección de FAQ **visible** con las 4 preguntas (`faqs.author`, `faqs.meaning`, `faqs.facts`, y
  una cuarta que enlaza a `#lyrics` en vez de duplicar `faqs.lyrics`), más JSON-LD `FAQPage`.
- JSON-LD `BlogPosting` con `headline`, `description`, `image`, `datePublished`, `dateModified`.
- «Most Popular Stories»: 8 fichas (`StoryCard`) por `views` descendente, excluyendo la historia
  actual.
- «Related Songs»: hasta 8 fichas (`StoryCard`) de historias que comparten al menos un tag con la
  actual, excluyéndola y sin duplicados.
- Página 404 (`notFound()`) cuando la banda o la canción del slug no existen.
- Metadatos SEO por historia: `title`, `description`, `alternates.canonical`, Open Graph.

**Fuera de alcance (para specs futuras):**

- Páginas `/bands/[band]/` y `/videos/[band]/`. El logo de banda y el breadcrumb ya enlazan ahí,
  aceptando 404 por ahora — mismo patrón que SPEC 01 dejó con `/read/`.
- Página de filtrado por tag (`/tags/[tag]/`). Las pills de esta spec no llevan a ningún sitio.
- Widget de información de banda (país, bandera) que el sitio actual muestra en `#infoBandas`: no
  existe ese dato en `bands` y no se migra en esta spec.
- Botones «VIEW ONLY VIDEO» / «SHORT VIDEO» y sus rutas `/videos/` y `/shorts/`.
- Pestaña «TRANSLATED» de la letra (depende de Google Translate, excluido del proyecto).
- Compartir en redes (ShareThis), anuncios y GTM — mismo criterio de SPEC 01: se posponen a una
  spec posterior de analítica/publicidad.
- Incrementar `views` en cada visita — se mantiene la decisión de SPEC 01 de mostrar el valor
  migrado sin tocarlo.

## Modelo de datos

Un cambio de esquema sobre lo que dejó SPEC 01:

```ts
// src/db/schema.ts — stories
publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow()
```

- Se agrega con una migración de Drizzle (`drizzle-kit generate` + `drizzle-kit migrate`).
- `scripts/seed.ts` solo la fija **en el insert inicial** de cada historia (no la pisa en
  corridas posteriores, para mantener la idempotencia por `legacyId`). Como el dump legacy no
  trae fecha real por historia, las 75 comparten la fecha de la primera corrida del seed — es una
  fecha de migración honesta, no una fecha editorial inventada por canción.

Sin tablas nuevas. Las consultas nuevas en `src/db/queries.ts`:

```ts
getStoryBySlugs(bandSlug, storySlug)
  // -> { id, title, subtitle, album, youtubeId, bodyHtml, lyrics, faqs, coverPath,
  //      views, publishedAt, band: {slug, name, logoPath}, tags: [{slug, name}] } | null

getPopularStories(limit, offset, excludeId?)
  // extensión de la función existente: WHERE id != excludeId cuando se pasa

getRelatedStories(storyId, tagSlugs: string[], limit)
  // historias (distintas de storyId) que comparten al menos un tag con tagSlugs,
  // deduplicadas, ordenadas por cantidad de tags compartidos desc y luego por views desc
```

**Plantillas de las 4 preguntas del FAQ** (el texto de la pregunta se genera en código, no se
guarda en la base — igual que hace el sitio actual):

1. `Who wrote {title}?` → `faqs.author`
2. `{band} {title} meaning` → `faqs.meaning`
3. `Curious facts on {title}` → `faqs.facts`
4. `{band} {title} lyrics` → visible: «See the full lyrics below ↓» (ancla a `#lyrics`). JSON-LD:
   usa `stories.lyrics` normalizado como `acceptedAnswer.text`, no el `faqs.lyrics` crudo (que
   trae la letra sin normalizar, con `'` como separador de línea, duplicando peor formateada la
   sección de Letra).

## Plan de implementación

1. Añadir `publishedAt` a `src/db/schema.ts`, generar y aplicar la migración. Verificación: la
   columna existe y acepta `NOT NULL DEFAULT now()`.
2. Actualizar `scripts/seed.ts` para fijar `publishedAt` solo en el insert inicial. Verificación:
   `SELECT count(*) FROM stories WHERE published_at IS NULL` devuelve 0 tras re-sembrar.
3. Escribir `getStoryBySlugs`, `getRelatedStories` y el `excludeId` opcional de `getPopularStories`
   en `src/db/queries.ts`. Verificación: `getStoryBySlugs('nirvana', 'polly')` devuelve la fila 77
   con sus 3 tags y su `faqs`.
4. Crear `src/app/read/[band]/[song]/page.tsx` con `generateStaticParams` (75 pares band/song) y
   `notFound()` si `getStoryBySlugs` devuelve `null`. Verificación: `npm run build` genera 75
   páginas estáticas bajo `/read/`.
5. Crear `src/shared/ui/Breadcrumb.tsx` (genérico, reutilizable) y montarlo con Home › Band › Song.
   Verificación: en Polly, el tercer nivel no es un enlace.
6. Crear `src/shared/sections/StoryHero.tsx`: título, banda, subtítulo, fecha (`publishedAt`
   formateada), vistas con el icono de ojo, logo de banda + álbum, iframe de YouTube, tags en
   pills. Verificación: visualmente clona el bloque superior de la página actual (fondo `#efefef`,
   cajas blancas).
7. Montar `YoutubeBanner` (de SPEC 01) entre el video y la letra.
8. Crear `src/shared/sections/StoryBody.tsx` que renderiza `bodyHtml` (ya sanitizado en SPEC 01)
   dentro de una caja blanca.
9. Crear `src/shared/sections/StoryLyrics.tsx` con `id="lyrics"`, solo el texto original de
   `lyrics` (sin pestañas).
10. Crear `src/shared/sections/StoryFaq.tsx` con las 4 preguntas visibles según las plantillas de
    arriba.
11. Crear `src/shared/sections/MostPopularStories.tsx` y `src/shared/sections/RelatedSongs.tsx`
    como Server Components que reutilizan `StoryCard` en una rejilla `grid-cols-4` (mismo patrón
    que `StoryGrid`), sin paginación. Verificación: en Polly, «Most Popular Stories» no incluye a
    Polly y muestra 8 fichas; «Related Songs» tampoco la incluye.
12. Montar todas las secciones en `src/app/read/[band]/[song]/page.tsx` en el orden: Breadcrumb →
    StoryHero (con video y tags) → YoutubeBanner → StoryBody → StoryLyrics → StoryFaq →
    MostPopularStories → RelatedSongs.
13. Añadir los JSON-LD `BreadcrumbList`, `BlogPosting` y `FAQPage` (con la regla especial de la
    4ª pregunta) y los metadatos SEO (`title`, `description`, `canonical`, Open Graph) vía
    `generateMetadata`.
14. Verificación final: recorrer los criterios de aceptación completos contra `/read/nirvana/polly/`
    y contra un slug inexistente.

## Criterios de aceptación

- [x] `npm run build` termina sin errores ni avisos de TypeScript, con las 75 páginas de
      `/read/[band]/[song]/` pre-renderizadas como estáticas.
- [x] `/read/nirvana/polly/` responde 200 y muestra título «Polly», banda «Nirvana», álbum
      «Nevermind (1991)» y el subtítulo exacto de la migración.
- [x] La fecha mostrada bajo el título coincide con `stories.publishedAt` de esa fila.
- [x] Las vistas mostradas son el valor estático (30) y no cambian tras recargar la página 3 veces.
- [x] El cuerpo renderiza `bodyHtml`, incluida la imagen `friend-fake.webp` servida desde
      `/stories/nirvana/polly/friend-fake.webp`.
- [x] La sección de letra (`id="lyrics"`) muestra `stories.lyrics` con saltos de línea y estrofas
      separadas, sin pestaña «TRANSLATED».
- [x] El FAQ visible muestra las 4 preguntas: «Who wrote Polly?» (Kurt Cobain), «Nirvana Polly
      meaning», «Curious facts on Polly», y «Nirvana Polly lyrics» con la respuesta «See the full
      lyrics below ↓» enlazando a `#lyrics`.
- [x] Los tags de la historia se muestran como pills sin enlace.
- [x] «Most Popular Stories» muestra 8 fichas por `views` descendente, sin incluir a Polly.
- [x] «Related Songs» muestra hasta 8 fichas que comparten al menos un tag con Polly, sin incluirla
      ni duplicados.
- [x] El logo de banda y el nombre de banda enlazan a `/bands/nirvana/`.
- [x] El JSON-LD `BreadcrumbList` tiene 3 niveles (Home, Nirvana, Polly) y valida sin errores.
- [x] El JSON-LD `BlogPosting` incluye `headline`, `description`, `image`, `datePublished` y
      `dateModified` coincidiendo con los datos de la historia.
- [x] El JSON-LD `FAQPage` tiene 4 preguntas; la última usa el texto normalizado de `stories.lyrics`
      como respuesta, no el `faqs.lyrics` crudo.
- [x] `/read/nirvana/cancion-inexistente/` devuelve 404.
- [x] `/read/banda-inexistente/polly/` devuelve 404.
- [x] Todo el texto visible de la página está en inglés.
- [x] Lighthouse en `/read/nirvana/polly/` da 90 o más en Performance, Accessibility y SEO en modo
      escritorio.

## Decisiones

- **Sí:** clonar la paleta visual del sitio actual (fondo `#efefef`, cajas blancas) solo dentro del
  contenido de esta ruta. El Header y Footer negros ya construidos en SPEC 01 no cambian — cada uno
  ya define su propio fondo, así que conviven sin tocar los tokens globales (`--bg` sigue negro).
- **No:** adoptar el tema oscuro del resto del sitio para esta página. El usuario pidió una réplica
  visual fiel del sitio actual para el contenido de la historia.
- **Sí:** generación estática (`generateStaticParams`) para las 75 páginas, igual que el home. El
  catálogo no cambia en runtime y esto da mejor SEO/rendimiento que renderizar por request.
- **Sí:** FAQ visible además del JSON-LD. Es contenido ya migrado y gratis, y mejora tanto UX como
  la coherencia del propio `FAQPage` (Google recomienda que el contenido del schema sea visible).
- **No:** mostrar `faqs.lyrics` crudo. Duplica, peor formateado, lo que ya muestra la sección de
  Letra; se reemplaza por un enlace ancla y el JSON-LD usa `stories.lyrics` normalizado.
- **No:** incrementar `views` en cada visita. Se mantiene la decisión de SPEC 01; evita que bots
  alteren «Most Popular Songs» sin ningún control anti-abuso.
- **Sí:** agregar `stories.publishedAt` con backfill en el seed. El sitio actual muestra una fecha
  y el `BlogPosting` la necesita; el dump legacy no la trae, así que se usa la fecha de migración.
- **No:** inventar una fecha editorial distinta por canción. No hay dato real que la respalde.
- **Sí:** video embebido directo (iframe siempre presente), sin miniatura ni clic previo. Es más
  simple que el patrón lazy-facade del sitio actual y no requiere JavaScript de cliente en esta
  página — todo puede ser Server Components.
- **No:** replicar los botones «VIEW ONLY VIDEO» / «SHORT VIDEO». Sus rutas (`/videos/`, `/shorts/`)
  no existen todavía.
- **Sí:** reutilizar `StoryCard` para «Most Popular Stories» y «Related Songs», en la misma rejilla
  `grid-cols-4` que ya usa `StoryGrid`. Consistente con «componentes reciclables» del `CLAUDE.md` y
  evita inventar una ficha angosta nueva solo para estos dos bloques.
- **No:** clonar el layout de tabla con sidebar fijo de 320px del sitio actual. Se apilan las
  secciones a ancho completo, como el resto del sitio nuevo — más simple y responsive; el pedido de
  «diseño muy parecido» se interpreta como paleta y contenido, no como el markup con `<table>`.
- **Sí:** quitar el nivel de álbum del breadcrumb. En el sitio actual ese enlace apunta a un dominio
  externo no relacionado (`youtubevideo.blog`), que se lee como un bug heredado, no como una
  decisión de diseño a replicar; tampoco existe una ruta `/albums/` en este proyecto.
- **Sí:** enlazar logo de banda y breadcrumb a `/bands/{band}/` aceptando 404, igual patrón que las
  fichas del home con `/read/` en SPEC 01.
- **No:** compartir en redes (ShareThis), anuncios y GTM. Mismo criterio que SPEC 01: se portan a
  una spec de analítica/publicidad posterior.
- **No:** pestaña «TRANSLATED» de la letra. Depende de Google Translate, ya excluido del proyecto.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Las 75 historias comparten la misma `publishedAt` (fecha de migración) | Aceptado y documentado. No hay fecha editorial real en el dump legacy que la reemplace. |
| Alguna historia puede quedar sin tags y «Related Songs» devolver 0 resultados | El componente maneja el caso vacío sin romper la página (no se muestra la sección, o se muestra un mensaje corto). |
| Los enlaces a `/bands/{band}/` devuelven 404 hasta la spec de bandas | Aceptado, mismo patrón que SPEC 01 con `/read/`. Se verifica el `href`, no la navegación. |
| `generateStaticParams` necesita la `DATABASE_URL` pública de Railway disponible en build | Mismo riesgo que SPEC 01; se resuelve al pasar a la URL interna en el despliegue. |

## Lo que **no** entra en esta spec

- Las páginas `/bands/[band]/` y `/videos/[band]/`.
- La página de filtrado por tag (`/tags/[tag]/`).
- El widget de información de banda (país, bandera).
- Los botones de video corto y video-solo, y sus rutas.
- La pestaña de letra traducida (Google Translate).
- Compartir en redes, anuncios y GTM.
- Incrementar el contador de vistas.

Cada uno, si llega, va en su propia spec.

## Notas de implementación

Desviaciones y observaciones surgidas al implementar. Ninguna cambió el alcance.

- **Tags de Polly:** la spec (Paso 3) dice 3 tags, pero en la base tiene 4 (`based on real events`,
  `controversial lyrics`, `curious fact`, `dark song`). Es un dato del seed; el código no depende de él.
- **«Fila 77»:** es el `legacyId` de Polly. Su `id` real en la base es 75.
- **Orden Letra → FAQ vs. «See the full lyrics below ↓»:** el Paso 12 pone la letra *antes* del FAQ,
  pero el texto exacto del criterio dice «below». Se implementó tal cual la spec; queda como
  incoherencia abierta (opciones: FAQ → Letra, o «above ↑»).
- **Helpers añadidos, no listados en el plan:** `getAllStorySlugs()` en `src/db/queries.ts` (necesaria
  para `generateStaticParams`), `src/shared/ui/StoryCardGrid.tsx` (rejilla compartida por
  «Most Popular Stories» y «Related Songs») y `src/lib/story-seo.ts` (constructores de metadatos y
  JSON-LD; escapa `<` al serializar).
- **`dateModified`:** no hay fecha de modificación en la base, así que es igual a `datePublished`.
- **`description` SEO:** sale de `subtitle` (recortado a 160 caracteres) y, si falta, de `faqs.meaning`.
- **Encabezados:** la letra usa «Lyrics» y el FAQ «FAQ»; la spec no fijaba el texto.
- **Lighthouse** (`/read/nirvana/polly/`, escritorio, `npx lighthouse@12`): una primera corrida dio
  Performance 87 (Speed Index 3.4 s, atribuido a ruido); tres corridas posteriores dieron
  Performance 99, Accessibility 100, SEO 100.
- **No verificado:** el JSON-LD se comprobó por estructura y campos, no con el validador externo de
  schema.org; tampoco se comparó visualmente contra el sitio original.
