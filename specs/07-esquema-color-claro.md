# SPEC 07 — Esquema de color claro para el contenido del sitio

> **Estado:** Approved
> **Depende de:** SPEC 01, SPEC 03, SPEC 04
> **Fecha:** 2026-09-22
> **Objetivo:** Cambiar el fondo del contenido de todas las páginas que hoy son negras (home, banda, búsqueda, tags) a blanco, manteniendo el Header y el Footer en negro, para igualar el diseño de la captura de referencia (`screenshots/Captura de Pantalla 2026-09-22 a la(s) 10.45.23.png`).

## Por qué existe esta spec

SPEC 01 fijó un fondo negro (`--bg: #000000`) para todo el sitio, tomado como interpretación del diseño original. La captura de referencia que compartió el usuario muestra que las secciones "Bands More Popular" y "Recent Articles" del sitio real tienen fondo **blanco**, con encabezados de sub-sección en negro y solo el Header (logo + buscador) en negro. Esta spec corrige esa lectura para el resto del contenido, sin tocar `/read/[band]/[song]/` ni `/videos/[band]/[song]/`, que ya usan un fondo claro (`#efefef`) fijado de forma independiente en SPEC 02 y SPEC 05.

## Alcance

**Dentro:**

- Tokens en `src/app/globals.css`: `--bg` pasa de `#000000` a `#ffffff`, `--fg` pasa de `#ffffff` a un gris oscuro neutro (`#171717`), `--muted` se recalibra a un gris legible sobre blanco (`#6b7280`, contraste ≥ 4.5:1). `--title-red` no cambia.
- `Header.tsx`: se desacopla del token `--bg`/`--fg` (que ahora es claro) y pasa a `bg-black text-white` explícito, incluido el texto del input de búsqueda (`text-white` en vez de `text-foreground`), para seguir siendo negro sin depender del tema global.
- `Footer.tsx`: se desacopla igual, con `bg-black text-white` explícito en todo el footer (enlaces, redes y franja legal), y sus enlaces (`text-muted` → gris explícito `text-neutral-400`) dejan de depender de `--muted`, que ahora está calibrado para fondo blanco.
- El resto de páginas que hoy usan `bg-background`/`text-foreground` (`src/app/layout.tsx`, `src/app/page.tsx`, `src/app/bands/[band]/page.tsx`, `src/app/search/page.tsx`, `src/app/tags/page.tsx`, `src/app/tags/[tag]/page.tsx`) heredan el nuevo fondo blanco sin cambio de clases.
- Encabezados **H2 de sub-sección** pasan de rojo (`--title-red`) a un gris oscuro neutro (`text-neutral-900`): `PopularBands.tsx` ("Bands More Popular"), `PopularTags.tsx` ("Popular Tags"), `StoryGrid.tsx` ("Recent Articles" y "Most Popular Songs"), `RelatedTags.tsx` ("Related Tags"), `AlbumShelf.tsx` ("Listen Full Album") y `StoryCardGrid.tsx` (usado como "Most Popular Stories" y "Related Songs" en banda/tags).
- Encabezados **H1 de página** se mantienen en rojo: nombre de banda en `BandInfo.tsx`, "All Tags" en `src/app/tags/page.tsx` y el nombre del tag en `src/app/tags/[tag]/page.tsx`. El título de cada historia dentro de una ficha (`StoryCard.tsx`, ej. "Polly") también se mantiene en rojo, sin cambios.
- `PopularBands.tsx`: los tiles de logo de banda ganan un borde sutil (`border border-neutral-200`) y reducen el espacio entre sí (`gap-3` en vez de `gap-6`), para acercarse a la fila compacta de la captura.
- `TagPill.tsx`: los tres usos que hoy toman el variant `"dark"` por defecto en páginas que pasan a blanco (`PopularTags.tsx`, `src/app/tags/page.tsx`, `RelatedTags.tsx`) cambian a `variant="light"` (variant ya existente, diseñado para fondo claro).
- Revisión manual de bordes/textos residuales pensados para fondo negro en las páginas dentro de alcance (ej. clases `border-neutral-700/800` sueltas) para que ningún elemento quede con bajo contraste sobre blanco.

**Fuera de alcance (para specs futuras):**

- `/read/[band]/[song]/` y `/videos/[band]/[song]/`: no cambian. Ya tienen fondo `#efefef` fijo desde SPEC 02 y SPEC 05, independiente de los tokens globales, y nunca fueron negros.
- Contenido real de "About Us", "Notice of Privacy" y "Contact": siguen siendo placeholders; solo heredan el nuevo fondo blanco del `body`, sin texto nuevo.
- Cualquier ícono decorativo junto a los encabezados de sección (se evaluó y se descartó explícitamente).
- Cambios de layout, tipografía o breakpoints no mencionados arriba (el grid de tarjetas, el tamaño de fuente, etc. no cambian).
- Revisión visual del widget de Google Translate (SPEC 06) sobre el nuevo esquema más allá de confirmar que el botón sigue siendo legible (criterio de aceptación); cualquier ajuste fino de ese widget va en una spec propia si hace falta.

## Modelo de datos

Esta spec no introduce tablas, columnas ni estructuras nuevas. Es un cambio puramente visual sobre componentes y tokens CSS existentes.

## Plan de implementación

1. Actualizar `src/app/globals.css`: `--bg: #ffffff`, `--fg: #171717`, `--muted: #6b7280`. Verificación: `npm run build` sin errores (el sitio compila aunque visualmente Header y Footer se vean blancos hasta el paso 2).
2. Desacoplar `Header.tsx`: `bg-black text-white` en el `<header>`, y `text-white` (en vez de `text-foreground`) en el input de búsqueda. Verificación: recargar el home muestra el Header negro sobre un body ya blanco.
3. Desacoplar `Footer.tsx`: `bg-black text-white` en el `<footer>` completo, y `text-neutral-400 hover:text-white` en vez de `text-muted` para los enlaces y los íconos de redes; la franja legal (`bg-black`) no cambia. Verificación: el Footer completo se ve negro con texto legible, con el resto del home ya en blanco.
4. Cambiar los encabezados H2 de rojo a `text-neutral-900` en `PopularBands.tsx`, `PopularTags.tsx`, `StoryGrid.tsx`, `RelatedTags.tsx`, `AlbumShelf.tsx` y `StoryCardGrid.tsx`. Verificación: en el home, "Bands More Popular", "Recent Articles" y "Most Popular Songs" se ven en negro; el resto de páginas afectadas se revisan en el paso 6.
5. En `PopularBands.tsx`, agregar `border border-neutral-200` a cada tile de logo y cambiar `gap-6` por `gap-3`. Verificación: la fila de logos se parece visualmente a la captura de referencia.
6. Cambiar `variant="dark"` (implícito) a `variant="light"` en los `TagPill` de `PopularTags.tsx`, `src/app/tags/page.tsx` y `RelatedTags.tsx`. Verificación: los pills de tag en esas tres páginas se ven con borde y texto oscuros, legibles sobre blanco.
7. Recorrer manualmente `/`, `/bands/nirvana/`, `/search/?q=polly`, `/tags/` y `/tags/dark-song/`, y corregir cualquier texto o borde que haya quedado con bajo contraste sobre el nuevo fondo blanco (clases `border-neutral-700/800` sueltas fuera de Header/Footer). Verificación: ningún texto ni borde queda invisible en esas cinco rutas.
8. Ejecutar `npm run build` y Lighthouse (escritorio) en `/` y `/bands/nirvana/`. Verificación: build sin errores ni avisos de TypeScript; Accessibility y SEO se mantienen en 100, sin regresión de contraste.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores ni avisos de TypeScript.
- [ ] El home (`/`) muestra fondo blanco en Youtube Banner, Popular Tags, Bands More Popular, Recent Articles y Most Popular Songs; el Header y el Footer (incluida la franja legal) siguen en negro.
- [ ] `/bands/nirvana/`, `/search/?q=polly`, `/tags/` y `/tags/dark-song/` muestran fondo blanco en su contenido, con Header y Footer negros.
- [ ] `/read/nirvana/polly/` y `/videos/nirvana/polly/` no cambian respecto a SPEC 02 y SPEC 05: siguen con su fondo `#efefef`.
- [ ] Los encabezados "Bands More Popular", "Recent Articles", "Most Popular Songs", "Popular Tags", "Related Tags" y "Listen Full Album" se muestran en negro/gris oscuro, no en rojo.
- [ ] El nombre de banda en `/bands/nirvana/`, "All Tags" en `/tags/` y el nombre del tag en `/tags/dark-song/` se mantienen en rojo (`--title-red`).
- [ ] El título de cada historia dentro de una ficha (`StoryCard`, ej. "Polly") se mantiene en rojo.
- [ ] Los logos de banda en "Bands More Popular" muestran un borde gris claro y menor espacio entre sí que antes.
- [ ] Los tags de "Popular Tags" (home), "All Tags" (`/tags/`) y "Related Tags" (`/tags/dark-song/`) se ven con borde y texto oscuros, legibles sobre fondo blanco.
- [ ] Ningún texto ni borde queda invisible o con bajo contraste sobre el nuevo fondo blanco en `/`, `/bands/nirvana/`, `/search/`, `/tags/` y `/tags/dark-song/`.
- [ ] Los enlaces y redes sociales del Footer siguen siendo legibles (gris claro sobre negro) en cualquier página.
- [ ] Lighthouse en `/` y `/bands/nirvana/` (escritorio) da Accessibility 100 y SEO 100, sin regresión respecto a las corridas previas de SPEC 01 y SPEC 03.
- [ ] El botón flotante de traducción (SPEC 06) sigue siendo visible y legible sobre el nuevo fondo blanco del home.

## Decisiones

- **Sí:** cambiar los tokens globales `--bg`/`--fg`/`--muted` en `globals.css` en vez de crear un sistema de theming por página. Todas las páginas dentro de alcance ya usan `bg-background`/`text-foreground`, así que el cambio se propaga solo.
- **No:** variables tipo `--bg-light`/`--bg-dark` con theming condicional. Es más infraestructura de la que el sitio necesita: solo hay dos zonas fijas (Header y Footer en negro) y ambas se resuelven desacoplándolas del token, no creando un sistema de temas.
- **Sí:** Header y Footer con `bg-black`/`text-white` explícitos, no ligados a los tokens. Es la decisión del usuario y evita que un futuro cambio de `--bg` los rompa de nuevo.
- **Sí:** rojo (`--title-red`) reservado para el título protagonista de cada página (H1: banda, tag, "All Tags") y para el título de la historia dentro de las fichas; negro para los encabezados de sub-sección (H2). Es la lectura más cercana a la captura, que solo muestra H2 en negro, y la decisión explícita del usuario sobre los H1.
- **No:** agregar un ícono decorativo junto a los encabezados de sección. El usuario lo descartó explícitamente.
- **Sí:** `/read/[band]/[song]/` y `/videos/[band]/[song]/` quedan fuera de esta spec. Ya tienen fondo claro (`#efefef`) fijado en SPEC 02/05, independiente de los tokens; nunca estuvieron en negro y no hay nada que corregir ahí.
- **Sí:** reutilizar el variant `"light"` que ya existe en `TagPill` en vez de crear un tercer variant. Ya está diseñado para fondo claro (usado hoy en `StoryHero` sobre `#efefef`).
- **Sí:** Footer completo en negro (no solo la franja legal), aunque el resto del home pase a blanco. Es la decisión explícita del usuario.
- **No:** tocar el variant `"dark"` de `TagPill`. Deja de tener llamadores tras esta spec, pero se conserva definido por si un futuro componente sobre fondo negro (Header o Footer) lo necesita.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| `--muted` recalibrado para fondo blanco deja el texto del Footer casi invisible sobre negro | El Footer usa un gris explícito (`text-neutral-400`) en vez de `text-muted`, independiente del token (paso 3). |
| Algún componente fuera de la lista revisada depende de `--fg`/`--muted` asumiendo fondo negro y queda ilegible | Revisión manual de las cinco rutas afectadas antes de cerrar la spec (paso 7). |
| El widget de Google Translate (SPEC 06) inserta texto con estilos inline que no calzan con el nuevo esquema de color | Se verifica como criterio de aceptación; un problema puntual se corrige con una regla CSS específica, no revirtiendo el esquema. |
| El nuevo gris `--muted` (`#6b7280`) no cumple contraste AA sobre blanco en algún tamaño de texto | Se verifica con Lighthouse Accessibility en el paso 8; de fallar, se oscurece el valor hasta cumplir. |

## Lo que **no** entra en esta spec

- Cambios en `/read/[band]/[song]/` y `/videos/[band]/[song]/`.
- Contenido real de "About Us", "Notice of Privacy" y "Contact".
- Íconos decorativos junto a encabezados de sección.
- Cambios de layout, tipografía o breakpoints no descritos arriba.
- Ajustes al widget de traducción de SPEC 06 más allá de confirmar que sigue siendo legible.

Cada uno, si llega, va en su propia spec.
