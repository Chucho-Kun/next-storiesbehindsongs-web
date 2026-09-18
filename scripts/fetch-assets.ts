import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { parseLegacySql } from "./parse-legacy-sql";
import { slugify, splitTitle } from "./slug";

const SITE = "https://storiesbehindsongs.com";
const PUBLIC_DIR = join(process.cwd(), "public");
const MAX_ATTEMPTS = 3;
const CONCURRENCY = 5;

type DownloadTask = { url: string; dest: string };
type DownloadFailure = DownloadTask & { status?: number; error?: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Body-image filenames referenced as `src=*img/NAME.webp*` in the raw
 * (pre-normalization) `texto` field. */
function extractBodyImageFilenames(texto: string): string[] {
  const matches = texto.matchAll(/src=\*img\/([^*]+)\*/g);
  return [...new Set([...matches].map((match) => match[1]))];
}

async function downloadOne(task: DownloadTask): Promise<DownloadFailure | null> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(task.url, { redirect: "manual" });
      if (response.status === 200) {
        const buffer = Buffer.from(await response.arrayBuffer());
        await mkdir(dirname(task.dest), { recursive: true });
        await writeFile(task.dest, buffer);
        return null;
      }
      if (attempt === MAX_ATTEMPTS) {
        return { ...task, status: response.status };
      }
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        return { ...task, error: (error as Error).message };
      }
    }
    await sleep(300 * attempt);
  }
  return { ...task, error: "unreachable" };
}

async function downloadAll(tasks: DownloadTask[]): Promise<DownloadFailure[]> {
  const failures: DownloadFailure[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const task = tasks[cursor++];
      const failure = await downloadOne(task);
      if (failure) failures.push(failure);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return failures;
}

/** Placeholders reused from the live site per the spec's Decisiones section
 * ("reutilizar logo, banner y iconos del sitio actual... reemplazables
 * después"), until the real brand assets are supplied. */
const brandTasks: DownloadTask[] = [
  { url: `${SITE}/logoWeb.svg`, dest: join(PUBLIC_DIR, "brand", "logo.svg") },
  { url: `${SITE}/resources/ojo.svg`, dest: join(PUBLIC_DIR, "brand", "eye.svg") },
  {
    url: `${SITE}/resources/youtube-large.webp`,
    dest: join(PUBLIC_DIR, "brand", "youtube-banner.webp"),
  },
];

function buildTasks() {
  const rows = parseLegacySql();
  const bandSlugs = new Set(rows.map((row) => slugify(row.banda)));

  const logoTasks: DownloadTask[] = [...bandSlugs].map((bandSlug) => ({
    url: `${SITE}/plataforma/bandas/Jcrop/demos/img_temp/${bandSlug}.webp`,
    dest: join(PUBLIC_DIR, "bands", `${bandSlug}.webp`),
  }));

  const coverTasks: DownloadTask[] = [];
  const bodyImageTasks: DownloadTask[] = [];

  for (const row of rows) {
    const bandSlug = slugify(row.banda);
    const { title } = splitTitle(row.titulo);
    const storySlug = slugify(title);

    coverTasks.push({
      url: `${SITE}/plataforma/bandas/Jcrop/demos/portada_temp/${bandSlug}-${storySlug}.webp`,
      dest: join(PUBLIC_DIR, "covers", `${bandSlug}-${storySlug}.webp`),
    });

    for (const filename of extractBodyImageFilenames(row.texto)) {
      bodyImageTasks.push({
        url: `${SITE}/read/${bandSlug}/${storySlug}/img/${filename}`,
        dest: join(PUBLIC_DIR, "stories", bandSlug, storySlug, filename),
      });
    }
  }

  return { logoTasks, coverTasks, bodyImageTasks };
}

async function main() {
  const { logoTasks, coverTasks, bodyImageTasks } = buildTasks();
  const allTasks = [...brandTasks, ...logoTasks, ...coverTasks, ...bodyImageTasks];

  const failures = await downloadAll(allTasks);
  const redirects = failures.filter((f) => f.status !== undefined && f.status >= 300 && f.status < 400);

  console.log(
    `${brandTasks.length} recursos de marca, ${logoTasks.length} logos, ${coverTasks.length} portadas, ${bodyImageTasks.length} imágenes de cuerpo`,
  );
  console.log(`${allTasks.length - failures.length} descargas exitosas de ${allTasks.length}`);
  console.log(`${failures.length} fallos, ${redirects.length} de ellos con status 3xx`);

  if (failures.length > 0) {
    console.log(JSON.stringify(failures, null, 2));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
