import type { ReactNode } from "react";
import { Footer } from "@/components/site/Footer";
import "@/components/events/Events.css";

export default function EventsLayout({ children }: { children: ReactNode }) {
  return <>{children}<Footer /></>;
}
