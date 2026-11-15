"use client";

import { useRef } from "react";
import StickerPeel from "@/components/StickerPeel";

export const FOOTER_STICKERS = {
  linkedin: "/images/stickers/linkedin.png",
  instagram: "/images/stickers/instagram.png",
  email: "/images/stickers/gmail.png",
  github: "/images/stickers/github.png",
} as const;

export type FooterStickerId = keyof typeof FOOTER_STICKERS;

// Empty placeholder beside a link: it reserves the space and marks where the
// sticker starts out.
export function StickerSlot({ id }: { id: FooterStickerId }) {
  return (
    <span
      data-sticker-slot={id}
      aria-hidden
      style={{ display: "inline-block", flexShrink: 0, width: "1.75rem", height: "1.75rem" }}
    />
  );
}

// A layer over the whole footer. Each sticker starts on its slot and can then
// be peeled, or dragged and thrown anywhere inside the footer. Only the
// stickers themselves catch the pointer; the rest of the layer lets clicks through.
export function FooterStickers() {
  const layerRef = useRef<HTMLDivElement>(null);
  const slot = (id: FooterStickerId) => () =>
    layerRef.current?.parentElement?.querySelector(`[data-sticker-slot="${id}"]`);

  return (
    <div
      ref={layerRef}
      aria-hidden
      style={{ position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none" }}
    >
      {(Object.keys(FOOTER_STICKERS) as FooterStickerId[]).map((id) => (
        <StickerPeel
          key={id}
          imageSrc={FOOTER_STICKERS[id]}
          anchor={slot(id)}
          width={26}
          hitSlop={6}
          finish="matte"
          peelBackHoverPct={30}
          peelBackActivePct={55}
          rotate={0}
          peelDirection={0}
          curlRadius={3}
          backColor="#f4f4f5"
          lightingIntensity={0.2}
          shadowIntensity={0.45}
          followPointer
          swing={1}
          friction={0.57}
          bounce={0.35}
          draggable
          intro
        />
      ))}
    </div>
  );
}
