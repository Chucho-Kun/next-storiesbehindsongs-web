import Link from "next/link";
import { FaLinkedin } from "react-icons/fa";
import { SiPinterest, SiQuora, SiReddit, SiTiktok, SiX, SiYoutube } from "react-icons/si";

const FOOTER_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Notice of Privacy", href: "/notice-of-privacy" },
  { label: "Contact", href: "/contact" },
];

const SOCIAL_LINKS = [
  { label: "YouTube", href: "https://www.youtube.com/@StoriesBehindTheSongs", Icon: SiYoutube },
  { label: "X", href: "https://x.com/SBehindTheSongs", Icon: SiX },
  { label: "Reddit", href: "https://www.reddit.com/r/TheOriginOfTheSongs/", Icon: SiReddit },
  { label: "Quora", href: "https://storiesbehindthesongs.quora.com/", Icon: SiQuora },
  { label: "TikTok", href: "https://www.tiktok.com/@whatashowmexico", Icon: SiTiktok },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/stories-behind-songs-927a8b342/",
    Icon: FaLinkedin,
  },
  { label: "Pinterest", href: "https://mx.pinterest.com/StoriesBehindSongs/", Icon: SiPinterest },
];

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-neutral-400 hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap gap-4">
          {SOCIAL_LINKS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-neutral-400 hover:text-white"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-neutral-800 bg-black px-4 py-4 text-center text-xs text-neutral-400">
        storiesbehindsongs.com is a platform that publishes and stores information from different
        articles about popular songs, for the sole purpose of entertainment | 2026
      </div>
    </footer>
  );
}
