import { UtcMark } from "@/components/brand/UtcMark";
import { InteractiveGrid } from "@/components/InteractiveGrid";

// Real handles are still to come from the club.
const FOLLOW = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
];

const CONNECT = [
  { label: "GitHub", href: "#" },
  { label: "Email", href: "#" },
];

function SocialList({
  label,
  links,
  align,
}: {
  label: string;
  links: { label: string; href: string }[];
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <p className="hero-label">&gt;_ {label}</p>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="footer-link">
              {link.label}
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
                <path
                  d="M4 16 15 5M7 4h9v9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="square"
                />
              </svg>
            </a>
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
    <footer className="section-light relative h-[50svh] min-h-[28rem] overflow-hidden">
      <InteractiveGrid arc />

      <div className="footer-logo absolute top-[40%] left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-white">
        <UtcMark className="h-32 w-auto" />
        <p className="footer-wordmark mt-5">UOWD Tech Club</p>
      </div>

      <div className="relative flex h-full flex-col justify-end px-10 pb-8">
        <div className="flex items-end justify-between">
          <SocialList label="FOLLOW" links={FOLLOW} align="left" />
          <SocialList label="CONNECT" links={CONNECT} align="right" />
        </div>
        <div className="footer-meta mt-8 flex justify-between">
          <p>&copy; 2026 UOWD Tech Club</p>
          <p>University of Wollongong in Dubai</p>
        </div>
      </div>
    </footer>
  );
}
