export type AcademicYear = {
  id: string;
  label: string;
  startYear: number;
  chapter: string;
  summary: string;
  membership: string;
  highlights: readonly string[];
  featuredEventId: string;
};

export type HistoryEvent = {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  category: string;
  description: string;
  location?: "Online" | "On campus";
};

// Selected milestones and events from the supplied club history. Membership
// belongs to the recorded academic year, rather than being a live club count.
export const HISTORY_YEARS: readonly AcademicYear[] = [
  {
    id: "2022-23",
    label: "2022–23",
    startYear: 2022,
    chapter: "The beginning",
    summary: "A student idea became a club. Coding workshops, collaborations and the first media and events teams laid the foundations.",
    membership: "Around 10 students (estimated)",
    highlights: ["Founded 19 September 2022", "Media and events teams formed"],
    featuredEventId: "club-founded",
  },
  {
    id: "2023-24",
    label: "2023–24",
    startYear: 2023,
    chapter: "Finding structure",
    summary: "A new leadership team brought more structure, while workshops connected design, machine learning and hands-on engineering.",
    membership: "20–30 students",
    highlights: ["New leadership structure", "More cross-club collaborations"],
    featuredEventId: "figma-2024",
  },
  {
    id: "2024-25",
    label: "2024–25",
    startYear: 2024,
    chapter: "Building momentum",
    summary: "Specialist teams took shape. Members explored AI, web development and engineering in a year recognised with Club of the Year.",
    membership: "50 students",
    highlights: ["Specialist teams expanded", "Club of the Year 2024–25"],
    featuredEventId: "ai-challenge",
  },
  {
    id: "2025-26",
    label: "2025–26",
    startYear: 2025,
    chapter: "New chapters",
    summary: "Cybersecurity, AI and programming opened new paths, from multi-session build series to UOWD’s first Capture the Flag.",
    membership: "60 students",
    highlights: ["Best Event Award", "Innovation in Student Engagement Award"],
    featuredEventId: "uowd-ctf",
  },
];

export const HISTORY_EVENTS: readonly HistoryEvent[] = [
  { id: "club-founded", title: "The club begins", date: "2022-09-19", category: "Milestone", description: "The first official UOWD Tech Club post marked the beginning. Founded by Mohamad Dahhan and co-founder Adam Ahsan." },
  { id: "dedsec", title: "DEDSEC CTF", date: "2022-10-14", category: "Cybersecurity", description: "UOWD and RIT collaborated on a Capture the Flag competition at the RIT campus." },
  { id: "git-set-bash", title: "GIT | SET | BASH", date: "2022-11-09", category: "Programming", description: "An introduction to Git, GitHub and the Unix command line." },
  { id: "programming-101", title: "Programming 101", date: "2022-11-10", category: "Programming", description: "Getting started with Python syntax, variables and arithmetic operators." },
  { id: "github-cicd", title: "GitHub CI/CD", date: "2023-01-16", category: "Programming", description: "Working with GitHub repositories for a seven-day Programming 101 competition." },
  { id: "understanding-ai", title: "Understanding AI", date: "2023-01-23", category: "AI", description: "Exploring AI and machine learning fundamentals through real-world applications." },
  { id: "tech-talk", title: "Tech Talk", date: "2023-03-02", category: "Community", description: "An informal tech conversation at the university café." },
  { id: "ethical-hacking", title: "Website Ethical Hacking", date: "2023-03-14", category: "Cybersecurity", description: "An introduction to SQL injection, XSS, CSRF and ethical hacking tools." },
  { id: "jeopardy", title: "Jeopardy", date: "2023-05-03", category: "Community", description: "A classic Jeopardy collaboration with the Theatre, Finance and Fitspiration clubs." },
  { id: "binance-academy", title: "Binance Academy", date: "2023-05-11", category: "Industry", description: "An introduction to trading and investment strategies with the Finance Club and Binance Academy." },
  { id: "egg-drop-2024", title: "Egg Drop Challenge", date: "2024-01-19", category: "Engineering", description: "A hands-on egg drop challenge with the Engineers Australia Club." },
  { id: "figma-2024", title: "Figma Workshop", date: "2024-02-05", category: "Design", description: "A practical introduction to designing with Figma." },
  { id: "machine-learning", title: "Machine Learning Workshop", date: "2024-05-01", category: "AI", description: "Bridging machine learning theory and real-world applications." },
  { id: "icp", title: "ICP Event", date: "2024-06-12", category: "Industry", description: "Blockchain and ICP fundamentals with the Finance Society, under the UAE ICP HUBS Network." },
  { id: "github-2024", title: "GitHub Workshop", date: "2024-10-30", category: "Programming", description: "Version control, Git versus GitHub and interactive activities to put the basics into practice." },
  { id: "3d-printing", title: "3D Printing Workshop", date: "2024-11-06", category: "Engineering", description: "From Fusion 360 designs to slicing and setting up a 3D printer." },
  { id: "phoenix-contact", title: "Phoenix Contact Trip", date: "2024-11-11", category: "Industry", description: "A visit to Phoenix Contact headquarters organised by the School of Engineering." },
  { id: "ai-ml-foundations", title: "Foundations of AI & ML", date: "2025-01-11", category: "AI", description: "Exploring AI and machine learning through data visualisation with Matplotlib and Seaborn." },
  { id: "rag-agents", title: "Introduction to RAG & Agents", date: "2025-01-23", category: "AI", description: "Understanding retrieval-augmented generation and creating a pipeline with FAISS or Chroma." },
  { id: "react-1", title: "React Foundation Series · 1", date: "2025-01-30", category: "Programming", description: "The first session in a three-part journey from React fundamentals to launching a portfolio." },
  { id: "react-2", title: "React Foundation Series · 2", date: "2025-02-06", category: "Programming", description: "Continuing the React series with hands-on portfolio building." },
  { id: "arduino", title: "Arduino Workshop", date: "2025-02-06", category: "Engineering", description: "Hands-on circuit building and Arduino programming, with an introduction to IoT." },
  { id: "advanced-rag", title: "Advanced RAG", date: "2025-02-13", category: "AI", description: "A deeper dive into retrieval-augmented generation and its practical applications." },
  { id: "react-3", title: "React Foundation Series · 3", date: "2025-02-20", category: "Programming", description: "The final session of the React portfolio-building and launch series." },
  { id: "ai-challenge", title: "The AI Challenge", date: "2025-02-21", category: "AI", description: "A panel exploring the boundaries of AI applications, followed by a four-hour innovation hackathon. A collaboration with UOWD Alumni and Dubai Police." },
  { id: "laser-cutting", title: "Laser Cutting Workshop", date: "2025-02-24", category: "Engineering", description: "Learning laser cutting fundamentals through hands-on experience." },
  { id: "code-connect-figma", title: "Code & Connect: Figma", date: "2025-02-25", category: "Design", description: "Figma essentials through interactive design challenges and expert guidance." },
  { id: "ros2", title: "Swarm Robot ROS2 Workshop", date: "2025-03-06", category: "Engineering", description: "Exploring robotics with RoboEd founder and CEO Marah Saleh." },
  { id: "dubai-ai", title: "Dubai AI Festival Trip", date: "2025-04-24", category: "Industry", description: "A club visit to the Dubai AI Festival at Madinat Jumeirah." },
  { id: "intro-robotics", title: "Intro to Robotics", date: "2025-04-24", category: "Engineering", description: "Combining AI and automation in a workshop with Engineers Australia." },
  { id: "discord-bot", title: "Build Your Own Discord Bot", date: "2025-04-29", category: "Programming", description: "An interactive session on creating a working Discord bot." },
  { id: "prompt-engineering", title: "Prompt Engineering Challenge", date: "2025-05-08", category: "AI", description: "A hands-on prompt engineering workshop exploring tools such as ChatGPT." },
  { id: "iot-101", title: "IoT 101", date: "2025-05-15", category: "Engineering", description: "From sensors to the cloud: exploring the Internet of Things in action." },
  { id: "aws-summit", title: "AWS Summit Dubai Trip", date: "2025-05-17", category: "Industry", description: "Sessions, workshops and conversations with industry experts at AWS Summit Dubai." },
  { id: "ai-vision", title: "AI Vision 101", date: "2025-05-27", category: "AI", description: "Building an emotion-detecting face filter with OpenCV and DeepFace." },
  { id: "supabase", title: "Fullstack: Supabase Workshop", date: "2025-06-03", category: "Programming", description: "Building real-time solutions with Supabase and JavaScript." },
  { id: "awards-night", title: "Awards Night", date: "2025-06-19", category: "Community", description: "An evening bringing the club’s executives together to celebrate the year." },
  { id: "egg-drop-2025", title: "Egg Drop Challenge", date: "2025-10-02", category: "Engineering", description: "Teams of four designed, built and tested an egg-protecting contraption with Engineers Australia." },
  { id: "python-everyone", title: "Python for Everyone", date: "2025-10-06", category: "Programming", description: "Hands-on Python basics: variables, loops, functions and conditions." },
  { id: "iot-series-1", title: "IoT Series · 1", date: "2025-10-08", category: "Engineering", description: "The first of three workshops exploring IoT, Arduino and OpenCV." },
  { id: "ai-app-1", title: "Build Your AI App · 1", date: "2025-10-09", category: "AI", description: "The first of two interactive workshops taking machine learning foundations towards a deployed demo." },
  { id: "prompt-blitz", title: "Prompt Blitz", date: "2025-10-14", category: "AI", description: "An AI web development challenge testing creativity, speed and design." },
  { id: "iot-series-2", title: "IoT Series · 2", date: "2025-10-15", category: "Engineering", description: "Continuing the three-part IoT series towards a motion-detected Arduino LED controller." },
  { id: "gitex", title: "GITEX 2025 Trip", date: "2025-10-15", category: "Industry", description: "A UOWD Tech Club visit to GITEX 2025." },
  { id: "iot-series-3", title: "IoT Series · 3", date: "2025-10-22", category: "Engineering", description: "Completing the IoT series with a motion-detected Arduino LED controller project." },
  { id: "halloween", title: "Halloween Escape Room", date: "2025-10-31", category: "Community", description: "A Halloween escape room in the student lounge, created with clubs and societies." },
  { id: "ai-app-2", title: "Build Your AI App · 2", date: "2025-11-06", category: "AI", description: "The second AI app workshop, progressing towards deploying a demo." },
  { id: "python-bootcamp", title: "Python Bootcamp", date: "2026-01-20", category: "Programming", description: "Python syntax, operations and fundamentals in a hands-on environment." },
  { id: "ai-innovators", title: "AI Innovators Hackathon", date: "2026-01-22", category: "AI", description: "A five-hour hackathon with professors and UOWD Alumni as judges, in collaboration with Kitty’s Café." },
  { id: "web-exploitation", title: "Web Exploitation Workshop", date: "2026-02-09", category: "Cybersecurity", description: "An introduction to web exploitation using PortSwigger." },
  { id: "agentic-ai", title: "Agentic AI Workshop", date: "2026-02-11", category: "AI", description: "Building AI agents that think, plan and act, while understanding their architecture." },
  { id: "among-us", title: "Among Us IRL", date: "2026-02-12", category: "Community", description: "Three hours of real-life Among Us, supported by a phone application for tasks and eliminations." },
  { id: "automation", title: "Automation Workshop", date: "2026-02-17", category: "Programming", description: "Using tools such as Zapier and n8n to build and automate a working bot." },
  { id: "hack-cloud", title: "Hack The Cloud", date: "2026-04-30", category: "Cybersecurity", description: "Exploring cloud hacking in a controlled Juice Shop environment.", location: "Online" },
  { id: "osint", title: "Find The Hacker (OSINT)", date: "2026-05-07", category: "Cybersecurity", description: "Using open-source intelligence tools to hunt a fictional hacker like a digital investigator.", location: "Online" },
  { id: "odoo-series", title: "The Odoo Series", date: "2026-06-01", endDate: "2026-06-08", category: "Industry", description: "Five workshops leading to a hackathon-style competition, in collaboration with Engineers Australia and Odoo.", location: "Online" },
  { id: "mcp-build", title: "MCP Build Series", date: "2026-06-09", endDate: "2026-06-10", category: "AI", description: "Exploring MCP and agentic logic, followed by a next-day competition judged by professors.", location: "Online" },
  { id: "uowd-ctf", title: "UOWD Capture the Flag", date: "2026-06-22", category: "Cybersecurity", description: "The first UOWD CTF: a four-hour competition in partnership with DEF-X and HackTheBox.", location: "On campus" },
  { id: "isit224", title: "ISIT224 Pitch Presentations", date: "2026-06-27", category: "Community", description: "Supporting Professor Zeenath and the final student pitches for ISIT224.", location: "On campus" },
];
