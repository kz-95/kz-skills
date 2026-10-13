import React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { Frame } from "../Frame";
import { clamp, DARK, MONO, SANS, SOLID, tokens } from "../theme";

// Contrast, rule Y2, in the dark theme. Wrong: a card label keeps the light theme's ink
// (#1c1a18) on the dark card (#211e1b), so it all but disappears; contrast-check.js runs
// both themes through [data-theme] and reports it LOW in dark. Right: the label uses
// the muted token, which the dark theme redefines, and passes in both themes. The ratios
// shown are the check's own figures for the two sample pages.
// The whole frame turns dark over 0.5 s (no full-frame change faster than 0.4 s), and
// the next scene turns it light again over 0.5 s.

type Props = {
  readonly command: string;
  readonly finding: string;
  readonly clean: string;
};

const LABEL_WRONG = "#1c1a18";

const ContrastY2Inner: React.FC<Props> = ({ command, finding, clean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dark = interpolate(frame, [0, 0.5 * fps], [0, 1], clamp);
  const T = tokens(dark);
  const p = interpolate(frame, [3.6 * fps, 4.2 * fps], [0, 1], { ...clamp, easing: Easing.spring({ damping: 200 }) });
  const row = (theme: string, before: string, after: string, beforeOk: boolean) => (
    <div style={{ display: "flex", alignItems: "center", height: 56, borderTop: `1px solid ${T.line}` }}>
      <span style={{ width: 120, fontSize: 28, fontWeight: 600, color: T.muted }}>{theme}</span>
      <span style={{ position: "relative", width: 190, height: 40, fontFamily: MONO, fontSize: 30, fontWeight: 700, color: T.text }}>
        <span style={{ position: "absolute", left: 0, top: 0, opacity: 1 - p }}>{before}</span>
        <span style={{ position: "absolute", left: 0, top: 0, opacity: p }}>{after}</span>
      </span>
      <span style={{ position: "relative", width: 100, height: 40, fontSize: 28, fontWeight: 700 }}>
        <span style={{ position: "absolute", left: 0, top: 2, color: beforeOk ? T.green : T.magenta, opacity: 1 - p }}>
          {beforeOk ? "pass" : "fail"}
        </span>
        <span style={{ position: "absolute", left: 0, top: 2, color: T.green, opacity: p }}>pass</span>
      </span>
    </div>
  );

  return (
    <Frame
      category="Contrast"
      ruleId="Y2"
      ruleText="The pass mark is a number, in both themes."
      dark={dark}
      verdict={interpolate(frame, [4.0 * fps, 4.2 * fps], [0, 1], clamp)}
      chromeOpacity={1}
      contentOpacity={interpolate(frame, [0.2 * fps, 0.5 * fps, 5.7 * fps, 6 * fps], [0, 1, 1, 0], clamp)}
      command={command}
      typed={interpolate(frame, [0.8 * fps, 1.2 * fps], [0, command.length], clamp)}
      finding={finding}
      findingOpacity={interpolate(frame, [1.2 * fps, 1.3 * fps], [0, 1], clamp)}
      findingDim={interpolate(frame, [3.6 * fps, 3.9 * fps], [0, 1], clamp)}
      clean={clean}
      cleanOpacity={interpolate(frame, [4.0 * fps, 4.15 * fps], [0, 1], clamp)}
    >
      {/* The sample: a dark-theme card */}
      <Interactive.Div
        name="Sample card"
        style={{
          position: "absolute",
          left: 0,
          top: 20,
          width: 520,
          height: 300,
          boxSizing: "border-box",
          padding: "34px 40px",
          background: DARK.surface,
          border: `1.5px solid ${DARK.lineStrong}`,
          borderRadius: 16,
          fontFamily: SANS,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 600, color: DARK.text }}>Revenue</div>
        <div style={{ marginTop: 12, fontSize: 84, fontWeight: 700, letterSpacing: -2, color: DARK.text, lineHeight: "100px" }}>
          RM 2.4m
        </div>
        <div
          style={{
            marginTop: 18,
            display: "inline-block",
            fontSize: 30,
            fontWeight: 600,
            color: interpolateColors(p, [0, 1], [LABEL_WRONG, DARK.muted]),
          }}
        >
          Last 30 days
        </div>
      </Interactive.Div>

      {/* The finding on the element: outline round the label, and its tag */}
      <Interactive.Div
        name="Finding mark"
        style={{
          position: "absolute",
          left: 26,
          top: 20 + 34 + 36 + 12 + 100 + 18 - 12,
          width: 230,
          height: 60,
          boxSizing: "border-box",
          border: `3px solid ${T.magenta}`,
          borderRadius: 10,
          opacity: interpolate(frame, [1.2 * fps, 1.3 * fps, 3.4 * fps, 3.6 * fps], [0, 1, 1, 0], clamp),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 240,
            top: 12,
            height: 32,
            padding: "0 12px",
            borderRadius: 6,
            background: SOLID.magenta,
            color: "#ffffff",
            fontFamily: MONO,
            fontSize: 22,
            fontWeight: 700,
            lineHeight: "32px",
          }}
        >
          LOW
        </div>
      </Interactive.Div>

      {/* What the check measured for that label, in both themes */}
      <Interactive.Div
        name="Measured"
        style={{ position: "absolute", left: 600, top: 40, width: 480, fontFamily: SANS }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: T.text, marginBottom: 14 }}>
          Label contrast <span style={{ color: T.muted, fontWeight: 600 }}>(needs 4.5:1)</span>
        </div>
        {row("light", "17.35:1", "6.76:1", true)}
        {row("dark", "1.05:1", "7.84:1", false)}
      </Interactive.Div>
    </Frame>
  );
};

const schema = {
  command: { type: "string", default: "contrast-check.js", description: "Command typed in the console" },
  finding: { type: "string", default: "", description: "Finding line (real check output, cut at a word)" },
  clean: { type: "string", default: "", description: "Clean line (real check output)" },
} as const satisfies InteractivitySchema;

export const ContrastY2 = Interactive.withSchema({
  Component: ContrastY2Inner,
  componentName: "ContrastY2",
  schema,
  wrapInSequence: true,
  layout: "absolute-fill",
});
