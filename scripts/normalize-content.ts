import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "em", "strong", "br", "a", "img", "iframe"],
  allowedAttributes: {
    img: ["src", "alt", "width", "height", "loading"],
    a: ["href", "target", "rel"],
    iframe: [
      "src",
      "width",
      "height",
      "title",
      "allow",
      "referrerpolicy",
      "frameborder",
      "allowfullscreen",
    ],
  },
  allowedSchemes: ["https"],
};

/** Rule 1: inside any `<...>` tag, `*` was used as the attribute-quote
 * character (to dodge escaping issues in the legacy DB) and becomes `"`. */
function fixTagQuotes(texto: string): string {
  return texto.replace(/<[^>]*>/g, (tag) => tag.replace(/\*/g, '"'));
}

/** Rule 2: outside tags, a `*phrase*` pair becomes `<em>phrase</em>`. Must
 * run after fixTagQuotes, since by then the only `*` left are these pairs. */
function applyEmphasis(html: string): string {
  return html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

/** Rule 3: `::` separates paragraphs/images; each non-empty fragment is
 * wrapped in its own `<p>`. */
function wrapParagraphs(html: string): string {
  return html
    .split("::")
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length > 0)
    .map((fragment) => `<p>${fragment}</p>`)
    .join("");
}

/** Rule 4: `src="img/NAME.webp"` becomes the story's own asset path. */
function rewriteImageSrc(html: string, bandSlug: string, storySlug: string): string {
  return html.replace(
    /src="img\/([^"]+)"/g,
    (_match, filename) => `src="/stories/${bandSlug}/${storySlug}/${filename}"`,
  );
}

/** Rules 1-5: converts the legacy `texto` pseudo-markup into sanitized HTML. */
export function normalizeBodyHtml(texto: string, bandSlug: string, storySlug: string): string {
  const quoted = fixTagQuotes(texto);
  const emphasized = applyEmphasis(quoted);
  const paragraphed = wrapParagraphs(emphasized);
  const withImages = rewriteImageSrc(paragraphed, bandSlug, storySlug);
  return sanitizeHtml(withImages, SANITIZE_OPTIONS);
}

/** Rule 6: in `letra`, `*` becomes a line break and `__` a blank line
 * between stanzas. */
export function normalizeLyrics(letra: string): string {
  return letra.replace(/__/g, "\n\n").replace(/\*/g, "\n");
}
