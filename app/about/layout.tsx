import { Footer } from "@/components/site/Footer";

export default function AboutLayout({ children }: LayoutProps<"/about">) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
