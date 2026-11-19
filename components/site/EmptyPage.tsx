import { InteractiveGrid } from "@/components/InteractiveGrid";

export function EmptyPage({ title }: { title: string }) {
  return (
    <main className="relative isolate min-h-screen bg-cobalt text-white">
      <InteractiveGrid />
      <h1 className="sr-only">{title}</h1>
    </main>
  );
}
