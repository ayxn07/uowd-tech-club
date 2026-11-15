import type { Metadata } from "next";
import { InteractiveGrid } from "@/components/InteractiveGrid";
import { HistoryCalendar } from "@/components/about/HistoryCalendar";
import { AwardTrophy } from "@/components/about/AwardTrophy";
import { HistoryCardStack } from "@/components/about/HistoryCardStack";
import "@/components/about/AboutPage.css";
import "@/components/about/HistoryCardStack.css";

export const metadata: Metadata = {
  title: "About | UOWD Tech Club",
  description: "Built by students, shaped by doing. Explore UOWD Tech Club’s story, milestones and event archive from 2022 to 2026.",
};

export default function AboutPage() {
  return (
    <main className="utc-about-page">
      <InteractiveGrid />
      <section className="utc-about-intro" aria-labelledby="utc-about-heading">
        <div className="utc-about-container">
          <div className="utc-about-intro-layout">
            <div className="utc-about-intro-copy">
              <p className="utc-about-eyebrow">&gt;_ 01 / ABOUT UTC</p>
              <h1 id="utc-about-heading" className="utc-about-title">
                <span>Built by students.</span>
                <span>Shaped by doing.</span>
              </h1>
              <p className="utc-about-lead">
                The student-led tech community at the University of Wollongong
                in Dubai. A place to learn, build and connect.
              </p>
            </div>

            <dl className="utc-about-facts">
              <div className="utc-about-fact">
                <dt>Founded</dt>
                <dd>2022<span>Where the story starts.</span></dd>
              </div>
              <div className="utc-about-fact">
                <dt>Members / 2025–26</dt>
                <dd>60<span>A chapter in our growth.</span></dd>
              </div>
              <div className="utc-about-fact utc-about-fact-award">
                <dt>Club of the Year</dt>
                <dd>
                  2024 - 2025
                  <span>Student ideas. Shared effort. Real recognition.</span>
                  <AwardTrophy />
                </dd>
              </div>
            </dl>
          </div>

          <HistoryCardStack />
        </div>
      </section>

      <section id="club-history" className="utc-about-history" aria-labelledby="utc-history-heading">
        <div className="utc-about-container">
          <div className="utc-about-history-heading">
            <div>
              <p className="utc-about-eyebrow">&gt;_ 02 / THE ARCHIVE</p>
              <h2 id="utc-history-heading">Our story,<br />one date at a time.</h2>
            </div>
            <p>
              Every workshop, challenge and shared idea adds to the story.
              Choose a year, find a date and explore what we built together.
            </p>
          </div>
          <HistoryCalendar />
        </div>
      </section>
    </main>
  );
}
