import { loadFont } from "@remotion/fonts";
import { interpolateColors, staticFile } from "remotion";

// Fonts are bundled in public/ (OFL, licence files beside them), so a render never
// depends on what is installed. loadFont holds the render until each face is ready.
loadFont({ family: "Inter", url: staticFile("inter-latin-400-normal.woff2"), weight: "400" });
loadFont({ family: "Inter", url: staticFile("inter-latin-600-normal.woff2"), weight: "600" });
loadFont({ family: "Inter", url: staticFile("inter-latin-700-normal.woff2"), weight: "700" });
loadFont({ family: "JetBrains Mono", url: staticFile("jetbrains-mono-latin-400-normal.woff2"), weight: "400" });
loadFont({ family: "JetBrains Mono", url: staticFile("jetbrains-mono-latin-700-normal.woff2"), weight: "700" });

export const SANS = "Inter, sans-serif";
export const MONO = "'JetBrains Mono', monospace";

// Light theme tokens. Every text colour is at least 4.5:1 on the surface it sits on.
export const C = {
  bg: "#fbfaf9",
  surface: "#ffffff",
  line: "#e3dfdb",
  lineStrong: "#cfc9c3",
  text: "#1c1a18",
  muted: "#625a53",
  accent: "#2f5bd3",
  magenta: "#c2185b",
  wrong: "#b42318",
  green: "#1f7a4d",
  wash: "#eef2fc",
};

// Dark theme, for the Contrast scene. Same keys, same 4.5:1 floor.
export const DARK: typeof C = {
  bg: "#141210",
  surface: "#211e1b",
  line: "#3a3632",
  lineStrong: "#4d4843",
  text: "#f2efeb",
  muted: "#b9b1a9",
  accent: "#8fb0ff",
  magenta: "#ff7aa8",
  wrong: "#b42318",
  green: "#5fd39a",
  wash: "#1f2a44",
};

// The tokens at a point between light (0) and dark (1).
export const tokens = (d: number): typeof C => {
  if (d <= 0) {
    return C;
  }
  if (d >= 1) {
    return DARK;
  }
  const out = { ...C };
  (Object.keys(C) as (keyof typeof C)[]).forEach((k) => {
    out[k] = interpolateColors(d, [0, 1], [C[k], DARK[k]]);
  });
  return out;
};

// Solid fills that keep white text at 4.5:1 or more in both themes.
export const SOLID = { accent: "#2f5bd3", wrong: "#b42318", right: "#1f7a4d", magenta: "#c2185b" };

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Layout of the 1200x675 canvas (PLAN.md, "Layout").
export const L = {
  w: 1200,
  h: 675,
  margin: 48,
  topBar: { y: 24, h: 68 },
  stage: { y: 104, h: 348 },
  console: { y: 464, h: 144 },
  footer: { y: 620, h: 31 },
};

export const CATEGORIES = ["Tables", "Contrast", "Charts", "Diagrams"] as const;
export type Category = (typeof CATEGORIES)[number];
