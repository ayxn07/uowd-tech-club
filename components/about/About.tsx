import Image from "next/image";
import { InteractiveGrid } from "@/components/InteractiveGrid";
import { RevealOnScroll } from "./RevealOnScroll";

const PILLARS = [
  {
    number: "01",
    title: "Learn",
    body: "Workshops led by members, from first code to full-stack.",
  },
  {
    number: "02",
    title: "Build",
    body: "Hackathons and team projects that ship.",
  },
  {
    number: "03",
    title: "Connect",
    body: "Meetups and talks with members and industry.",
  },
];

export function About() {
  return (
    <section
      className="section-light relative min-h-svh overflow-x-clip"
      aria-labelledby="about-heading"
    >
      <InteractiveGrid dissolveRows={5} />

      <RevealOnScroll className="about relative flex min-h-svh flex-col px-10 pt-24 pb-16">
        <div className="grid flex-1 grid-cols-2 items-center gap-10">
          <div className="about-copy">
            <p className="hero-label">&gt;_ ABOUT UTC</p>
            <h2 id="about-heading" className="about-heading mt-6">
              A <span className="hl">club</span> run
              <br />
              by <span className="hl">students</span>,
              <br />
              for <span className="hl">builders</span>
            </h2>
            <p className="hero-body mt-8 max-w-[36rem]">
              UOWD Tech Club is the student-led tech community at the
              University of Wollongong in Dubai. Members from every degree join
              teams for programming, design, media and more, then put what they
              learn to work.
            </p>
          </div>

          {/* A border can't follow clip-path corners, so the frame is a cobalt
              plate with the photo inset 6px on top, both chamfered. */}
          <div className="about-photo relative h-[62svh] min-h-[22rem]">
            <div className="chamfer absolute inset-0 bg-cobalt" />
            <div className="chamfer chamfer-inner absolute inset-[6px]">
              <Image
                src="/images/about/utc-about-lab.png"
                alt="Club members working together on a laptop and a robot car kit in a campus lab"
                fill
                sizes="50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="about-pillars mt-14 grid grid-cols-3 border-4 border-cobalt">
          {PILLARS.map((pillar, index) => (
            <div
              key={pillar.number}
              className={`px-10 py-8 ${index === 0 ? "" : "border-l-4 border-cobalt"}`}
            >
              <h3 className="about-pillar-title">
                <span className="about-pillar-number">{pillar.number}</span>
                {pillar.title}
              </h3>
              <p className="about-pillar-body mt-4 max-w-[22rem]">{pillar.body}</p>
            </div>
          ))}
        </div>
      </RevealOnScroll>
    </section>
  );
}
