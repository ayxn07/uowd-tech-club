export type ClubEvent = {
  slug: string;
  title: string;
  type: string;
  topic: "Development" | "AI & ML";
  date: string;
  summary: string;
  description: string;
};

// The demo workshop lineup already shown on the homepage. Logistics and booking
// links have not been supplied, so those remain unconfirmed in the event UI.
export const EVENTS: readonly ClubEvent[] = [
  {
    slug: "vibe-coding",
    title: "Vibe Coding",
    type: "Workshop",
    topic: "Development",
    date: "2026-11-18",
    summary: "Turn an idea into a starting point with AI-assisted coding.",
    description: "Explore a different way to build: describe an idea, experiment with AI-generated code, and understand the result. A starting point for thinking about where AI fits into your development process.",
  },
  {
    slug: "git-github",
    title: "Git & GitHub",
    type: "Workshop",
    topic: "Development",
    date: "2026-11-25",
    summary: "Make changes. Keep track. Build better together.",
    description: "Get to know the tools behind collaborative development. Explore version control, repositories and the role Git and GitHub play in keeping a project organised as it grows.",
  },
  {
    slug: "ai-llms",
    title: "AI & LLMs",
    type: "Workshop",
    topic: "AI & ML",
    date: "2026-12-02",
    summary: "Go beyond the prompt and explore large language models.",
    description: "Take a closer look at large language models and the ideas behind them. Explore how they relate to the wider world of AI, where they can help, and why understanding their limitations matters.",
  },
  {
    slug: "ai-101",
    title: "AI 101",
    type: "Workshop",
    topic: "AI & ML",
    date: "2026-12-09",
    summary: "Start with the fundamentals. Find your way into AI.",
    description: "Curious about artificial intelligence? Start with the core ideas, vocabulary and everyday applications that make the field easier to navigate. A first step towards exploring what you could build next.",
  },
];

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Dubai",
});

export function formatEventDate(date: string) {
  return dateFormat.format(new Date(`${date}T12:00:00+04:00`));
}

export function findEvents(query: string, topic: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return EVENTS.filter((event) => {
    const text = `${event.title} ${event.type} ${event.topic} ${event.summary}`.toLowerCase();
    return (topic === "All" || event.topic === topic) && words.every((word) => text.includes(word));
  });
}
