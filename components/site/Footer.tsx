import { UtcMark } from "@/components/brand/UtcMark";
import { InteractiveGrid } from "@/components/InteractiveGrid";
import { FooterStickers, StickerSlot, type FooterStickerId } from "./FooterStickers";

type SocialLink = { label: string; href: string; sticker: FooterStickerId };

// Real handles are still to come from the club.
const FOLLOW: SocialLink[] = [
  { label: "LinkedIn", href: "#", sticker: "linkedin" },
  { label: "Instagram", href: "#", sticker: "instagram" },
];

const CONNECT: SocialLink[] = [
  { label: "Email", href: "#", sticker: "email" },
  { label: "GitHub", href: "#", sticker: "github" },
];

// Sticker slots sit on the inner side of each word: after the left column's
// links, before the right column's.
function SocialList({
  label,
  links,
  align,
}: {
  label: string;
  links: SocialLink[];
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "ml-auto text-right" : undefined}>
      <p className="hero-label footer-social-label" data-align={align}>
        {align === "right" ? `${label} _<` : `>_ ${label}`}
      </p>
      <ul className={`mt-4 flex flex-col gap-2 ${align === "right" ? "items-end" : "items-start"}`}>
        {links.map((link) => (
          <li key={link.label} className="flex items-center gap-3 last:translate-y-[6px]">
            {align === "right" && <StickerSlot id={link.sticker} />}
            <a href={link.href} className="footer-link">
              <span className="footer-link-label">{link.label}</span>
            </a>
            {align === "left" && <StickerSlot id={link.sticker} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

// White half-height footer. On scroll, cobalt cells fill a stepped semicircle
// from the top centre outwards; the white logo sits on top and only shows
// where the cells behind it have turned cobalt.
export function Footer() {
  return (
    <footer className="site-footer section-light relative min-h-[max(28rem,50svh)] overflow-hidden">
      <InteractiveGrid arc />

      <div className="footer-logo relative mx-auto flex w-fit max-w-full flex-col items-center px-6 pt-16 text-center text-white">
        <UtcMark className="h-32 w-auto" />
        <p className="footer-wordmark mt-5">UOWD Tech Club</p>
      </div>

      <div className="relative flex flex-col justify-end px-6 pt-12 pb-8 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SocialList label="FOLLOW" links={FOLLOW} align="left" />
          <SocialList label="CONNECT" links={CONNECT} align="right" />
        </div>
        <div className="footer-meta mt-8 flex flex-wrap justify-between gap-4">
          <p>&copy; 2026 UOWD Tech Club</p>
          <p>University of Wollongong, Dubai</p>
        </div>
      </div>

      {/* Stickers start on their slots and can be dragged anywhere in the footer. */}
      <FooterStickers />
    </footer>
  );
}
