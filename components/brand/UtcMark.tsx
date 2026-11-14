// The >_UTC command mark without the wordmark. Coordinates are measured from
// the 1254px logo PNG, so the viewBox is in that image's pixel space.
export function UtcMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="67 373 1120 448"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <polygon points="67,488 250,598 250,650 67,760 67,683 165,624 67,566" />
      <rect x="183" y="760" width="139" height="61" />
      <polygon points="322,489 416,489 416,694 533,694 533,489 634,489 634,775 387,775 322,720" />
      <polygon points="433,373 996,373 996,451 780,451 780,821 674,821 674,451 433,451" />
      <polygon points="825,489 1187,489 1187,571 931,571 931,697 1187,697 1187,781 825,781" />
    </svg>
  );
}

// The mark's chevron on its own, used as the nav pointer.
export function UtcChevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 183 272"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <polygon points="0,0 183,110 183,162 0,272 0,195 98,136 0,78" />
    </svg>
  );
}
