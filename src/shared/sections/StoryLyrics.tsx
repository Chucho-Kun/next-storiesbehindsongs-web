export function StoryLyrics({ lyrics }: { lyrics: string | null }) {
  const stanzas = (lyrics ?? "")
    .split(/\n{2,}/)
    .map((stanza) => stanza.trim())
    .filter((stanza) => stanza.length > 0);

  if (stanzas.length === 0) return null;

  return (
    <section id="lyrics" className="scroll-mt-4 bg-white p-4 sm:p-6">
      <h2 className="mb-4 text-2xl font-bold text-title">Lyrics</h2>
      <div className="space-y-4 text-neutral-800">
        {stanzas.map((stanza, index) => (
          <p key={index} className="whitespace-pre-line">
            {stanza}
          </p>
        ))}
      </div>
    </section>
  );
}
