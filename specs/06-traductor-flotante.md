# SPEC 06 — Botón flotante de traducción multiidioma

> **Estado:** Approved
> **Depende de:** SPEC 01, SPEC 02, SPEC 03, SPEC 04, SPEC 05
> **Fecha:** 2026-09-21
> **Objetivo:** Añadir un botón flotante global que traduce el texto del sitio a un idioma elegido de una lista configurable mediante el widget de Google Translate, sin traducir títulos de canciones, nombres de bandas ni nombres de álbumes (marcados con `notranslate`).

## Por qué existe esta spec

El sitio está en inglés y su audiencia es internacional. El sitio original (storiesbehindsongs.com) resuelve esto con el widget de Google Translate y marca con la clase `notranslate` los títulos, las bandas y los álbumes, porque un traductor automático los estropea («Smells Like Teen Spirit» → «Huele a espíritu adolescente»).

Se conserva ese enfoque: traducción en el navegador, sin backend ni base de datos nuevos, y el HTML servido sigue siendo inglés puro, así que el SEO y el `canonical` de las SPEC 01–05 no cambian. Lo que sí se mejora respecto al original:

- Interfaz propia (botón flotante + panel de idiomas) en lugar del desplegable de Google, que además inyecta una barra superior que rompe el diseño.
- El script de Google **no se carga** hasta que el visitante lo pide o ya tenía un idioma guardado, para no penalizar Lighthouse.
- Lista de idiomas en un solo archivo de configuración: añadir un idioma es una línea.

Riesgo técnico conocido: el widget reescribe el DOM (envuelve textos en `<font>`), lo que puede provocar errores de React al navegar en el cliente (`removeChild` / `insertBefore`). El plan lo cubre con una protección y con un criterio de aceptación explícito.

## Alcance

**Dentro:**

- Configuración de idiomas en `src/lib/translate-languages.ts`: lista `{ code, label }` con `label` en el propio idioma. Versión inicial: Español (`es`), Português (`pt`), Français (`fr`), Deutsch (`de`), Italiano (`it`), Русский (`ru`), 日本語 (`ja`). El inglés es el idioma original y siempre aparece como primera opción «English (original)».
- Helpers de traducción en `src/lib/google-translate.ts`: carga perezosa del script `translate.google.com/translate_a/element.js`, escritura/borrado de la cookie `googtrans`, aplicación del idioma disparando el `select.goog-te-combo` del widget, y la protección contra errores de DOM de React.
- Nuevo `src/shared/ui/LanguageSwitcher.tsx` (Client Component): botón flotante fijo abajo a la derecha con icono y `aria-label="Translate this page"`, que abre un panel con la lista de idiomas. Cierra con `Esc`, con clic fuera y al elegir. Marca el idioma activo. Foco visible y navegable por teclado.
- Montaje **global** en `src/app/layout.tsx`: el botón aparece en home, `/read/`, `/bands/`, `/tags/`, `/videos/`, `/search/` y páginas del footer.
- El widget de Google vive oculto en un `div#google_translate_element` dentro de `LanguageSwitcher`, con `pageLanguage: "en"`, `includedLanguages` generado desde la configuración y `autoDisplay: false`.
- Se traduce todo el texto visible salvo lo marcado `notranslate`: cuerpo del artículo, letra, FAQ, subtítulos, encabezados de sección, botones, tags y textos de interfaz.
- Marcado `notranslate` + `translate="no"` (ambos, porque Google respeta la clase y los navegadores el atributo) en los elementos que muestran **título de canción**, **nombre de banda** o **nombre de álbum**:
  - `src/shared/ui/StoryCard.tsx`: nombre de banda, `h3` del título y álbum; también la `img` de portada (su `alt` es el título).
  - `src/shared/sections/StoryHero.tsx`: `h1`, nombre de banda, álbum y `alt` del logo de banda.
  - `src/shared/sections/VideoHero.tsx`: `h1` y nombre de banda.
  - `src/shared/sections/BandInfo.tsx`: `h1` con el nombre de banda y `alt` del logo.
  - `src/shared/sections/AlbumShelf.tsx` y `src/shared/ui/AlbumCover.tsx`: nombre de álbum.
  - `src/shared/sections/PopularBands.tsx`: `alt` de los logos de banda.
  - `src/shared/ui/Breadcrumb.tsx`: nueva propiedad opcional `noTranslate?: boolean` en `BreadcrumbItem`; las páginas `/read/`, `/videos/` y `/bands/` la activan en los ítems de banda y canción.
- Persistencia: el idioma elegido se guarda en `localStorage` con clave `sbs:translate-lang:v1` y en la cookie `googtrans`. Al cargar cualquier página, si hay un idioma guardado distinto de inglés, se carga el script y la página se traduce sola.
- CSS en `src/app/globals.css` que neutraliza lo que inyecta Google: barra superior (`.skiptranslate` iframe), desplazamiento `body { top: 0 !important }`, tooltips (`.goog-tooltip`) y resaltado al pasar el cursor (`.goog-text-highlight`).

**Fuera de alcance (para specs futuras):**

- Traducciones guardadas en PostgreSQL, rutas por idioma (`/es/`, `/fr/`), etiquetas `hreflang` o sitemap multiidioma. Es otra arquitectura y CLAUDE.md deja las rutas en español fuera.
- Traducción del lado del servidor con una API de pago (Cloud Translation, DeepL) y sus claves.
- Detección automática del idioma del navegador (solo se traduce cuando el visitante elige un idioma).
- Idiomas de derecha a izquierda (árabe, hebreo) y comprobación de su maquetación.
- Revisión humana de las traducciones y glosario de términos musicales.
- Traducir los `alt`, `title` y metadatos SEO (`<title>`, `description`) del HTML servido: siguen en inglés para indexación.
- Actualizar el contenido de «Notice of Privacy» con el aviso de cookies de Google Translate (esa página sigue siendo un placeholder).
- Botón «Back to top», ShareThis, AdSense, GTM y demás piezas fuera de alcance de SPEC 01.

## Modelo de datos

Esta spec no introduce tablas, columnas ni migraciones. Todo el estado vive en el navegador.

```ts
// src/lib/translate-languages.ts
export type TranslateLanguage = { code: string; label: string };

export const SOURCE_LANGUAGE = "en";

export const TRANSLATE_LANGUAGES: TranslateLanguage[] = [
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "ru", label: "Русский" },
  { code: "ja", label: "日本語" },
];

// src/lib/google-translate.ts
export const STORAGE_KEY = "sbs:translate-lang:v1"; // valor: código de idioma ("es") o ausente = inglés
export const COOKIE_NAME = "googtrans";              // valor: "/en/es"; path=/

loadGoogleTranslate(): Promise<void>      // inyecta el script una sola vez
applyLanguage(code: string): Promise<void> // "en" borra la cookie y restaura el original
```

Convenciones:

- `includedLanguages` del widget = `TRANSLATE_LANGUAGES.map(l => l.code).join(",")`; un solo lugar que editar.
- Marcado de exclusión: `className="notranslate"` y `translate="no"` juntos, nunca solo uno.
- Si `localStorage` no está disponible (modo privado), el idioma se aplica igual pero no se recuerda; la cookie `googtrans` cubre la sesión.

## Plan de implementación

1. Crear `src/lib/translate-languages.ts` con `SOURCE_LANGUAGE` y `TRANSLATE_LANGUAGES`. Verificación: compila y aún no se usa.
2. Crear `src/lib/google-translate.ts` con `loadGoogleTranslate` (carga única, callback `googleTranslateElementInit`, inicializa `google.translate.TranslateElement` con `pageLanguage: "en"`, `includedLanguages`, `autoDisplay: false`), `applyLanguage`, lectura/escritura de `localStorage` y cookie, y la protección de `Node.prototype.removeChild` / `insertBefore` contra nodos ya movidos por el widget. Verificación: compila y aún no se usa.
3. Añadir en `globals.css` las reglas que ocultan la barra, tooltips y resaltado de Google. Verificación: `npm run build` sin errores.
4. Crear `src/shared/ui/LanguageSwitcher.tsx` (botón flotante + panel + `div#google_translate_element` oculto) y montarlo en `src/app/layout.tsx`. Verificación: el botón aparece en el home, abre y cierra el panel con clic y `Esc`, y **no** se pide `translate.google.com` hasta elegir un idioma.
5. Conectar la selección: al elegir un idioma se carga el script, se aplica y se guarda; «English (original)» restaura el inglés. Al montar, si hay idioma guardado, se aplica solo. Verificación: elegir Español en el home traduce los textos; recargar mantiene el español; volver a English lo revierte.
6. Marcar `notranslate` + `translate="no"` en `StoryCard`, `StoryHero`, `VideoHero`, `BandInfo`, `AlbumShelf`, `AlbumCover` y `PopularBands`. Verificación: con español activo, títulos, bandas y álbumes de esos componentes no cambian.
7. Añadir `noTranslate` a `BreadcrumbItem` y activarlo en los ítems de banda y canción de `/read/`, `/videos/` y `/bands/`. Verificación: con español activo, el breadcrumb traduce «Home» pero no «Nirvana» ni «Polly».
8. Probar navegación en cliente con un idioma activo (home → `/read/` → `/bands/` → volver) y ajustar la protección del paso 2 si aparecen errores de DOM en consola.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores ni avisos de TypeScript.
- [ ] El botón flotante aparece en `/`, `/read/nirvana/polly/`, `/bands/nirvana/`, `/tags/dark-song/`, `/videos/nirvana/polly/` y `/search/?q=polly`, fijo abajo a la derecha sin tapar el contenido en escritorio ni en móvil (360 px).
- [ ] El HTML servido de cualquier página no contiene `translate.google.com`, y en una carga inicial sin idioma guardado no se hace ninguna petición a `translate.google.com`.
- [ ] El panel lista «English (original)» más los 7 idiomas de `TRANSLATE_LANGUAGES`, se abre con clic o `Enter`, se cierra con `Esc` o clic fuera, y cada opción es alcanzable con `Tab`.
- [ ] Elegir «Español» en el home traduce subtítulos, encabezados («Recent Articles», «Most Popular Songs») y textos del footer, y el `<html>` recibe una clase `translated-ltr`.
- [ ] Con español activo en el home, cada `h3` de título, cada nombre de banda y cada álbum de las fichas mantienen exactamente el texto original en inglés.
- [ ] Con español activo en `/read/nirvana/polly/`, el `h1` «Polly», la banda «Nirvana» y el álbum permanecen sin traducir, y el cuerpo, la letra y las preguntas del FAQ sí se traducen.
- [ ] Con español activo, el breadcrumb de `/read/nirvana/polly/` traduce «Home» pero conserva «Nirvana» y «Polly».
- [ ] Con español activo en `/bands/nirvana/`, el nombre de banda y los nombres de álbum de «Listen Full Album» no cambian.
- [ ] Recargar la página con español activo la traduce sin volver a abrir el panel; `localStorage["sbs:translate-lang:v1"]` vale `"es"` y la cookie `googtrans` vale `/en/es`.
- [ ] Elegir «English (original)» restaura el texto original, elimina la cookie `googtrans` y borra `sbs:translate-lang:v1`.
- [ ] Con español activo, navegar desde el home hasta `/read/nirvana/polly/` con clic en una ficha no produce errores en la consola (`removeChild`, `insertBefore` ni hydration) y la página nueva aparece traducida.
- [ ] No aparece la barra superior de Google ni queda un desplazamiento vertical en el `body` tras traducir.
- [ ] Añadir un idioma nuevo a `TRANSLATE_LANGUAGES` lo muestra en el panel sin tocar otro archivo.
- [ ] Todo el texto propio del botón y del panel está en inglés («Translate this page», «English (original)»).
- [ ] `<title>`, `description` y `canonical` del HTML servido de `/read/nirvana/polly/` no cambian respecto a SPEC 02.
- [ ] Lighthouse en `/` y `/read/nirvana/polly/` (escritorio, sin idioma guardado) da 90 o más en Performance, Accessibility y SEO.

## Decisiones

- **Sí:** widget de Google Translate, elegido por el usuario. Es el mismo motor del sitio original, gratuito, respeta `notranslate` de forma nativa y cubre 100+ idiomas sin infraestructura.
- **No:** API propia (Cloud Translation, DeepL). Añade clave, coste por carácter, ruta y caché, y obliga a excluir a mano los nodos `notranslate`, para un resultado igual de automático.
- **No:** traducciones pre-generadas con rutas por idioma. Ganaría SEO en otros idiomas, pero es una spec de arquitectura (tabla, rutas, `hreflang`) y las rutas en español están fuera de alcance del proyecto.
- **Sí:** botón y panel propios sobre un widget oculto. El desplegable nativo de Google es feo, no es accesible y su barra superior rompe el layout.
- **Sí:** carga perezosa del script de Google, solo tras elegir idioma o con idioma guardado. El script pesa y hace peticiones a terceros; cargarlo siempre bajaría Performance para el 100 % en inglés.
- **Sí:** lista corta y configurable (7 idiomas), elegida por el usuario. Un menú de 100+ idiomas es difícil de probar y de usar.
- **Sí:** montaje global en el layout, elegido por el usuario. Aunque se pidió «portada y artículos», un botón que desaparece en `/bands/` o `/tags/` obligaría a un visitante que ya tradujo a volver a inglés a mitad de navegación.
- **Sí:** traducir también la letra. Fue la opción global elegida; la traducción automática de letras es imprecisa y el riesgo queda anotado. Si molesta, se marca `notranslate` en `StoryLyrics` en una spec posterior.
- **Sí:** persistir en `localStorage` y `googtrans`, elegido por el usuario. La cookie es la que lee el widget al cargar; `localStorage` permite decidir si cargar el script sin esperar a Google.
- **No:** detección automática del idioma del navegador. Traducir sin que el visitante lo pida sorprende y cambia lo que ve.
- **Sí:** `notranslate` y `translate="no"` juntos. Google respeta la clase; el atributo cubre traductores integrados del navegador (Chrome, Edge).
- **Sí:** `noTranslate` como propiedad de `BreadcrumbItem` en lugar de un `span` manual en cada página. El `Breadcrumb` es reciclable y las tres páginas lo usan.
- **Sí:** dejar `<html lang="en">`, `<title>` y `description` en inglés. Traducción en el cliente, nada cambia para los buscadores.
- **No:** traducir `alt` de imágenes salvo marcarlos `notranslate` en títulos y bandas. Para el resto de imágenes el `alt` sigue en inglés.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Google reescribe el DOM y React lanza `NotFoundError` al navegar en cliente con un idioma activo | Protección de `removeChild`/`insertBefore` en `google-translate.ts` (paso 2) y criterio de aceptación de navegación con idioma activo (paso 8). Si no basta, se fuerza navegación completa cuando hay idioma activo. |
| La clase `notranslate` no basta en algún elemento (Google a veces traduce el `alt` o el `title`) | Además de la clase se usa `translate="no"`; se verifica con español activo en cada componente del paso 6. |
| El script de Google cambia o queda bloqueado (adblock, red restringida, países sin acceso) | El botón sigue funcionando y el sitio queda en inglés; si el script falla, el panel muestra un aviso en inglés y no rompe la página. |
| Google Translate coloca cookies de terceros y «Notice of Privacy» sigue siendo un placeholder | Fuera de alcance; se anota para la spec de contenido legal. |
| Traducción automática incorrecta de letras y de términos musicales | Es limitación del motor elegido; revisión humana y glosario quedan fuera de alcance. |
| Un cambio futuro en un componente omite el marcado `notranslate` | Convención documentada (clase + atributo) y comprobación en los criterios de aceptación de cada página. |
| El botón flotante tapa contenido o el «VIEW MORE» en móvil | Tamaño compacto y margen inferior; se verifica a 360 px de ancho. |

## Lo que **no** entra en esta spec

- Traducciones en BD, rutas por idioma, `hreflang` o sitemap multiidioma.
- API de traducción de pago.
- Detección automática del idioma del navegador.
- Idiomas de derecha a izquierda.
- Revisión humana de traducciones y glosarios.
- Traducción de `<title>`, `description` y metadatos SEO.
- Aviso de cookies de terceros en «Notice of Privacy».
- Botón «Back to top», ShareThis, AdSense, GTM y Meta Pixel.

Cada uno, si llega, va en su propia spec.
