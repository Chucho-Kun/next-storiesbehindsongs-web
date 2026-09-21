# SPEC 04 — Páginas de tags `/tags/` y `/tags/[tag]/`

> **Estado:** Implemented
> **Depende de:** SPEC 01, SPEC 02, SPEC 03
> **Fecha:** 2026-09-21
> **Objetivo:** Convertir los tags en enlaces navegables: cada pill lleva a `/tags/{tag}/`, una página
> alimentada desde PostgreSQL que muestra las historias que llevan ese tag y los tags que comparten
> historias con él, más un índice `/tags/` con todos los tags.

## Por qué existe esta spec

Hoy los tags son pills sin enlace: aparecen en «Popular Tags» del home (`PopularTags`) y bajo el
título de cada historia (`StoryHero`), pero no llevan a ningún sitio. Las SPEC 02 y 03 dejaron
`/tags/[tag]/` explícitamente fuera de alcance y aceptaron esa pill inerte. Esta spec cierra el hueco.

Los datos ya existen (`tags` y `story_tags` de SPEC 01), así que no hay tablas ni migraciones nuevas.
Todo el trabajo es consultas, una ruta, un componente de pill reciclable y SEO.

El «vínculo entre tags» se resuelve por **coocurrencia**: dos tags están vinculados si comparten al
menos una historia. La página de un tag lista los tags vinculados como pills clicables, de modo que se
puede navegar tag → tag sin volver a una historia. No hay relaciones curadas a mano.

## Alcance

**Dentro:**

- Ruta `src/app/tags/[tag]/page.tsx`, pre-renderizada de forma estática con `generateStaticParams`
  para todos los tags que tengan al menos una historia. `notFound()` si el slug no existe.
- Ruta `src/app/tags/page.tsx` (índice): todos los tags con su número de historias, ordenados por
  número de historias descendente y luego por nombre.
- Componente reciclable `src/shared/ui/TagPill.tsx`: pill como `Link` a `/tags/{slug}/`, con variante
  para fondo oscuro y para el fondo `#efefef` de `/read/`, y contador opcional.
- `PopularTags` (home) y `StoryHero` (`/read/{band}/{song}/`) pasan a usar `TagPill`. Las pills dejan
  de ser inertes.
- Enlace «View all tags» al final de `PopularTags` hacia `/tags/`.
- Página de un tag, en este orden: `Breadcrumb` (Home › Tags › {Tag}) → encabezado con nombre del tag
  y número de historias → `RelatedTags` (pills de tags vinculados) → `StoryGrid`
  «Recent Articles: {Tag}» → `StoryGrid` «Most Popular Songs: {Tag}».
- Nueva sección `src/shared/sections/RelatedTags.tsx`: hasta 12 tags que comparten historias con el
  actual, ordenados por historias en común descendente y luego por nombre. Si no hay ninguno, la
  sección no se muestra.
- Consultas nuevas en `src/db/queries.ts`: `getTagBySlug`, `getAllTagSlugs`, `getAllTags`,
  `getRelatedTags`, y el filtro opcional `tagSlug` en `getRecentStories` y `getPopularStories`.
- Extensión de `src/app/api/stories/route.ts` con el parámetro opcional `tag` (slug), para que los
  dos `StoryGrid` paginen 20 + «VIEW MORE».
- Metadatos SEO por tag (`title`, `description`, `canonical`, Open Graph) y JSON-LD `BreadcrumbList`
  y `CollectionPage`. Metadatos y `BreadcrumbList` para el índice.
- Fondo: tema oscuro del sitio (como `/bands/[band]/`).

**Fuera de alcance (para specs futuras):**

- Filtrar por varios tags a la vez (`/tags/a+b/`). Cada página filtra por un solo tag.
- Relaciones de tags curadas a mano o tabla `tag_relations`.
- Descripciones editoriales por tag.
- Editar, fusionar o renombrar tags (panel de administración).
- Un enlace a `/tags/` en el Header o el Footer.
- Tags en las fichas (`StoryCard`) o en los resultados de búsqueda.
- Buscar tags desde el buscador del Header.
- `sitemap.xml`, `robots.txt` y RSS (spec posterior, ver CLAUDE.md).
- Rutas en español.

## Modelo de datos

Esta spec no introduce tablas, columnas ni migraciones. Reutiliza `tags` y `story_tags` de SPEC 01.

Consultas nuevas y extendidas en `src/db/queries.ts`:

```ts
getTagBySlug(slug)
  // -> { id, slug, name, storyCount } | null   (storyCount = historias con ese tag)

getAllTagSlugs()
  // -> string[]   solo tags con al menos una historia

getAllTags()
  // -> [{ slug, name, count }] por count desc, name asc   (para /tags/)

getRelatedTags(tagSlug, limit)
  // -> [{ slug, name, sharedCount }]
  // tags distintos de tagSlug que comparten historias con él; sharedCount = historias en común;
  // orden: sharedCount desc, name asc

getRecentStories(limit, offset, bandSlug?, tagSlug?)             // extensión: filtro por tag
getPopularStories(limit, offset, excludeId?, bandSlug?, tagSlug?) // extensión equivalente
```

- El filtro por `tagSlug` usa `EXISTS` sobre `story_tags` + `tags`, no un `JOIN`, para no duplicar
  historias ni alterar `limit`/`offset`.
- `bandSlug` y `tagSlug` son combinables aunque esta spec solo use uno a la vez.
- El tipo `PopularTag` existente (`{ slug, name, count }`) se reutiliza para `getAllTags`.

Contrato del componente:

```ts
// src/shared/ui/TagPill.tsx
TagPill({ tag: { slug: string; name: string }, count?: number, variant?: "dark" | "light" })
// -> <Link href={`/tags/${slug}/`}> con el nombre y, si se pasa, el conteo
```

## Plan de implementación

1. Escribir `getTagBySlug`, `getAllTagSlugs`, `getAllTags` y `getRelatedTags` en `src/db/queries.ts`.
   Verificación: `getTagBySlug('dark-song')` devuelve el tag con su `storyCount`;
   `getRelatedTags('dark-song', 12)` no contiene a `dark-song` ni duplicados.
2. Añadir el filtro opcional `tagSlug` a `getRecentStories` y `getPopularStories`. Verificación:
   `getRecentStories(20, 0, undefined, 'dark-song')` solo devuelve historias que llevan ese tag y su
   longitud coincide con `storyCount` (o 20 si es mayor).
3. Extender `src/app/api/stories/route.ts` con `tag`, validado contra el patrón de slug. Verificación:
   `/api/stories/?section=recent&tag=dark-song` devuelve solo historias de ese tag;
   `&tag=DARK%20SONG` responde 400.
4. Comprobar que los 51 slugs de `tags` cumplen `SLUG_PATTERN` (consulta puntual, sin código nuevo).
   Si alguno no lo cumple, ajustar el patrón de `tag` en la ruta antes de seguir.
5. Crear `src/shared/ui/TagPill.tsx` (enlace a `/tags/{slug}/`, variantes `dark` y `light`, conteo
   opcional). Verificación: el componente compila y no se usa aún.
6. Migrar `PopularTags` y `StoryHero` a `TagPill`. Verificación: en el home y en
   `/read/nirvana/polly/` las pills tienen `href` a `/tags/{slug}/` y conservan su aspecto.
7. Crear `src/shared/sections/RelatedTags.tsx` (Server Component sobre `getRelatedTags`, usa `TagPill`
   con conteo). No se renderiza si la lista está vacía.
8. Crear `src/lib/tag-seo.ts` con `tagPath`, `buildTagMetadata`, `buildTagBreadcrumbJsonLd` y
   `buildTagCollectionJsonLd` (reutilizando `SITE_URL`, `truncate` y el escape de `<` de
   `src/lib/story-seo.ts`).
9. Crear `src/app/tags/[tag]/page.tsx` con `generateStaticParams`, `notFound()`, `generateMetadata`,
   los JSON-LD y el orden: Breadcrumb → encabezado → `RelatedTags` → `StoryGrid` «Recent Articles:
   {Tag}» (`baseUrl` con `section=recent&tag={slug}`) → `StoryGrid` «Most Popular Songs: {Tag}»
   (`section=popular&tag={slug}`). Verificación: `/tags/dark-song/` responde 200 con ambas grids.
10. Crear `src/app/tags/page.tsx` (índice) con `TagPill` y conteo por cada tag, metadatos y
    `BreadcrumbList`, y añadir el enlace «View all tags» en `PopularTags`. Verificación: `/tags/`
    lista los 51 tags y cada uno lleva a su página.
11. Verificación final: recorrer los criterios de aceptación contra `/tags/dark-song/`, `/tags/` y un
    slug inexistente.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores ni avisos de TypeScript y pre-renderiza una página
      `/tags/[tag]/` por cada tag con al menos una historia (51 hoy) más `/tags/`.
- [ ] Las pills de «Popular Tags» en el home enlazan a `/tags/{slug}/` y ya no son texto plano.
- [ ] Las pills de `/read/nirvana/polly/` enlazan a `/tags/{slug}/`: `based-on-real-events`,
      `controversial-lyrics`, `curious-fact` y `dark-song`.
- [ ] `/tags/dark-song/` responde 200 y muestra el nombre del tag y un número de historias igual al
      `count(*)` de `story_tags` para ese tag.
- [ ] «Recent Articles: {Tag}» muestra solo historias que llevan el tag, por `id` descendente, hasta
      20 fichas, y «VIEW MORE» aparece solo si el tag tiene más de 20 historias y carga las
      siguientes sin historias ajenas al tag ni repetidas.
- [ ] «Most Popular Songs: {Tag}» muestra solo historias que llevan el tag, por `views` descendente.
- [ ] `Polly` aparece en `/tags/dark-song/` y en cada una de las páginas de sus otros 3 tags.
- [ ] «Related Tags» de `/tags/dark-song/` no incluye a `dark-song`, no repite tags y cada tag
      listado comparte al menos una historia con él; el orden es por historias en común descendente.
- [ ] Un tag de la lista de «Related Tags» lleva a su propia página `/tags/{slug}/` con `200`.
- [ ] `/tags/` lista los 51 tags con su conteo, ordenados por conteo descendente y luego por nombre.
- [ ] «View all tags» en el home lleva a `/tags/`.
- [ ] `/tags/etiqueta-inexistente/` devuelve 404.
- [ ] `/api/stories/?section=recent&tag=dark-song` devuelve solo historias de ese tag y
      `&tag=INVALIDO%20!` responde 400.
- [ ] El JSON-LD `BreadcrumbList` de `/tags/dark-song/` tiene 3 niveles (Home, Tags, {Tag}) y
      `CollectionPage` incluye `name`, `url` y `description`.
- [ ] `<title>`, `description` y `canonical` (`/tags/dark-song/`) de la página están presentes y
      sin valores por defecto del layout.
- [ ] Todo el texto visible está en inglés.
- [ ] Lighthouse en `/tags/dark-song/` da 90 o más en Performance, Accessibility y SEO (escritorio).

## Decisiones

- **Sí:** rutas `/tags/` y `/tags/[tag]/` con prefijo plural, igual que `/bands/[band]/`. Es la ruta
  que SPEC 02 y 03 ya nombraban como pendiente.
- **Sí:** vínculo entre tags por coocurrencia en `story_tags`, calculado por SQL. No requiere datos
  nuevos y cubre lo pedido: entrar a una historia, ver sus tags, hacer clic y ver las historias que
  llevan ese tag, y saltar de ahí a tags vinculados.
- **No:** tabla `tag_relations` curada a mano. Exige admin o seed manual para un beneficio que la
  coocurrencia ya da gratis con 75 historias.
- **Sí:** pills clicables en home, en la historia y dentro de la página de tag, más índice `/tags/`.
  Respuesta directa del usuario a «dónde enlazar».
- **Sí:** un solo tag por página. La petición original habla de «esos tags» al describir varias pills
  en una historia, pero cada clic filtra por el tag pulsado; filtrar por combinación queda fuera.
- **Sí:** dos `StoryGrid` («Recent Articles: {Tag}» y «Most Popular Songs: {Tag}»), como en
  `/bands/[band]/`. Reutiliza `StoryGrid` y `StoryCard` con un filtro `tag` en consultas y API, sin
  componentes de rejilla nuevos.
- **No:** un solo grid ni pestañas Recent/Popular. Los pares de grids ya son el patrón del sitio y las
  pestañas exigirían estado de cliente nuevo.
- **Sí:** `TagPill` como componente reciclable en `src/shared/ui/`, con variante clara para el fondo
  `#efefef` de `/read/`. Cumple «componentes reciclables» del CLAUDE.md y evita tres copias de la pill.
- **Sí:** generación estática con `generateStaticParams`, como el home, `/read/` y `/bands/`. El
  catálogo de tags no cambia en runtime.
- **Sí:** SEO completo en todas las páginas de tag, sin `noindex` para tags con pocas historias. Fue la
  opción elegida por el usuario; el riesgo de contenido delgado se anota abajo.
- **Sí:** `EXISTS` en el filtro por tag en vez de `JOIN`. Evita duplicados y no falsea la paginación.
- **Sí:** enlace «View all tags» solo en `PopularTags`. Sin él el índice no sería alcanzable desde la
  navegación.
- **No:** enlace a `/tags/` en Header o Footer. Cambiar la navegación global es otra decisión de diseño.
- **Sí:** fondo oscuro del sitio, como `/bands/[band]/`. El fondo `#efefef` de SPEC 02 es solo del
  contenido de una historia.
- **Nota:** los slugs de tag de los criterios (`dark-song`, `based-on-real-events`…) se derivan de los
  nombres vistos en Polly; el Paso 4 comprueba que coincidan con los datos reales antes de darlos por
  buenos.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Tags con una o dos historias generan páginas de contenido delgado para buscadores | Aceptado por decisión del usuario. Si afecta al SEO, se añade `noindex` por umbral en una spec posterior; no requiere cambiar datos. |
| Algún slug de `tags` no cumple `SLUG_PATTERN` de la API y el «VIEW MORE» fallaría con 400 | El Paso 4 comprueba los 51 slugs antes de construir las páginas y, si hace falta, ajusta el patrón. |
| Un tag con 20 historias exactas muestra «VIEW MORE» y la siguiente carga viene vacía | Mismo comportamiento heredado de `StoryGrid` en SPEC 01 y 03; la carga vacía oculta el botón. |
| `getRelatedTags` devuelve tags genéricos («curious fact») que vinculan casi todo | El orden por historias en común y el tope de 12 lo acotan; refinar el criterio sería otra spec. |
| Un tag sin ninguna historia rompería `generateStaticParams` o mostraría una página vacía | `getAllTagSlugs` y `getAllTags` solo devuelven tags con al menos una historia. |

## Lo que **no** entra en esta spec

- Filtrar por varios tags a la vez.
- Relaciones de tags curadas a mano o tabla `tag_relations`.
- Descripciones editoriales por tag y panel de administración de tags.
- Enlace a `/tags/` en Header o Footer, o tags dentro de `StoryCard`.
- Buscar tags desde el buscador.
- `sitemap.xml`, `robots.txt` y RSS.
- Rutas en español.

Cada uno, si llega, va en su propia spec.
