import type { Metadata } from "next";
import Image from "next/image";
import { InteractiveGrid } from "@/components/InteractiveGrid";
import { TeamsHeading } from "@/components/teams/TeamsHeading";
import { CoreTeam } from "@/components/teams/CoreTeam";
import "./teams.css";

export const metadata: Metadata = {
  title: "Teams | UOWD Tech Club",
};

export default function TeamsPage() {
  return (
    <main className="utc-teams">
      <section className="utc-teams-hero" aria-labelledby="teams-heading">
        <div className="utc-teams-backdrop" aria-hidden="true" />
        <h1 id="teams-heading" className="sr-only">Meet the team — 2026–27</h1>
        <TeamsHeading />
        <Image
          className="utc-teams-cutout"
          src="/images/teams/utc-team-cutout-2026-27.png"
          alt="The fourteen members of the 2026–27 UOWD Tech Club team."
          width={6000}
          height={3375}
          loading="eager"
          fetchPriority="high"
          unoptimized
        />
        <div className="utc-teams-bottom-fade" aria-hidden="true" />
      </section>
      <section className="utc-teams-grid-section" aria-labelledby="core-team-heading">
        <div className="utc-teams-grid-layer" aria-hidden="true">
          <InteractiveGrid />
        </div>
        <CoreTeam />
      </section>
    </main>
  );
}
