import type { CSSProperties } from "react";
import Image from "next/image";
import { Kalam } from "next/font/google";

const kalam = Kalam({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["400"],
});

// Everything below is measured in the reference pinboard's pixel space
// (1672px wide), so cards, arrows and notes land exactly where the design
// puts them and scale together.
const BOARD = { x: 40, y: 250, w: 1610, h: 640 };

type Box = { x: number; y: number; w: number; h: number };

type Member = {
  name: string;
  role: string;
  slug: string;
  card: Box;
  arrow: Box;
  note: { text: string; x: number; y: number; rotate: number };
};

// Card art (tape, rounded corners, photos) is cut straight from the design;
// the arrows are the design's own strokes, laid back over the same spot.
const CORE_TEAM: Member[] = [
  {
    name: "Rohan Rao",
    role: "President",
    slug: "rohan",
    card: { x: 72, y: 319, w: 427, h: 564 },
    arrow: { x: 80, y: 309, w: 69, h: 101 },
    note: { text: "runs the show", x: 48, y: 303, rotate: -6 },
  },
  {
    name: "Raheel Ahmed",
    role: "Deputy President",
    slug: "raheel",
    card: { x: 510, y: 326, w: 403, h: 550 },
    arrow: { x: 778, y: 282, w: 57, h: 126 },
    note: { text: "right hand", x: 608, y: 296, rotate: -3 },
  },
  {
    name: "Aaron Abraham",
    role: "Vice President",
    slug: "aaron",
    card: { x: 942, y: 394, w: 335, h: 457 },
    arrow: { x: 991, y: 351, w: 45, h: 110 },
    note: { text: "keeps it moving", x: 1046, y: 356, rotate: -7 },
  },
  {
    name: "Sanjar Ghazanfar",
    role: "Coordinator",
    slug: "sanjar",
    card: { x: 1289, y: 395, w: 334, h: 461 },
    arrow: { x: 1534, y: 356, w: 68, h: 118 },
    note: { text: "gets it done", x: 1424, y: 344, rotate: 2 },
  },
];

// Part of the card and arrow filenames. next/image caches optimized images by URL (for
// hours, and in the dev server's memory), so bump this and rename the files
// whenever the card art changes, or the old art keeps being served.
const CARD_ART_VERSION = "v2";

const pct = (value: number, of: number) => `${(value / of) * 100}%`;

export function CoreTeam() {
  return (
    <div className={`utc-core-team ${kalam.variable}`}>
      <h2 id="core-team-heading" className="utc-core-team-heading">
        The Core Team
      </h2>
      <ul className="utc-core-team-cards">
        {CORE_TEAM.map(({ name, role, slug, card, arrow, note }) => (
          <li
            key={slug}
            className="utc-core-team-member"
            style={
              {
                "--card-left": pct(card.x - BOARD.x, BOARD.w),
                "--card-top": pct(card.y - BOARD.y, BOARD.h),
                "--card-width": pct(card.w, BOARD.w),
              } as CSSProperties
            }
          >
            <div className="utc-core-team-card">
              <Image
                src={`/images/teams/core/cards/${slug}-${CARD_ART_VERSION}.png`}
                alt={`${name}, ${role}`}
                width={card.w * 2}
                height={card.h * 2}
                sizes="(max-width: 700px) 80vw, 27vw"
              />
              <svg
                className="utc-core-team-note"
                viewBox={`${card.x} ${card.y} ${card.w} ${card.h}`}
                aria-hidden="true"
              >
                <image
                  href={`/images/teams/core/arrows/${slug}-${CARD_ART_VERSION}.png`}
                  x={arrow.x}
                  y={arrow.y}
                  width={arrow.w}
                  height={arrow.h}
                />
                <text x={note.x} y={note.y} transform={`rotate(${note.rotate} ${note.x} ${note.y})`}>
                  {note.text}
                </text>
              </svg>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
