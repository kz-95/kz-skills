import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig, type InteractivitySchema } from "remotion";
import { Frame } from "../Frame";
import { Arrow, toPath } from "../parts/G6Parts";
import { C, clamp, MONO, SANS, SOLID } from "../theme";

// Diagrams, rule G6: a label sits beside its line, clear of it. Wrong: the "WRITE"
// plate sits on the Checkout -> Orders DB line and hides it; diagram-check.js reports
// LABEL ON LINE. Right: the plate moves above the line with a 6px gap (in the diagram's
// own units), and the check is clean. The drawing is the sample page's SVG at 2x: same
// viewBox (552 x 174), same boxes, lines and plate.

type Props = {
  readonly command: string;
  readonly finding: string;
  readonly clean: string;
  readonly chromeOut: boolean;
};

const LINE_Y = 108;
const BOXES = [
  { x: 20, w: 100, label: "Cart" },
  { x: 200, w: 120, label: "Checkout" },
  { x: 432, w: 100, label: "Orders DB" },
] as const;

const DiagramsG6Inner: React.FC<Props> = ({ command, finding, clean, chromeOut }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [3.6 * fps, 4.2 * fps], [0, 1], { ...clamp, easing: Easing.spring({ damping: 200 }) });
  const plateY = interpolate(p, [0, 1], [101, 87]);
  const mark = interpolate(frame, [1.2 * fps, 1.3 * fps, 3.4 * fps, 3.6 * fps], [0, 1, 1, 0], clamp);
  return (
    <Frame
      category="Diagrams"
      ruleId="G6"
      ruleText="A label sits beside its line, clear of it."
      verdict={interpolate(frame, [4.0 * fps, 4.2 * fps], [0, 1], clamp)}
      chromeOpacity={interpolate(frame, [5.7 * fps, 6 * fps], [1, chromeOut ? 0 : 1], clamp)}
      contentOpacity={interpolate(frame, [0, 0.4 * fps, 5.7 * fps, 6 * fps], [0, 1, 1, 0], clamp)}
      command={command}
      typed={interpolate(frame, [0.8 * fps, 1.2 * fps], [0, command.length], clamp)}
      finding={finding}
      findingOpacity={interpolate(frame, [1.2 * fps, 1.3 * fps], [0, 1], clamp)}
      findingDim={interpolate(frame, [3.6 * fps, 3.9 * fps], [0, 1], clamp)}
      clean={clean}
      cleanOpacity={interpolate(frame, [4.0 * fps, 4.15 * fps], [0, 1], clamp)}
    >
      <Interactive.Div
        name="Sample diagram"
        style={{ position: "absolute", left: 0, top: 0, width: 1104, height: 348 }}
      >
        <svg width={1104} height={348} viewBox="0 0 552 174">
          <path d={toPath([[120, LINE_Y], [196, LINE_Y]])} stroke={C.muted} strokeWidth={1.5} fill="none" />
          <Arrow pts={[[120, LINE_Y], [200, LINE_Y]]} />
          <path d={toPath([[320, LINE_Y], [428, LINE_Y]])} stroke={C.muted} strokeWidth={1.5} fill="none" />
          <Arrow pts={[[320, LINE_Y], [432, LINE_Y]]} />
          {BOXES.map((b) => (
            <g key={b.label}>
              <rect x={b.x} y={78} width={b.w} height={60} rx={6} fill={C.surface} stroke={C.text} strokeWidth={1} />
              <text x={b.x + b.w / 2} y={113} textAnchor="middle" fontFamily={SANS} fontSize={13} fontWeight={600} fill={C.text}>
                {b.label}
              </text>
            </g>
          ))}
          <rect x={348} y={plateY} width={56} height={14} rx={2} fill={C.bg} />
          <text x={376} y={plateY + 11} textAnchor="middle" fontFamily={SANS} fontSize={11} fontWeight={700} letterSpacing={0.5} fill={C.muted}>
            WRITE
          </text>
          {/* the finding on the element */}
          <g opacity={mark}>
            <rect x={343} y={96} width={66} height={24} rx={4} fill="none" stroke={SOLID.magenta} strokeWidth={1.5} />
            <rect x={319} y={126} width={114} height={16} rx={3} fill={SOLID.magenta} />
            <text x={376} y={138} textAnchor="middle" fontFamily={MONO} fontSize={11} fontWeight={700} fill="#ffffff">
              LABEL ON LINE
            </text>
          </g>
        </svg>
      </Interactive.Div>
    </Frame>
  );
};

const schema = {
  command: { type: "string", default: "diagram-check.js", description: "Command typed in the console" },
  finding: { type: "string", default: "", description: "Finding line (real check output, cut at a word)" },
  clean: { type: "string", default: "", description: "Clean line (real check output)" },
  chromeOut: { type: "boolean", default: true, description: "Fade the frame out at the end (before the close)", keyframable: false },
} as const satisfies InteractivitySchema;

export const DiagramsG6 = Interactive.withSchema({
  Component: DiagramsG6Inner,
  componentName: "DiagramsG6",
  schema,
  wrapInSequence: true,
  layout: "absolute-fill",
});
