import type { Metadata } from "next";
import { EmptyPage } from "@/components/site/EmptyPage";

export const metadata: Metadata = {
  title: "News | UOWD Tech Club",
};

export default function NewsPage() {
  return <EmptyPage title="News" />;
}
