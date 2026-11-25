import React, { useLayoutEffect, useRef, useState } from "react";
import { continueRender, delayRender } from "remotion";

// Envelope type: the word is drawn flat, then copied one pixel column at a time into a
// shape given by its top and bottom edge, each a fraction of the height, as a function of
// u (0 at the left edge, 1 at the right). Tilting the word in 3D reads as italics, and
// scaling letter by letter breaks the spacing; a column warp is what the poster
// technique (trapezoid, perspective rectangle, butterfly, funnel) actually is.

export type Shape = "trapezoid" | "perspective" | "butterfly" | "funnel";

type Edge = (u: number) => number;
const mid = (u: number) => Math.abs(u - 0.5) * 2; // 1 at the ends, 0 in the middle

export const SHAPES: Record<Shape, { top: Edge; bottom: Edge }> = {
  // grows from left to right
  trapezoid: { top: (u) => 0.34 * (1 - u), bottom: (u) => 0.66 + 0.34 * u },
  // a plane running away to the right: the far edge shrinks from the bottom
  perspective: { top: (u) => 0.06 * u, bottom: (u) => 1 - 0.4 * u },
  // tall at both ends, thin in the middle
  butterfly: { top: (u) => 0.3 * (1 - mid(u)), bottom: (u) => 1 - 0.3 * (1 - mid(u)) },
  // pinched hard to the centre
  funnel: { top: (u) => 0.36 * (1 - mid(u)) ** 2, bottom: (u) => 1 - 0.36 * (1 - mid(u)) ** 2 },
};

type Props = {
  readonly text: string;
  readonly shape: Shape;
  readonly width: number;
  readonly height: number;
  readonly ink: string;
  readonly accent: string;
  // characters drawn in the accent colour (by index)
  readonly accentAt?: (i: number, ch: string) => boolean;
  readonly label: string; // the words, for anyone who cannot see the picture
};

const FONT = "900 200px Inter";

export const Warp: React.FC<Props> = ({ text, shape, width, height, ink, accent, accentAt, label }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => delayRender("warp: font and draw"));

  useLayoutEffect(() => {
    let done = false;
    document.fonts.load(FONT).then(() => {
      if (done || !ref.current) return;
      const flat = document.createElement("canvas");
      const g = flat.getContext("2d")!;
      g.font = FONT;
      const tw = Math.ceil(g.measureText(text).width);
      flat.width = tw;
      flat.height = 200;
      g.font = FONT;
      let x = 0;
      for (let i = 0; i < text.length; i++) {
        g.fillStyle = accentAt?.(i, text[i]) ? accent : ink;
        g.fillText(text[i], x, 170);
        x += g.measureText(text[i]).width;
      }
      // drawn at 2x and shown at 1x, so the edges stay sharp when the image is scaled down
      const c = ref.current;
      c.width = width * 2;
      c.height = height * 2;
      const o = c.getContext("2d")!;
      o.imageSmoothingQuality = "high";
      const { top, bottom } = SHAPES[shape];
      const cols = width * 2;
      for (let px = 0; px < cols; px++) {
        const u = px / cols;
        const t = top(u) * height * 2;
        const b = bottom(u) * height * 2;
        // the source glyph box is rows 18..178 of the flat canvas (cap height to descender)
        o.drawImage(flat, u * tw, 18, tw / cols + 0.5, 160, px, t, 1.2, b - t);
      }
      continueRender(handle);
    });
    return () => {
      done = true;
    };
  }, [text, shape, width, height, ink, accent, accentAt, handle]);

  return <canvas ref={ref} role="img" aria-label={label} style={{ width, height, display: "block" }} />;
};
