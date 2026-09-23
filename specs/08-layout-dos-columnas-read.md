# SPEC 08 — Layout de dos columnas en la página de historia

> **Estado:** Approved
> **Depende de:** SPEC 02, SPEC 07
> **Fecha:** 2026-09-22
> **Objetivo:** Dividir el contenido de `/read/[band]/[song]/` en dos columnas — texto a la izquierda y un sidebar de recomendaciones "Most Popular Stories" a la derecha — que se apilan verticalmente en móvil.

## Por qué existe esta spec

Hoy `/read/[band]/[song]/` renderiza todo su contenido (hero, cuerpo, letra, FAQ y las secciones "Most Popular Stories" / "Related Songs") en una sola columna a todo el ancho (`max-w-6xl`), como un único bloque de texto. El usuario compartió dos capturas del sitio original: `screenshots/columna1.png` (la columna de texto, que ya coincide con lo implementado en SPEC 02) y `screenshots/columna2.png` (un sidebar "MOST POPULAR STORIES" con fichas verticales, caja blanca con borde, barra roja superior y separadores entre fichas). Esta spec reestructura la página en un grid de 2 columnas y reemplaza las secciones de recomendaciones actuales por ese sidebar.

## Alcance

**Dentro:**

- `src/app/read/[band]/[song]/page.tsx` pasa de una columna (`flex flex-col`) a un grid de 2 columnas en `md:` (≥768px): columna 1 (~2/3 del ancho) y columna 2 (~1/3), usando el mismo `max-w-6xl` de contenedor. Por debajo de `md`, columna 2 se apila debajo de columna 1 (comportamiento natural de columnas en una sola fila cuando no hay grid de 2 columnas).
- Columna 1 conserva **todo** el contenido actual sin cambios de props ni de datos: `Breadcrumb`, `StoryHero`, `YoutubeBanner`, `StoryBody`, `StoryLyrics`, `StoryFaq`.
- Columna 2 no es sticky: se desplaza junto con el resto de la página.
- Nuevo componente `src/shared/ui/SidebarStoryCard.tsx`: ficha fiel a `columna2.png` — logo pequeño de la banda junto al título (enlace a `/read/[band]/[song]/`), línea con nombre de banda + álbum/año y vistas, subtítulo, imagen de portada a ancho completo. Reutiliza el tipo `StoryCard` de `src/db/queries.ts` (mismos campos que ya usa `StoryCard.tsx`: `title`, `subtitle`, `album`, `coverPath`, `views`, `band.{slug,name,logoPath}`).
- Nuevo componente `src/shared/sections/PopularStoriesSidebar.tsx`: obtiene los datos (`getPopularStories(8, 0, excludeId)`, igual que hace hoy `MostPopularStories`) y renderiza la caja del sidebar: fondo blanco, borde, barra roja superior (`bg-[var(--title-red)]` o equivalente), título "MOST POPULAR STORIES" centrado en mayúsculas, y las 8 fichas `SidebarStoryCard` separadas por líneas divisorias horizontales (`divide-y`).
- Se excluye siempre la historia actual (`excludeId={story.id}`), igual que hoy.
- Se eliminan del render de la página las secciones "Most Popular Stories" y "Related Songs" a ancho completo; `PopularStoriesSidebar` las reemplaza a ambas (no hay recomendaciones por tags en esta spec, solo por popularidad).
- Se eliminan los componentes que quedan sin uso tras el cambio: `src/shared/sections/MostPopularStories.tsx`, `src/shared/sections/RelatedSongs.tsx`, `src/shared/ui/StoryCardGrid.tsx`.
- `getRelatedStories` en `src/db/queries.ts` se conserva sin cambios aunque quede sin llamadores, por si una spec futura la reutiliza (no se borra código de acceso a datos que no rompe el build).

**Fuera de alcance (para specs futuras):**

- `/videos/[band]/[song]/` (SPEC 05): no cambia su layout en esta spec.
- Cualquier otra página del sitio (home, banda, tags, búsqueda): sus secciones de recomendaciones actuales no cambian.
- Recomendaciones por tags/relacionadas ("Related Songs"): se elimina la sección; si se quiere recuperar como parte del sidebar o en otro lugar, va en una spec futura.
- Paginación ("VIEW MORE") dentro del sidebar: queda fijo en 8 fichas.
- Comportamiento sticky del sidebar al hacer scroll.
- Rediseño de `StoryCard.tsx` (usado en grids de home/banda/tags): no se toca, `SidebarStoryCard` es un componente nuevo e independiente.

## Modelo de datos

Esta spec no introduce tablas, columnas ni queries nuevas. Reutiliza `getPopularStories` (ya existente en `src/db/queries.ts`) y el tipo `StoryCard` que ya expone todos los campos necesarios para la nueva ficha.

## Plan de implementación

1. Crear `src/shared/ui/SidebarStoryCard.tsx`: recibe una `StoryCard` y renderiza el layout de `columna2.png` (logo + título enlazado, banda/álbum + vistas, subtítulo, imagen ancha). Verificación: componente compila sin usarse aún.
2. Crear `src/shared/sections/PopularStoriesSidebar.tsx`: llama `getPopularStories(8, 0, excludeId)`, renderiza la caja blanca con borde y barra roja superior, título "MOST POPULAR STORIES" y la lista de `SidebarStoryCard` con `divide-y` entre fichas; devuelve `null` si no hay resultados (igual que `MostPopularStories` hoy). Verificación: componente compila sin usarse aún.
3. Actualizar `src/app/read/[band]/[song]/page.tsx`: envolver `StoryHero`/`YoutubeBanner`/`StoryBody`/`StoryLyrics`/`StoryFaq` en un `<div>` (columna 1) y agregar `<PopularStoriesSidebar excludeId={story.id} />` en un `<div>` (columna 2), ambos dentro de un contenedor `grid grid-cols-1 md:grid-cols-3 gap-6` (columna 1 con `md:col-span-2`). `Breadcrumb` queda fuera del grid, a todo el ancho, como hoy. Quitar los imports y el render de `MostPopularStories` y `RelatedSongs`. Verificación: `npm run build` compila; `/read/nirvana/polly/` en desktop (≥768px) muestra 2 columnas.
4. Borrar `src/shared/sections/MostPopularStories.tsx`, `src/shared/sections/RelatedSongs.tsx` y `src/shared/ui/StoryCardGrid.tsx`. Verificación: `npm run build` sigue sin errores (nada más los importa).
5. Revisar visualmente `/read/nirvana/polly/` en móvil (<768px): columna 2 aparece apilada debajo de columna 1, a todo el ancho. Verificación: sin scroll horizontal, ambas columnas legibles.
6. Ejecutar `npm run build` y Lighthouse (escritorio) en `/read/nirvana/polly/`. Verificación: build sin errores ni avisos de TypeScript; Accessibility y SEO se mantienen en 100, sin regresión respecto a SPEC 02.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores ni avisos de TypeScript.
- [ ] En desktop (≥768px), `/read/nirvana/polly/` muestra 2 columnas: texto (~2/3 del ancho) a la izquierda, sidebar "MOST POPULAR STORIES" (~1/3) a la derecha.
- [ ] En móvil (<768px), el sidebar aparece apilado debajo del contenido de texto, a todo el ancho, sin scroll horizontal.
- [ ] La columna 1 muestra el mismo contenido que antes de esta spec: breadcrumb (fuera del grid), hero, banner de YouTube, cuerpo, letra y FAQ, sin cambios de datos.
- [ ] El sidebar muestra 8 fichas de historias populares, excluyendo la historia actual ("Yesterday" no aparece en su propio sidebar).
- [ ] Cada ficha del sidebar muestra: logo de banda, título (enlazado a `/read/[band]/[song]/`), banda, álbum, vistas, subtítulo e imagen de portada, con separadores horizontales entre fichas, dentro de una caja blanca con borde y barra roja superior — igual que `screenshots/columna2.png`.
- [ ] Las secciones "Most Popular Stories" y "Related Songs" a ancho completo ya no aparecen en `/read/[band]/[song]/`.
- [ ] `src/shared/sections/MostPopularStories.tsx`, `src/shared/sections/RelatedSongs.tsx` y `src/shared/ui/StoryCardGrid.tsx` no existen en el repo.
- [ ] `/videos/nirvana/polly/` no cambia respecto a SPEC 05.
- [ ] Lighthouse en `/read/nirvana/polly/` (escritorio) da Accessibility 100 y SEO 100, sin regresión respecto a SPEC 02.

## Decisiones

- **Sí:** grid de 2 columnas con `md:` (≥768px) como breakpoint, no `lg:`. Decisión explícita del usuario, más agresivo que el resto del sitio (que usa `lg:` para sus grids de tarjetas).
- **Sí:** columna 1 ~2/3, columna 2 ~1/3 del ancho en desktop. Proporción estándar de contenido principal + sidebar; decisión explícita del usuario.
- **No:** sidebar sticky. Decisión explícita del usuario — se mantiene simple, el sidebar hace scroll junto con la página.
- **Sí:** eliminar "Most Popular Stories" y "Related Songs" (grids a ancho completo) y reemplazar ambas por un único sidebar de "Most Popular Stories". Decisión explícita del usuario; se prioriza igualar `columna2.png` sobre conservar las recomendaciones por tags.
- **Sí:** nuevo componente `SidebarStoryCard` en vez de reutilizar `StoryCard`. El layout de `columna2.png` (logo+título en línea, imagen ancha al final, separadores) es distinto al de `StoryCard` (imagen arriba en grid) y forzarlo dentro del mismo componente añadiría condicionales innecesarios.
- **Sí:** replicar la barra roja superior y la caja con borde del sidebar, pese a que SPEC 07 descartó "íconos decorativos junto a encabezados de sección". Es una decisión distinta (una barra de color de la caja del sidebar, no un ícono junto a un H2 de sub-sección existente) y el usuario la confirmó explícitamente para este componente nuevo.
- **Sí:** conservar `getRelatedStories` en `src/db/queries.ts` sin llamadores tras esta spec, en vez de borrarla. No rompe el build ni añade deuda visible; se reutiliza si una spec futura trae de vuelta recomendaciones por tags.
- **No:** paginación ("VIEW MORE") dentro del sidebar. Son 8 fichas fijas, igual que el límite actual de `MostPopularStories`.

## Lo que **no** entra en esta spec

- Cambios en `/videos/[band]/[song]/`.
- Recomendaciones por tags ("Related Songs") en cualquier formato — se elimina sin reemplazo.
- Paginación dentro del sidebar.
- Comportamiento sticky del sidebar.
- Cambios al `StoryCard.tsx` usado en el resto del sitio (home, banda, tags, búsqueda).

Cada uno, si llega, va en su propia spec.
