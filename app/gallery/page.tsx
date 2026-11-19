import type { Metadata } from "next";
import { EmptyPage } from "@/components/site/EmptyPage";

export const metadata: Metadata = {
  title: "Gallery | UOWD Tech Club",
};

export default function GalleryPage() {
  return <EmptyPage title="Gallery" />;
}
