import Image from "next/image";

const CHANNEL_URL = "https://www.youtube.com/@StoriesBehindTheSongs";

export function YoutubeBanner() {
  return (
    <a
      href={CHANNEL_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit the Stories Behind The Songs YouTube channel"
      className="block"
    >
      <Image
        src="/brand/youtube-banner.webp"
        alt="Stories Behind The Songs on YouTube"
        width={1333}
        height={368}
        sizes="100vw"
        className="h-auto w-full"
      />
    </a>
  );
}
