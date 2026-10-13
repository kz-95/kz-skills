// Kept from the first hero (a diagram drawn wrong, then fixed) for the G6 scene, which
// cuts the diagram down to the single label-on-line fault. Not rendered yet.
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

// Tokens from the reference page (light theme).
export const C = {
  bg: "#fbfaf9",
  surface: "#ffffff",
  line: "#e3dfdb",
  text: "#1c1a18",
  muted: "#6b635c",
  accent: "#3a6cf1",
  magenta: "#c0177a",
  green: "#1d7a46",
};

const SANS = "Inter, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'DejaVu Sans Mono', 'Liberation Mono', Menlo, monospace";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export type Pt = readonly [number, number];

export const mix = (a: readonly Pt[], b: readonly Pt[], t: number): Pt[] =>
  a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t]);

const f = (n: number) => n.toFixed(1);

// A polyline with each bend drawn as a rounded corner of radius r (rule G3).
export const toPath = (pts: readonly Pt[], r = 0) => {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const [nx, ny] = pts[i + 1];
    const lin = Math.hypot(cx - px, cy - py);
    const lout = Math.hypot(nx - cx, ny - cy);
    const k = Math.min(r, lin / 2, lout / 2);
    if (k < 0.5) {
      d += ` L${f(cx)} ${f(cy)}`;
      continue;
    }
    const ax = cx - ((cx - px) / lin) * k;
    const ay = cy - ((cy - py) / lin) * k;
    const bx = cx + ((nx - cx) / lout) * k;
    const by = cy + ((ny - cy) / lout) * k;
    d += ` L${f(ax)} ${f(ay)} Q${f(cx)} ${f(cy)} ${f(bx)} ${f(by)}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${f(last[0])} ${f(last[1])}`;
};

// Arrowhead at the last point, pointing along the last non-zero segment.
export const Arrow: React.FC<{ pts: readonly Pt[] }> = ({ pts }) => {
  const end = pts[pts.length - 1];
  let from = pts[pts.length - 2];
  for (let i = pts.length - 2; i >= 0; i--) {
    if (Math.hypot(pts[i][0] - end[0], pts[i][1] - end[1]) > 0.5) {
      from = pts[i];
      break;
    }
  }
  const a = Math.atan2(end[1] - from[1], end[0] - from[0]);
  const s = 11;
  const p1: Pt = [end[0] - s * Math.cos(a - 0.45), end[1] - s * Math.sin(a - 0.45)];
  const p2: Pt = [end[0] - s * Math.cos(a + 0.45), end[1] - s * Math.sin(a + 0.45)];
  return <polygon points={`${end[0]},${end[1]} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`} fill={C.muted} />;
};

export const Box: React.FC<{ x: number; y: number; label: string }> = ({ x, y, label }) => (
  <g>
    <rect x={x} y={y} width={180} height={64} rx={10} fill={C.surface} stroke={C.text} strokeWidth={1.6} />
    <text x={x + 90} y={y + 40} textAnchor="middle" fontFamily={SANS} fontSize={23} fontWeight={600} fill={C.text}>
      {label}
    </text>
  </g>
);

export const Plate: React.FC<{ cx: number; cy: number; text: string; w: number; opacity?: number }> = ({ cx, cy, text, w, opacity = 1 }) => (
  <g opacity={opacity}>
    <rect x={cx - w / 2} y={cy - 13} width={w} height={26} rx={4} fill={C.bg} />
    <text
      x={cx}
      y={cy + 6}
      textAnchor="middle"
      fontFamily={SANS}
      fontSize={16}
      fontWeight={600}
      letterSpacing={1.2}
      fill={C.muted}
    >
      {text}
    </text>
  </g>
);

export const Tag: React.FC<{ x: number; y: number; text: string; opacity: number }> = ({ x, y, text, opacity }) => {
  const w = text.length * 10.2 + 18;
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - 14} width={w} height={28} rx={6} fill={C.magenta} />
      <text x={x} y={y + 6} textAnchor="middle" fontFamily={MONO} fontSize={16} fontWeight={700} fill="#ffffff">
        {text}
      </text>
    </g>
  );
};

// Frame marks for the story (30fps).
export const T = {
  consoleIn: 36,
  typeStart: 50,
  typeEnd: 82,
  find: [94, 114, 134] as const,
  fixStart: 168,
  fixEnd: 204,
  clean: 212,
};

export const Diagram: React.FC = () => {
  const frame = useCurrentFrame();
  const fix = interpolate(frame, [T.fixStart, T.fixEnd], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const findOn = (i: number) =>
    interpolate(frame, [T.find[i], T.find[i] + 8], [0, 1], clamp) *
    interpolate(frame, [T.fixStart - 10, T.fixStart], [1, 0], clamp);

  // Client -> API, label sits on the line (wrong) then 22px above it (right).
  const reqY = interpolate(fix, [0, 1], [152, 130]);
  // API -> Database: one slanted run (wrong), then out, down, in (right).
  const l2 = mix(
    [[690, 152], [690, 152], [920, 282], [920, 282]],
    [[690, 152], [805, 152], [805, 282], [920, 282]],
    fix,
  );
  // Client -> Database: straight through Cache (wrong), then routed under it (right).
  const l3 = mix(
    [[190, 184], [190, 302], [920, 302], [920, 302]],
    [[190, 184], [190, 384], [1010, 384], [1010, 314]],
    fix,
  );
  const auditY = interpolate(fix, [0, 1], [282, 362]);
  const auditX = interpolate(fix, [0, 1], [330, 600]);

  return (
    <svg width={1200} height={420} viewBox="0 0 1200 420" style={{ position: "absolute", top: 0, left: 0 }}>
      {/* lines first, so a box drawn later hides any line that runs behind it */}
      <line x1={280} y1={152} x2={500} y2={152} stroke={C.muted} strokeWidth={2} />
      <Arrow pts={[[280, 152], [510, 152]]} />
      <path d={toPath(l2, 14 * fix)} fill="none" stroke={C.muted} strokeWidth={2} strokeLinejoin="round" />
      <Arrow pts={l2} />
      <path d={toPath(l3, 14 * fix)} fill="none" stroke={C.muted} strokeWidth={2} strokeLinejoin="round" />
      <Arrow pts={l3} />
      <line x1={600} y1={184} x2={600} y2={262} stroke={C.muted} strokeWidth={2} />
      <Arrow pts={[[600, 184], [600, 270]]} />

      <Box x={100} y={120} label="Client" />
      <Box x={510} y={120} label="API" />
      <Box x={920} y={250} label="Database" />
      <Box x={510} y={270} label="Cache" />

      <Plate cx={395} cy={reqY} text="REQUEST" w={100} />
      <Plate cx={auditX} cy={auditY} text="AUDIT LOG" w={112} opacity={interpolate(fix, [0, 0.2, 0.8, 1], [1, 0, 0, 1])} />

      {/* findings: magenta marks on the offending parts */}
      <g opacity={findOn(0)}>
        <line x1={690} y1={152} x2={920} y2={282} stroke={C.magenta} strokeWidth={10} strokeOpacity={0.28} strokeLinecap="round" />
        <Tag x={872} y={190} text="DIAGONAL" opacity={1} />
      </g>
      <g opacity={findOn(1)}>
        <rect x={339} y={135} width={112} height={34} rx={6} fill="none" stroke={C.magenta} strokeWidth={2.5} />
        <Tag x={395} y={102} text="LABEL ON LINE" opacity={1} />
      </g>
      <g opacity={findOn(2)}>
        <line x1={510} y1={302} x2={690} y2={302} stroke={C.magenta} strokeWidth={2.5} strokeDasharray="7 6" />
        <rect x={502} y={262} width={196} height={80} rx={14} fill="none" stroke={C.magenta} strokeWidth={2.5} />
        <Tag x={600} y={370} text="BEHIND BOX" opacity={1} />
      </g>
    </svg>
  );
};
