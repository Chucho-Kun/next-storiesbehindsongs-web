import type { StoryDetail } from "@/db/queries";

export type FaqEntry = { question: string; answer: string; href?: string };

/** Questions are templated in code (not stored in the DB), like the current site does. */
export function buildFaqEntries(story: StoryDetail): FaqEntry[] {
  if (!story.faqs) return [];
  const { title, band, faqs } = story;

  return [
    { question: `Who wrote ${title}?`, answer: faqs.author },
    { question: `${band.name} ${title} meaning`, answer: faqs.meaning },
    { question: `Curious facts on ${title}`, answer: faqs.facts },
    {
      question: `${band.name} ${title} lyrics`,
      answer: "See the full lyrics below ↓",
      href: "#lyrics",
    },
  ];
}

export function StoryFaq({ story }: { story: StoryDetail }) {
  const entries = buildFaqEntries(story);
  if (entries.length === 0) return null;

  return (
    <section className="bg-white p-4 sm:p-6">
      <h2 className="mb-4 text-2xl font-bold text-title">FAQ</h2>
      <dl className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.question}>
            <dt className="font-bold text-neutral-900">{entry.question}</dt>
            <dd className="mt-1 text-neutral-700">
              {entry.href ? (
                <a href={entry.href} className="text-title hover:underline">
                  {entry.answer}
                </a>
              ) : (
                entry.answer
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
