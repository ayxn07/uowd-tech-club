import Link from "next/link";
import { Suspense } from "react";
import { UtcMark } from "@/components/brand/UtcMark";
import { CurrentNavLinks, NavLinks } from "./NavLinks";
import { ScrollHeader } from "./ScrollHeader";

// -mb-5 (the --chip size) slides the page up under the header, so the chipped
// corners show the hero behind them instead of an empty notch.
export function Header() {
  return (
    <ScrollHeader>
      <Link href="/" aria-label="UOWD Tech Club home" className="site-brand text-cobalt" data-intro-target>
        <UtcMark className="h-8 w-auto" />
      </Link>
      <nav aria-label="Main">
        {/* usePathname can suspend on dynamic routes under cacheComponents. */}
        <Suspense fallback={<NavLinks activeHref={null} />}>
          <CurrentNavLinks />
        </Suspense>
      </nav>
    </ScrollHeader>
  );
}
