import Link from "next/link";
import { Suspense } from "react";
import { UtcMark } from "@/components/brand/UtcMark";
import { CurrentNavLinks, NavLinks } from "./NavLinks";

// -mb-6 (the --chip size) slides the page up under the header, so the chipped
// corners show the hero behind them instead of an empty notch.
export function Header() {
  return (
    <header className="site-header relative z-10 -mb-6 flex h-24 items-center justify-between bg-white px-10">
      <Link href="/" aria-label="UOWD Tech Club home" className="text-cobalt">
        <UtcMark className="h-10 w-auto" />
      </Link>
      <nav aria-label="Main">
        {/* usePathname can suspend on dynamic routes under cacheComponents. */}
        <Suspense fallback={<NavLinks activeHref={null} />}>
          <CurrentNavLinks />
        </Suspense>
      </nav>
    </header>
  );
}
