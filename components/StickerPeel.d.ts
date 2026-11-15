import type { CSSProperties, HTMLAttributes, JSX } from "react";

// Types for the React Bits StickerPeel component (StickerPeel.jsx).
export interface StickerPeelProps extends Omit<HTMLAttributes<HTMLDivElement>, "onDragStart" | "onDragEnd"> {
  imageSrc: string;
  width?: number;
  rotate?: number;
  peelDirection?: number;
  peelBackHoverPct?: number;
  peelBackActivePct?: number;
  curlRadius?: number;
  finish?: "gloss" | "matte" | "holo";
  backColor?: string;
  lightingIntensity?: number;
  shadowIntensity?: number;
  followPointer?: boolean;
  draggable?: boolean;
  swing?: number;
  friction?: number;
  bounce?: number;
  intro?: boolean;
  initialPosition?: "center" | { x: number; y: number };
  onDragStart?: () => void;
  onDragEnd?: () => void;
  dpr?: number;
  /** Extra px around the sticker that still catch hover and press. 0 = exact die-cut shape. */
  hitSlop?: number;
  /** Element the sticker sits on (centred) until it is first dragged. */
  anchor?: () => Element | null | undefined;
  className?: string;
  style?: CSSProperties;
}

declare function StickerPeel(props: StickerPeelProps): JSX.Element;
export default StickerPeel;
