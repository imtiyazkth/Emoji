export const CANVAS_SIZE = 512;

export type LayerKind = "text" | "emoji" | "art";
export type TextAlign = "left" | "center" | "right";

/**
 * One item on the sticker canvas. All three kinds share the same
 * properties so every control (size, colour, outline, shadow, ...) works
 * on text, emoji and emoji-art alike.
 */
export interface Layer {
  id: string;
  kind: LayerKind;
  content: string;
  /** Centre of the layer, in canvas pixels (0..512). */
  x: number;
  y: number;
  fontSize: number;
  rotation: number;
  color: string;
  fontId: string;
  bold: boolean;
  italic: boolean;
  align: TextAlign;
  outlineColor: string;
  outlineWidth: number;
  shadow: boolean;
  /** Always a #rrggbb hex string (so <input type="color"> can edit it). */
  shadowColor: string;
  shadowBlur: number;
  shadowOffset: number;
  /** Solid "pill" behind the text; null = none. */
  bgColor: string | null;
  opacity: number;
  flipX: boolean;
  visible: boolean;
}

export interface StickerDoc {
  layers: Layer[];
  bgTransparent: boolean;
  bgColor: string;
}
