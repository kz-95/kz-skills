import React from "react";
import { AbsoluteFill } from "remotion";
import { Shape, Warp } from "./parts/Warp";

// README section banners: one warped word on a transparent background, rendered as a
// still in a light and a dark version so a <picture> can follow GitHub's theme. The
// Markdown heading under each banner stays, so links and anchors keep working and a
// screen reader still gets the section's real name.

export type BannerProps = {
  readonly text: string;
  readonly shape: Shape;
  readonly theme: "light" | "dark";
  readonly accentFrom: number; // characters from this index on are in the accent colour; -1 for none
  readonly label: string;
};

export const BANNER = { width: 1280, height: 240 };

const INK = { light: "#1c1a18", dark: "#f2efeb" };
const ACCENT = { light: "#2f5bd3", dark: "#8fb0ff" };

export const Banner: React.FC<BannerProps> = ({ text, shape, theme, accentFrom, label }) => (
  <AbsoluteFill style={{ background: "transparent", alignItems: "center", justifyContent: "center" }}>
    <Warp
      text={text}
      shape={shape}
      width={1180}
      height={200}
      ink={INK[theme]}
      accent={ACCENT[theme]}
      accentAt={(i, ch) => ch === "/" || (accentFrom >= 0 && i >= accentFrom)}
      label={label}
    />
  </AbsoluteFill>
);
