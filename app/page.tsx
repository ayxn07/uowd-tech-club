import { About } from "@/components/about/About";
import { Hero } from "@/components/hero/Hero";
import { Footer } from "@/components/site/Footer";
import { UpNext } from "@/components/up-next/UpNext";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <UpNext />
      <Footer />
    </>
  );
}
