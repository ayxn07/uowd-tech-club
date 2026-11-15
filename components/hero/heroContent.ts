type HeroPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
  position?: string;
};

type HeroContent = {
  label: string;
  lines: readonly [string, string, string, string];
  body: string;
  photo: HeroPhoto;
};

const hackathon: HeroPhoto = {
  src: "/images/hero/utc-hero-hackathon.png",
  alt: "Students at a UOWD Tech Club hackathon gathered around laptops and a monitor of code",
  width: 1672,
  height: 941,
  position: "center 42%",
};

const workshop: HeroPhoto = {
  src: "/images/hero/utc-hero-workshop-v2.png",
  alt: "A student leads a coding workshop in front of a screen of code while members follow on laptops",
  width: 1672,
  height: 941,
  position: "center 40%",
};

const pitch: HeroPhoto = {
  src: "/images/hero/utc-hero-pitch.png",
  alt: "A student team pitches their hackathon project on stage with a laptop and a prototype",
  width: 1536,
  height: 1024,
  position: "70% 40%",
};

const community: HeroPhoto = {
  src: "/images/hero/utc-hero-community.png",
  alt: "Club members laughing around a table with laptops, coffee and an app wireframe sketch",
  width: 1536,
  height: 1024,
  position: "40% 40%",
};

export const HERO_ROTATION_MS = 5000;

// Original headings, photos and order, with concise descriptions. The four heading lines
// reserve a consistent amount of space while opacity crossfades the content.
export const HERO_CONTENT: readonly HeroContent[] = [
  {
    label: "UOWD TECH CLUB",
    lines: ["We build", "what's", "coming", "next"],
    body: "UOWD's student-led tech community.",
    photo: hackathon,
  },
  {
    label: "WORKSHOPS",
    lines: ["Learn it.", "Build it.", "Ship", "projects"],
    body: "Learn by building real projects.",
    photo: workshop,
  },
  {
    label: "HACKATHONS",
    lines: ["One idea.", "One team.", "One", "weekend"],
    body: "Build, pitch and compete in one weekend.",
    photo: pitch,
  },
  {
    label: "COMMUNITY",
    lines: ["Built by", "students,", "for", "students"],
    body: "Connect with students and industry.",
    photo: community,
  },
];
