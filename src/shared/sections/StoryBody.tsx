/** `bodyHtml` is sanitized at seed time (scripts/normalize-content.ts), so it is rendered as-is. */
export function StoryBody({ html }: { html: string }) {
  return (
    <section
      className="bg-white p-4 leading-relaxed text-neutral-800 sm:p-6 [&_em]:italic [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full [&_img]:mx-auto [&_img]:h-auto [&_img]:max-w-full [&_p]:mb-4 [&_p:last-child]:mb-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
