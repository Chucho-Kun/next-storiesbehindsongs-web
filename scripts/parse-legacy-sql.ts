import { readFileSync } from "node:fs";
import { join } from "node:path";

export type LegacyStoryRow = {
  legacyId: number;
  banda: string;
  video: string;
  short: string;
  duration: string;
  album: string;
  titulo: string;
  texto: string;
  letra: string;
  categorias: string;
  vistas: number;
  faqs: string;
};

const DUMP_PATH = join(process.cwd(), "ejemplos/bd/stories.sql");
const COLUMN_ORDER: (keyof LegacyStoryRow)[] = [
  "legacyId",
  "banda",
  "video",
  "short",
  "duration",
  "album",
  "titulo",
  "texto",
  "letra",
  "categorias",
  "vistas",
  "faqs",
];

/** Undoes MySQL's backslash-escaping (\', \", \\) without touching \n, which
 * belongs to the JSON payload nested inside the `faqs` column. */
function unescapeMysqlString(raw: string): string {
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "\\") {
      const next = raw[i + 1];
      if (next === "'" || next === '"' || next === "\\") {
        out += next;
        i++;
        continue;
      }
    }
    out += ch;
  }
  return out;
}

function parseScalar(rawField: string): string | number {
  const trimmed = rawField.trim();
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return unescapeMysqlString(trimmed.slice(1, -1));
  }
  return Number(trimmed);
}

/** Splits a comma-separated list, respecting single-quoted strings (with
 * their backslash escapes) so that commas inside values aren't treated as
 * field separators. */
function splitTopLevel(input: string, separator: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inString = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inString) {
      current += ch;
      if (ch === "\\") {
        current += input[++i];
        continue;
      }
      if (ch === "'") {
        inString = false;
      }
      continue;
    }

    if (ch === "'") {
      inString = true;
      current += ch;
      continue;
    }

    if (ch === separator) {
      parts.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  parts.push(current);
  return parts;
}

/** Extracts the `(...), (...), ...` row tuples of a multi-row INSERT VALUES
 * clause, ignoring parentheses and commas that appear inside quoted strings
 * (e.g. album names like "Bleach (1989)"). */
function extractTuples(valuesClause: string): string[] {
  const tuples: string[] = [];
  let depth = 0;
  let inString = false;
  let current = "";

  for (let i = 0; i < valuesClause.length; i++) {
    const ch = valuesClause[i];

    if (inString) {
      current += ch;
      if (ch === "\\") {
        current += valuesClause[++i];
        continue;
      }
      if (ch === "'") {
        inString = false;
      }
      continue;
    }

    if (ch === "'") {
      inString = true;
      current += ch;
      continue;
    }

    if (ch === "(") {
      depth++;
      if (depth === 1) {
        current = "";
        continue;
      }
      current += ch;
      continue;
    }

    if (ch === ")") {
      depth--;
      if (depth === 0) {
        tuples.push(current);
        current = "";
        continue;
      }
      current += ch;
      continue;
    }

    if (depth > 0) {
      current += ch;
    }
  }

  return tuples;
}

/** Finds the `;` that terminates the INSERT statement, ignoring semicolons
 * that appear inside quoted strings (e.g. an <iframe allow="a; b; c">). */
function findStatementEnd(sql: string, from: number): number {
  let inString = false;
  for (let i = from; i < sql.length; i++) {
    const ch = sql[i];
    if (inString) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === "'") {
        inString = false;
      }
      continue;
    }
    if (ch === "'") {
      inString = true;
      continue;
    }
    if (ch === ";") {
      return i;
    }
  }
  throw new Error("No se encontró el ';' que cierra el INSERT.");
}

/** The dump splits the 75 rows across several `INSERT INTO` statements
 * (phpMyAdmin chunks large dumps), so every occurrence must be parsed. */
function findInsertStarts(sql: string): number[] {
  const starts: number[] = [];
  let from = 0;
  for (;;) {
    const index = sql.indexOf("INSERT INTO `stories`", from);
    if (index === -1) break;
    starts.push(index);
    from = index + 1;
  }
  if (starts.length === 0) {
    throw new Error("No se encontró ningún INSERT de la tabla `stories`.");
  }
  return starts;
}

export function parseLegacySql(dumpPath: string = DUMP_PATH): LegacyStoryRow[] {
  const sql = readFileSync(dumpPath, "utf-8");

  return findInsertStarts(sql).flatMap((insertStart) => {
    const valuesStart = sql.indexOf("VALUES", insertStart) + "VALUES".length;
    const insertEnd = findStatementEnd(sql, valuesStart);
    const valuesClause = sql.slice(valuesStart, insertEnd);

    return extractTuples(valuesClause).map((tuple) => {
      const rawFields = splitTopLevel(tuple, ",");
      if (rawFields.length !== COLUMN_ORDER.length) {
        throw new Error(
          `Fila con ${rawFields.length} columnas, se esperaban ${COLUMN_ORDER.length}: ${tuple.slice(0, 80)}...`,
        );
      }

      const row = {} as LegacyStoryRow;
      COLUMN_ORDER.forEach((column, index) => {
        (row[column] as string | number) = parseScalar(rawFields[index]);
      });
      return row;
    });
  });
}

if (require.main === module) {
  const rows = parseLegacySql();
  const bands = new Set(rows.map((row) => row.banda));
  console.log(`${rows.length} filas`);
  console.log(`${bands.size} bandas distintas: ${[...bands].sort().join(", ")}`);
}
