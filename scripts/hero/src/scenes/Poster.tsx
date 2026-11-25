import React from "react";
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame, useVideoConfig, type InteractivitySchema } from "remotion";
import { Warp } from "../parts/Warp";
import { C, CATEGORIES, clamp, SANS } from "../theme";

// Frame 0 of the GIF and the loop seam. It is fully drawn on its first frame, because
// GitHub shows frame 0, paused, to anyone whose system asks for reduced motion.
// Held 4 s (PLAN.md, "Reading time"), then fades to the background over 0.45 s: the blue
// headline panel is a third of the frame, and PLAN.md allows no luminance change that big faster than 0.4 s. The
// Close scene dissolves back into the same card, so the loop joins on the poster.

type Props = {
  readonly headline: string;
  readonly line: string;
};

const Arrow: React.FC = () => (
  <svg width={30} height={18} viewBox="0 0 30 18" style={{ margin: "0 14px" }}>
    <path d="M2 9 H26 M19 3 L26 9 L19 15" fill="none" stroke={C.muted} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PosterCard: React.FC<Props & { readonly opacity: number }> = ({ headline, line, opacity }) => (
  <AbsoluteFill style={{ background: C.bg, fontFamily: SANS, alignItems: "center", justifyContent: "center" }}>
    <Interactive.Div
      name="Poster text"
      style={{
        width: 1104,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        opacity,
      }}
    >
      {/* the name as a perspective-rectangle poster headline: a plane running away to the right */}
      <div style={{ width: 1104, height: 232, borderRadius: 24, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Warp
          text={headline}
          shape="perspective"
          width={940}
          height={190}
          ink="#ffffff"
          accent="#c8ff2e"
          accentAt={(_, ch) => ch === "-"}
          label={headline}
        />
      </div>
      <div
        style={{
          marginTop: 28,
          maxWidth: 1000,
          fontSize: 44,
          fontWeight: 600,
          lineHeight: "56px",
          letterSpacing: -0.4,
          color: C.text,
        }}
      >
        {line}
      </div>
      <div style={{ marginTop: 36, display: "flex", gap: 16 }}>
        {CATEGORIES.map((c) => (
          <div
            key={c}
            style={{
              height: 52,
              boxSizing: "border-box",
              padding: "0 24px",
              borderRadius: 26,
              display: "flex",
              alignItems: "center",
              fontSize: 30,
              fontWeight: 600,
              color: C.text,
              background: C.surface,
              border: `1.5px solid ${C.lineStrong}`,
            }}
          >
            {c}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 34, display: "flex", alignItems: "center", fontSize: 30, fontWeight: 600, color: C.muted }}>
        Rule
        <Arrow />
        what breaks
        <Arrow />
        a check that proves it
      </div>
    </Interactive.Div>
  </AbsoluteFill>
);

const PosterInner: React.FC<Props> = ({ headline, line }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <PosterCard headline={headline} line={line} opacity={interpolate(frame, [3.55 * fps, 4 * fps], [1, 0], clamp)} />;
};

const schema = {
  headline: { type: "string", default: "kz-skills", description: "Headline" },
  line: { type: "string", default: "", description: "Supporting line" },
} as const satisfies InteractivitySchema;

export const Poster = Interactive.withSchema({
  Component: PosterInner,
  componentName: "Poster",
  schema,
  wrapInSequence: true,
  layout: "absolute-fill",
});
