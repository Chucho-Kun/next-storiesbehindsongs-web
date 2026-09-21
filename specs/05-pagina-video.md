# SPEC 05 — Página de video `/videos/[band]/[song]/`

> **Estado:** Implemented
> **Depende de:** SPEC 01, SPEC 02, SPEC 03
> **Fecha:** 2026-09-21
> **Objetivo:** Construir la página `/videos/{band}/{song}/`, alimentada desde PostgreSQL, que replica la
> de storiesbehindsongs.com (video de YouTube + título, banda, subtítulo, fecha y botón «READ FULL
> ARTICLE») con `VideoObject` y metadatos propios para que Google la indexe en la sección de videos.

## Por qué existe esta spec

El sitio original publica, por cada canción, una segunda URL `/videos/{band}/{song}/` cuyo único fin es
ser la página de aterrizaje del video para Google. Es una página deliberadamente ligera: el video, un
resumen y un botón hacia el artículo completo. El HTML del original (revisado el 2026-09-21) trae en el
`<head>` un `VideoObject`, un `BreadcrumbList` y un `FAQPage`; el resto (año, vistas, categorías, letra)
se rellena en el navegador con su API interna y en la práctica sale vacío.

El original también tiene fallos que **no se copian**:

- `<link rel="canonical">` apunta a `https://storiesbehindsongs.com/en/` en lugar de a la propia URL del
  video, lo que le dice a Google que la página no es la canónica.
- El breadcrumb incluye un nivel de año («1993») enlazado a `youtubevideo.blog`, un dominio caído.
- Carga AdSense, Google Translate, ShareThis, GTM y un reproductor de Dailymotion condicionado a la
  velocidad de conexión.

Aquí la página se pre-renderiza estática desde PostgreSQL, con canonical propio, y reutiliza `Breadcrumb`,
`getStoryBySlugs` y las utilidades SEO de la SPEC 02. No hay tablas ni migraciones nuevas.

Como `/read/{band}/{song}/` ya incrusta el mismo video, Google podría elegir cualquiera de las dos
páginas como destino del video. Para que la elegida sea `/videos/`, solo esta página lleva `VideoObject`
y `/read/` lo conserva como está (`BlogPosting`, sin `VideoObject`).

## Alcance

**Dentro:**

- Ruta `src/app/videos/[band]/[song]/page.tsx`, pre-renderizada de forma estática con
  `generateStaticParams` para las 75 historias (reutiliza `getAllStorySlugs`). `notFound()` si el par
  banda/canción no existe.
- Orden de la página (como el original, con el fondo `#efefef` de `/read/`; Header y Footer negros no
  cambian): `VideoEmbed` → `Breadcrumb` (Home › {Band} › {Song}) → título (`h1`), banda (`h2`, enlaza a
  `/bands/{band}/`) y subtítulo → fecha de publicación y vistas → botón «READ FULL ARTICLE» hacia
  `/read/{band}/{song}/`.
- Nuevo `src/shared/ui/VideoEmbed.tsx`: `iframe` de YouTube `https://www.youtube.com/embed/{youtubeId}`
  en relación 16:9, con `title` y prop `loading` (`eager` en la página de video, `lazy` en `/read/`).
- Nuevo `src/shared/sections/VideoHero.tsx`: bloque de título, banda, subtítulo, fecha y vistas de la
  página de video.
- Nuevo `src/shared/ui/LinkButton.tsx`: botón-enlace rojo reciclable (lo usan «READ FULL ARTICLE» y
  «VIEW ONLY VIDEO»).
- `StoryHero` (`/read/`) pasa a usar `VideoEmbed` y añade el botón «VIEW ONLY VIDEO» hacia
  `/videos/{band}/{song}/`. Es el enlace interno que permite a Google descubrir estas URLs.
- Nuevo `src/lib/video-seo.ts` con `videoPath`, `buildVideoMetadata`, `buildVideoBreadcrumbJsonLd` y
  `buildVideoObjectJsonLd` (reutiliza `SITE_URL`, `truncate` y `jsonLdString` de `src/lib/story-seo.ts`).
- Metadatos SEO: `title` `{Song} by {Band} (Video)`, `description` (subtítulo ≤160 caracteres, con el
  mismo respaldo que `/read/`), `canonical` propio, Open Graph `video.other` con `og:video` al embed.
- JSON-LD `VideoObject` (`name`, `description`, `thumbnailUrl`, `uploadDate`, `contentUrl`, `embedUrl`) y
  `BreadcrumbList` de 3 niveles.

**Fuera de alcance (para specs futuras):**

- Página índice `/videos/` y `/videos/{band}/`. Hasta que existan, ambas rutas devuelven 404 y el
  breadcrumb enlaza a `/bands/{band}/`, no a `/videos/{band}/`.
- Shorts (`shortId`, `shortRange`) y el botón «SHORT VIDEO».
- `sitemap-videos.xml`, `sitemap.xml`, `robots.txt` y RSS: van juntos en la spec de sitemap que reserva
  CLAUDE.md.
- `FAQPage` JSON-LD, letra y cuerpo del artículo en esta URL (evita contenido duplicado con `/read/`).
- Nivel de año en el breadcrumb (la BD no guarda el año por historia).
- `duration` del `VideoObject`: la BD no guarda la duración del video.
- Compartir en redes (ShareThis), AdSense, GTM, Meta Pixel, Google Translate y el reproductor de
  Dailymotion.
- Botón «Back to top».
- Incrementar `views` por visita (sigue estático, como en SPEC 02).
- Rutas en español y redirecciones desde las URLs legacy (`/videos/bandas.php`).

## Modelo de datos

Esta spec no introduce tablas, columnas ni migraciones ni consultas nuevas. Reutiliza `StoryDetail`,
`getStoryBySlugs` y `getAllStorySlugs` de la SPEC 02 (`youtubeId`, `title`, `subtitle`, `publishedAt`,
`views`, `coverPath`, `band`).

Contratos nuevos:

```ts
// src/lib/video-seo.ts
videoPath(story)                 // -> `/videos/${band.slug}/${slug}/`
buildVideoMetadata(story)        // -> Metadata (title, description, canonical, openGraph video.other)
buildVideoBreadcrumbJsonLd(story) // -> BreadcrumbList: Home › {Band} › {Song}
buildVideoObjectJsonLd(story)
// -> {
//   "@type": "VideoObject",
//   name: `${title} - ${band}`,
//   description,                                  // mismo texto que la meta description
//   thumbnailUrl: [`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`, `${SITE_URL}${coverPath}`],
//   uploadDate: publishedAt.toISOString(),
//   contentUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
//   embedUrl:   `https://www.youtube.com/embed/${youtubeId}`,
// }

// src/shared/ui/VideoEmbed.tsx
VideoEmbed({ youtubeId: string, title: string, loading?: "eager" | "lazy" })

// src/shared/ui/LinkButton.tsx
LinkButton({ href: string, children: ReactNode })  // Link estilizado como botón rojo
```

## Plan de implementación

1. Crear `src/shared/ui/VideoEmbed.tsx` y migrar el `iframe` de `StoryHero` a él (`loading="lazy"`).
   Verificación: `/read/nirvana/polly/` sigue mostrando el mismo video, con el mismo `src`.
2. Crear `src/shared/ui/LinkButton.tsx` (enlace rojo, texto en mayúsculas, foco visible). Verificación:
   compila y aún no se usa.
3. Crear `src/lib/video-seo.ts` con `videoPath`, `buildVideoMetadata`, `buildVideoBreadcrumbJsonLd` y
   `buildVideoObjectJsonLd`. Verificación: compila y aún no se usa.
4. Crear `src/shared/sections/VideoHero.tsx` (título, banda enlazada, subtítulo, fecha en formato
   «January 26, 2026» y vistas con `/brand/eye.svg`, iguales a `StoryHero`).
5. Crear `src/app/videos/[band]/[song]/page.tsx` con `generateStaticParams`, `notFound()`,
   `generateMetadata`, los dos JSON-LD y el orden `VideoEmbed` → `Breadcrumb` → `VideoHero` →
   `LinkButton` «READ FULL ARTICLE». Verificación: `/videos/nirvana/polly/` responde 200.
6. Añadir el botón «VIEW ONLY VIDEO» a `StoryHero` con `LinkButton` y `videoPath`. Verificación: en
   `/read/nirvana/polly/` el botón lleva a `/videos/nirvana/polly/`.
7. Verificación final: recorrer los criterios de aceptación contra `/videos/nirvana/polly/`, un slug
   inexistente y `/read/nirvana/polly/`.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores ni avisos de TypeScript y pre-renderiza 75 páginas
      `/videos/[band]/[song]/`.
- [ ] `/videos/nirvana/polly/` responde 200 y muestra título «Polly», banda «Nirvana», el subtítulo, la
      fecha igual a `publishedAt` y las vistas igual a `stories.views`.
- [ ] El `iframe` de la página tiene `src="https://www.youtube.com/embed/{youtubeId}"` con el
      `youtubeId` de la fila de Polly y un `title` no vacío.
- [ ] El video aparece antes que el título en el DOM, y los elementos siguen el orden: video,
      breadcrumb, `h1`, `h2`, subtítulo, fecha/vistas, botón.
- [ ] El breadcrumb tiene 3 niveles (Home, Nirvana, Polly); Home y Nirvana enlazan a `/` y
      `/bands/nirvana/`, y no hay ningún enlace a `youtubevideo.blog`.
- [ ] El botón «READ FULL ARTICLE» enlaza a `/read/nirvana/polly/` y ese destino responde 200.
- [ ] `<link rel="canonical">` es `https://storiesbehindsongs.com/videos/nirvana/polly/` y ninguna
      página de video tiene canonical hacia otra URL.
- [ ] `<title>` es «Polly by Nirvana (Video)» más el sufijo del layout, distinto del `<title>` de
      `/read/nirvana/polly/`; la `description` está presente y mide 160 caracteres o menos.
- [ ] Open Graph tiene `og:type` `video.other`, `og:url` y `og:video` con la URL de embed.
- [ ] El JSON-LD `VideoObject` incluye `name`, `description`, `thumbnailUrl`, `uploadDate` (igual a
      `publishedAt` en ISO 8601), `contentUrl` y `embedUrl`, y no incluye `duration`.
- [ ] El JSON-LD `BreadcrumbList` tiene 3 niveles con URLs absolutas.
- [ ] La página no contiene `FAQPage`, `BlogPosting` ni scripts de AdSense, GTM, ShareThis o Google
      Translate.
- [ ] `/read/nirvana/polly/` muestra el botón «VIEW ONLY VIDEO» hacia `/videos/nirvana/polly/` y su
      HTML no contiene `VideoObject`.
- [ ] `/videos/nirvana/cancion-inexistente/` devuelve 404.
- [ ] Todo el texto visible está en inglés.
- [ ] Lighthouse en `/videos/nirvana/polly/` da 90 o más en Performance, Accessibility y SEO
      (escritorio).

## Decisiones

- **Sí:** página ligera como el original (video, encabezado y botón), sin cuerpo, letra ni FAQ. Fue la
  opción elegida por el usuario. Mantiene esta URL como «página de video» y evita contenido duplicado
  con `/read/`.
- **No:** «Original + FAQ» y «página completa». El FAQ y el cuerpo ya viven en `/read/`; repetirlos
  añade solape sin mejorar la indexación del video.
- **Sí:** canonical propio a `/videos/{band}/{song}/`. El del original apunta a `/en/`, que es un error;
  con él Google no trataría esta URL como la página del video.
- **Sí:** breadcrumb `Home › {Band} › {Song}`, sin nivel de año. La BD no guarda el año por historia y
  derivarlo de `albums` por nombre sería un cruce frágil para un enlace que en el original ni funciona.
- **No:** enlazar el breadcrumb a `/videos/{band}/`. Esa ruta no existe todavía; enlaza a
  `/bands/{band}/`, que sí.
- **Sí:** botón «VIEW ONLY VIDEO» en `StoryHero`. Google descubre las URLs de video por enlaces
  internos y sin él estas 75 páginas quedarían huérfanas hasta la spec de sitemap. Es un botón que
  SPEC 01 dejó fuera de alcance.
- **No:** sitemap de videos en esta spec. CLAUDE.md reserva sitemap/robots/RSS para una spec posterior;
  el JSON-LD y el enlazado interno cubren lo que se pidió ahora.
- **Sí:** solo `/videos/` lleva `VideoObject`; `/read/` no. Evita que Google tenga dos candidatas para
  el mismo video.
- **Sí:** `thumbnailUrl` como lista: miniatura de YouTube (`i.ytimg.com`, como el original) y la portada
  local `.webp` del sitio. Si el video se borra de YouTube, la portada propia sigue accesible.
- **Sí:** añadir `embedUrl` al `VideoObject`. El original solo pone `contentUrl` y un `WatchAction`;
  Google recomienda ambos y no requiere el `WatchAction`.
- **Sí:** extraer `VideoEmbed` y `LinkButton` a `src/shared/ui/` y reutilizarlos en `/read/`. Cumple
  «componentes reciclables» del CLAUDE.md y evita copiar el `iframe` y el botón.
- **Sí:** `VideoEmbed` con `loading="eager"` en esta página, porque el video es el elemento principal y
  se ve sin desplazarse; `lazy` en `/read/`, donde queda más abajo.
- **Sí:** generación estática con `generateStaticParams`, como `/read/` y `/bands/`.
- **Sí:** fondo `#efefef` en el contenido, como el original y como `/read/`.
- **No:** AdSense, ShareThis, GTM, Google Translate y Dailymotion. Son parte de otras piezas de
  CLAUDE.md y del fuera de alcance de SPEC 01; añaden peso a una página cuyo objetivo es indexar el
  video.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Google elige `/read/` en lugar de `/videos/` como página del video | Solo `/videos/` lleva `VideoObject`; el video es su contenido principal y va antes que el texto. Si no basta, se revisará en Search Console. |
| Un video eliminado de YouTube deja `thumbnailUrl` y `contentUrl` rotos (ya ocurre con 5 álbumes de la SPEC 03) | `thumbnailUrl` incluye la portada propia `.webp`. Comprobar las 75 miniaturas queda para una revisión posterior. |
| Sin `duration` el `VideoObject` queda incompleto para las funciones de video de Google | Es un campo recomendado, no obligatorio. Añadirlo exige una columna nueva y una fuente de datos; queda para otra spec. |
| Las 75 páginas son delgadas (video + subtítulo) | Es el diseño del original y lo elegido por el usuario. Si Google las considera de poco valor, se añade el FAQ en una spec posterior. |
| Las URLs no se descubren hasta que exista el sitemap | El botón «VIEW ONLY VIDEO» de `/read/` es el enlace interno que las descubre. |
| El JSON-LD no se ha validado con el Rich Results Test | Queda como verificación manual posterior; no bloquea la implementación. |

## Lo que **no** entra en esta spec

- `/videos/` y `/videos/{band}/`, shorts y el botón «SHORT VIDEO».
- `sitemap-videos.xml`, `sitemap.xml`, `robots.txt` y RSS.
- `FAQPage`, letra y cuerpo del artículo en la página de video.
- `duration` del video y nivel de año en el breadcrumb.
- ShareThis, AdSense, GTM, Meta Pixel, Google Translate y Dailymotion.
- Contador de vistas por visita, rutas en español y redirecciones legacy.

Cada uno, si llega, va en su propia spec.
