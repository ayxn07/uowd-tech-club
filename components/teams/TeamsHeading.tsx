import Image from "next/image";
import { RevealOnScroll } from "@/components/about/RevealOnScroll";
import { TeamsArrows } from "./TeamsArrows";
import "./TeamsHeading.css";

// "Meet the team" lettering and its arrows. When the hero opens, the lettering
// slides down into place and the arrows draw themselves once it settles.
export function TeamsHeading() {
  return (
    <RevealOnScroll className="utc-teams-heading" replayOnNavigation="/teams">
      {/* Vector paths retain the approved reference lettering and doodles. */}
      <Image
        className="utc-teams-lettering"
        src="/images/teams/teams-reference-lettering-smooth.svg"
        alt=""
        aria-hidden="true"
        width={1672}
        height={838}
        loading="eager"
        unoptimized
      />
      <TeamsArrows />
    </RevealOnScroll>
  );
}
