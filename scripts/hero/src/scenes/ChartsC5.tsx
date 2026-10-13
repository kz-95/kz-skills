import React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig, type InteractivitySchema } from "remotion";
import { Frame } from "../Frame";
import { C, clamp, MONO, SANS, SOLID } from "../theme";

// Charts, rule C5: the highlight is drawn on the mark's own outline, never as a
// rectangle round its bounding box. Wrong: the focused wedge gets the browser's outline,
// which on an SVG shape is its bounding box; layout-audit.js reports FOCUS BOX. Right:
// the outline is removed and the ring is a stroke on the wedge itself, and the chart
// shows the focused wedge's values. The scene opens by turning the dark Contrast
// frame light again over 0.5 s.

type Props = {
  readonly command: string;
  readonly finding: string;
  readonly clean: string;
  readonly fromDark: boolean;
};

const CX = 210;
const CY = 174;
const R1 = 140;
const R0 = 70;
const WEDGES = [
  { name: "New build", value: "RM 1,240,000", share: 62.4, fill: SOLID.accent },
  { name: "Renovation", value: "RM 650,000", share: 32.7, fill: "#7aa0f0" },
  { name: "Fit-out", value: "RM 96,500", share: 4.9, fill: "#b9cdf7" },
] as const;
const FOCUS = 1;

const polar = (r: number, a: number) => [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
const arcs = (() => {
  let a = -Math.PI / 2;
  return WEDGES.map((w) => {
    const a0 = a;
    const a1 = a + (w.share / 100) * Math.PI * 2;
    a = a1;
    const big = a1 - a0 > Math.PI ? 1 : 0;
    const [x0, y0] = polar(R1, a0);
    const [x1, y1] = polar(R1, a1);
    const [x2, y2] = polar(R0, a1);
    const [x3, y3] = polar(R0, a0);
    const d = `M${x0} ${y0} A${R1} ${R1} 0 ${big} 1 ${x1} ${y1} L${x2} ${y2} A${R0} ${R0} 0 ${big} 0 ${x3} ${y3} Z`;
    // bounding box, sampled along both arcs
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i <= 64; i++) {
      const t = a0 + ((a1 - a0) * i) / 64;
      [R0, R1].forEach((r) => {
        const [x, y] = polar(r, t);
        xs.push(x);
        ys.push(y);
      });
    }
    return { d, box: { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) } };
  });
})();

const ChartsC5Inner: React.FC<Props> = ({ command, finding, clean, fromDark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [3.6 * fps, 4.2 * fps], [0, 1], { ...clamp, easing: Easing.spring({ damping: 200 }) });
  const b = arcs[FOCUS].box;
  return (
    <Frame
      category="Charts"
      ruleId="C5"
      ruleText="A focus ring follows the mark, never a box round it."
      dark={fromDark ? interpolate(frame, [0, 0.5 * fps], [1, 0], clamp) : 0}
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
      <Interactive.Div
        name="Sample chart"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1104,
          height: 348,
          boxSizing: "border-box",
          background: C.surface,
          border: `1.5px solid ${C.line}`,
          borderRadius: 12,
        }}
      >
        <svg width={1104} height={348} viewBox="0 0 1104 348" style={{ position: "absolute", left: -1.5, top: -1.5 }}>
          {arcs.map((a, i) => (
            <path key={WEDGES[i].name} d={a.d} fill={WEDGES[i].fill} stroke={C.surface} strokeWidth={2} />
          ))}
          {/* right: the ring is the wedge's own outline */}
          <path d={arcs[FOCUS].d} fill="none" stroke={C.text} strokeWidth={4} strokeLinejoin="round" opacity={p} />
          {/* wrong: the browser's outline, the bounding box */}
          <rect
            x={b.x - 3}
            y={b.y - 3}
            width={b.w + 6}
            height={b.h + 6}
            fill="none"
            stroke={C.text}
            strokeWidth={3}
            opacity={1 - p}
          />
        </svg>
        {/* legend */}
        <div style={{ position: "absolute", left: 470, top: 34, fontFamily: SANS }}>
          {WEDGES.map((w, i) => (
            <div key={w.name} style={{ display: "flex", alignItems: "center", height: 44, fontSize: 24, color: C.text, fontWeight: i === FOCUS ? 700 : 400 }}>
              <span style={{ width: 20, height: 20, borderRadius: 4, background: w.fill, marginRight: 14 }} />
              <span style={{ width: 170 }}>{w.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 22, color: C.muted }}>{w.share.toFixed(1)}%</span>
            </div>
          ))}
        </div>
        {/* right: the focused wedge reports its values */}
        <div
          style={{
            position: "absolute",
            left: 470,
            top: 200,
            width: 560,
            boxSizing: "border-box",
            padding: "16px 22px",
            borderRadius: 12,
            border: `1.5px solid ${C.lineStrong}`,
            background: C.bg,
            fontFamily: SANS,
            opacity: interpolate(frame, [3.7 * fps, 3.9 * fps], [0, 1], clamp),
            translate: `0px ${interpolate(frame, [3.7 * fps, 3.9 * fps], [8, 0], { ...clamp, easing: Easing.spring({ damping: 200 }) })}px`,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{WEDGES[FOCUS].name}</div>
          <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 26, fontWeight: 700, color: C.text }}>
            {WEDGES[FOCUS].value} <span style={{ color: C.muted, fontWeight: 400 }}>{WEDGES[FOCUS].share}%</span>
          </div>
        </div>
      </Interactive.Div>

      {/* the finding: the tag on the box ring */}
      <Interactive.Div
        name="Finding mark"
        style={{
          position: "absolute",
          left: b.x + b.w - 40,
          top: b.y - 22,
          height: 32,
          padding: "0 12px",
          borderRadius: 6,
          background: SOLID.magenta,
          color: "#ffffff",
          fontFamily: MONO,
          fontSize: 22,
          fontWeight: 700,
          lineHeight: "32px",
          whiteSpace: "nowrap",
          opacity: interpolate(frame, [1.2 * fps, 1.3 * fps, 3.4 * fps, 3.6 * fps], [0, 1, 1, 0], clamp),
        }}
      >
        FOCUS BOX
      </Interactive.Div>
    </Frame>
  );
};

const schema = {
  command: { type: "string", default: "layout-audit.js", description: "Command typed in the console" },
  finding: { type: "string", default: "", description: "Finding line (real check output, cut at a word)" },
  clean: { type: "string", default: "clean", description: "Clean line (real check output)" },
  fromDark: { type: "boolean", default: true, description: "Turn the dark frame light first", keyframable: false },
} as const satisfies InteractivitySchema;

export const ChartsC5 = Interactive.withSchema({
  Component: ChartsC5Inner,
  componentName: "ChartsC5",
  schema,
  wrapInSequence: true,
  layout: "absolute-fill",
});
