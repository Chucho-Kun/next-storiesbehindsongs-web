import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeBodyHtml, normalizeLyrics } from "./normalize-content";
import { parseLegacySql } from "./parse-legacy-sql";

const rows = parseLegacySql();
const patience = rows.find((row) => row.legacyId === 20);
const polly = rows.find((row) => row.legacyId === 77);

if (!patience || !polly) {
  throw new Error("Filas de referencia (20, 77) no encontradas en el dump.");
}

test("normalizeBodyHtml — fila 20 (Patience, Guns N Roses)", () => {
  const html = normalizeBodyHtml(patience.texto, "guns-n-roses", "patience");

  assert.ok(!html.includes("::"), "no debe quedar '::' sin convertir");
  assert.ok(!html.includes("=*"), "no debe quedar sintaxis de atributo legacy '=*'");
  assert.ok(html.includes("<em>Lies</em>"), "el *énfasis* debe volverse <em>");
  assert.ok(
    html.includes('src="/stories/guns-n-roses/patience/lies.webp"'),
    "el src de imagen debe reescribirse a la ruta de la historia",
  );
  assert.ok(html.startsWith("<p>"), "cada fragmento debe quedar envuelto en <p>");
});

test("normalizeLyrics — fila 20 (Patience, con letra)", () => {
  const lyrics = normalizeLyrics(patience.letra);

  assert.ok(!lyrics.includes("*"), "no deben quedar '*' sin convertir");
  assert.ok(!lyrics.includes("__"), "no deben quedar '__' sin convertir");
  assert.ok(
    lyrics.includes("Shed a tear 'cause I'm missin' you\nI'm still alright to smile"),
    "un '*' dentro de una estrofa debe volverse salto de línea",
  );
  assert.ok(
    lyrics.includes(
      "One, two, one, two, three, four\n\nShed a tear 'cause I'm missin' you",
    ),
    "un '__' entre estrofas debe volverse línea en blanco",
  );
});

test("normalizeBodyHtml — fila 77 (Polly, con imágenes)", () => {
  const html = normalizeBodyHtml(polly.texto, "nirvana", "polly");

  assert.ok(!html.includes("::"), "no debe quedar '::' sin convertir");
  assert.ok(!html.includes("=*"), "no debe quedar sintaxis de atributo legacy '=*'");
  assert.ok(
    html.includes('src="/stories/nirvana/polly/friend-fake.webp"'),
    "public/stories/nirvana/polly/friend-fake.webp debe quedar referenciado",
  );
  assert.ok(html.includes('alt="friend-fake"'), "el atributo alt debe conservarse");
});

test("normalizeBodyHtml — sanea etiquetas fuera de la lista blanca", () => {
  const dirty = '::Texto normal:: :: <script>alert(1)</script> :: <div class="x">bloque</div>::';
  const html = normalizeBodyHtml(dirty, "band", "song");

  assert.ok(!html.includes("<script"), "debe eliminar <script>");
  assert.ok(!html.includes("<div"), "debe eliminar etiquetas fuera de la lista blanca");
  assert.ok(html.includes("<p>Texto normal</p>"), "debe conservar el texto permitido");
});
