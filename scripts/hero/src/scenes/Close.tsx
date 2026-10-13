import React from "react";
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame, useVideoConfig, type InteractivitySchema } from "remotion";
import { C, clamp, MONO, SANS } from "../theme";
import { PosterCard } from "./Poster";

// The closing card, then a dissolve into the poster, so the loop seam is the poster hold.
// 3.5 s: the card fades in from the background (0-0.3 s), holds to 2.7 s, and the
// poster takes its place by 3.0 s and holds to the end (it is frame 0 again).

type Props = {
  readonly headline: string;
  readonly install: string;
  readonly posterHeadline: string;
  readonly posterLine: string;
};

const CloseInner: React.FC<Props> = ({ headline, install, posterHeadline, posterLine }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: SANS }}>
      <PosterCard
        headline={posterHeadline}
        line={posterLine}
        opacity={interpolate(frame, [2.7 * fps, 3.0 * fps], [0, 1], clamp)}
      />
      <Interactive.Div
        name="Close text"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: interpolate(frame, [0, 0.3 * fps, 2.7 * fps, 3.0 * fps], [0, 1, 1, 0], clamp),
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1, color: C.text, lineHeight: "76px" }}>{headline}</div>
        <div
          style={{
            marginTop: 40,
            padding: "14px 32px",
            borderRadius: 14,
            background: C.surface,
            border: `1.5px solid ${C.lineStrong}`,
            fontFamily: MONO,
            fontSize: 44,
            fontWeight: 700,
            color: C.accent,
          }}
        >
          {install}
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};

const schema = {
  headline: { type: "string", default: "94 rules. 10 checks. Any stack.", description: "Closing line" },
  install: { type: "string", default: "npx skills add kz-95/kz-skills", description: "Install command" },
  posterHeadline: { type: "string", default: "kz-skills", description: "Poster headline" },
  posterLine: { type: "string", default: "", description: "Poster supporting line" },
} as const satisfies InteractivitySchema;

export const Close = Interactive.withSchema({
  Component: CloseInner,
  componentName: "Close",
  schema,
  wrapInSequence: true,
  layout: "absolute-fill",
});
