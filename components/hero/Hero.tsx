"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { InteractiveGrid } from "@/components/InteractiveGrid";

const SLIDE_MS = 5000;
// The page-load entrance ends at 1360 ms (third copy line: 460 ms delay +
// 900 ms).
const INTRO_MS = 1400;

type Side = "left" | "right";

type Slide = {
  photo: Side;
  image: string;
  alt: string;
  label: string;
  lines: [string, string, string];
  body: string;
};

const SLIDES: Slide[] = [
  {
    photo: "right",
    image: "/images/hero/utc-hero-hackathon.png",
    alt: "Students at a UOWD Tech Club hackathon gathered around laptops and a monitor of code",
    label: "UOWD TECH CLUB",
    lines: ["We build", "what's", "coming next"],
    body: "The student tech community at the University of Wollongong in Dubai. We run workshops, hackathons and talks where members code, design and ship real projects.",
  },
  {
    photo: "left",
    image: "/images/hero/utc-hero-workshop-v2.png",
    alt: "A student leads a coding workshop in front of a screen of code while members follow on laptops",
    label: "WORKSHOPS",
    lines: ["Learn it.", "Build it.", "Ship projects"],
    body: "Hands-on sessions led by members, from your first API to deploying a full-stack app. Bring a laptop and leave with something that works.",
  },
  {
    photo: "right",
    image: "/images/hero/utc-hero-pitch.png",
    alt: "A student team pitches their hackathon project on stage with a laptop and a prototype",
    label: "HACKATHONS",
    lines: ["One idea.", "One team.", "One weekend"],
    body: "Teams design, build and pitch a working project, with mentors on hand from the first sketch to the final demo.",
  },
  {
    photo: "left",
    image: "/images/hero/utc-hero-community.png",
    alt: "Club members laughing around a table with laptops, coffee and an app wireframe sketch",
    label: "COMMUNITY",
    lines: ["Built by", "students,", "for students"],
    body: "Every team is run by students. Meetups and talks bring members together with each other and with people from the industry.",
  },
];

// The chevron edge for a photo on the right, as percentages of the hero box
// (x, y), from the user's sketch. The box starts 1.5rem up under the header,
// so the top point is extended along the same slope to y = 0.
const EDGE_TOP_X = 38.7;
const EDGE_TIP = [64.75, 58.8];
const EDGE_BOTTOM_X = 46.25;

// The photo box spans from the edge's outermost point to the side of the page,
// so the image is cropped to the area it is shown in.
const BOX_WIDTH = 100 - EDGE_TOP_X;

function inBox(x: number) {
  return ((x - EDGE_TOP_X) / BOX_WIDTH) * 100;
}

const TIP_X = inBox(EDGE_TIP[0]);
const BOTTOM_X = inBox(EDGE_BOTTOM_X);

// Box-relative outline for a photo on the right; a photo on the left mirrors x.
const RIGHT_OUTLINE = [
  [0, 0],
  [100, 0],
  [100, 100],
  [BOTTOM_X, 100],
  [TIP_X, EDGE_TIP[1]],
];
// The edge line runs 5% past the top and bottom along the same slopes, so the
// hero's overflow cuts it flush instead of showing the stroke's square ends.
const OVERSHOOT = 5;
const RIGHT_EDGE = [
  [-TIP_X * (OVERSHOOT / EDGE_TIP[1]), -OVERSHOOT],
  [TIP_X, EDGE_TIP[1]],
  [
    BOTTOM_X + (BOTTOM_X - TIP_X) * (OVERSHOOT / (100 - EDGE_TIP[1])),
    100 + OVERSHOOT,
  ],
];

function mirror(points: number[][], side: Side) {
  return side === "right" ? points : points.map(([x, y]) => [100 - x, y]);
}

function clipFor(side: Side) {
  const points = mirror(RIGHT_OUTLINE, side)
    .map(([x, y]) => `${x.toFixed(2)}% ${y}%`)
    .join(", ");
  return `polygon(${points})`;
}

function edgeFor(side: Side) {
  return mirror(RIGHT_EDGE, side)
    .map(([x, y]) => `${x.toFixed(2)},${y}`)
    .join(" ");
}

export function Hero() {
  const [active, setActive] = useState(0);
  // The first slide plays a CSS entrance on page load. The flag is cleared as
  // soon as that entrance ends: removing the animation in the same render as
  // data-active stops the browser from running the slide-out transition, so
  // the first slide used to vanish instead of sliding out.
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const introId = setTimeout(() => setIntro(false), INTRO_MS);
    const id = setInterval(() => {
      setActive((index) => (index + 1) % SLIDES.length);
    }, SLIDE_MS);
    return () => {
      clearTimeout(introId);
      clearInterval(id);
    };
  }, []);

  return (
    <section
      className="hero relative h-[calc(100svh-4.5rem)] overflow-hidden"
      aria-roledescription="carousel"
      aria-label="UOWD Tech Club highlights"
    >
      <InteractiveGrid />
      {SLIDES.map((slide, index) => {
        const isActive = index === active;
        const copySide: Side = slide.photo === "right" ? "left" : "right";
        const Heading = index === 0 ? "h1" : "h2";

        return (
          <div
            key={slide.image}
            className="hero-slide absolute inset-0"
            data-active={isActive ? "" : undefined}
            data-intro={intro && index === 0 ? "" : undefined}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${SLIDES.length}`}
            aria-hidden={!isActive}
            inert={!isActive}
          >
            <div
              className="hero-photo absolute inset-y-0"
              data-side={slide.photo}
              style={{
                width: `${BOX_WIDTH}%`,
                [slide.photo]: 0,
              }}
            >
              <div
                className="absolute inset-0"
                style={{ clipPath: clipFor(slide.photo) }}
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  sizes="62vw"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  className={`object-cover ${slide.photo === "right" ? "object-right" : "object-left"}`}
                />
              </div>
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden
              >
                <polyline
                  points={edgeFor(slide.photo)}
                  fill="none"
                  stroke="white"
                  strokeWidth={7}
                  strokeLinejoin="miter"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {/* The white edge turns the corner and runs along the photo's
                  bottom to the side of the page. */}
              <div
                className="absolute bottom-0 h-[7px] bg-white"
                style={
                  slide.photo === "right"
                    ? { left: `${BOTTOM_X}%`, right: 0 }
                    : { left: 0, right: `${BOTTOM_X}%` }
                }
              />
            </div>

            <div
              className={`hero-copy absolute inset-y-0 flex flex-col justify-center px-10 pt-6 ${
                copySide === "left" ? "left-0" : "right-0 items-end text-right"
              }`}
              data-side={copySide}
            >
              <p className="hero-label">&gt;_ {slide.label}</p>
              <Heading className="hero-heading mt-5">
                {slide.lines[0]}
                <br />
                {slide.lines[1]}
                <br />
                {slide.lines[2]}
                <span className="hero-underscore" aria-hidden />
              </Heading>
              <p className="hero-body mt-8 max-w-[34rem]">{slide.body}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
