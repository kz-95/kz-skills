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
import { C, clamp, MONO, SANS } from "../theme";

// Tables, rule T1: a column filter is a panel, not a single input.
// Wrong: a bare text box under every header. table-check.js names it (BOX). Right: a
// filter button per column, a search box and a live count, and one open panel (sort,
// value list with counts, applied live, no OK or Cancel). The console strings are the
// check's real output on the two sample pages (see README.md, "Console strings").

type Props = {
  readonly command: string;
  readonly finding: string;
  readonly clean: string;
  readonly chromeIn: boolean;
  readonly chromeOut: boolean;
};

// Table geometry inside the stage (1104 x 348).
const COLS = [
  { title: "Site", x: 24, w: 440 },
  { title: "Type", x: 464, w: 330 },
  { title: "Value", x: 794, w: 286 },
] as const;
const ROWS = [
  { site: "Taman Sri Indah P2", type: "Renovation", value: "RM 412,000", keep: true },
  { site: "Bandar Baru Lot 14", type: "Fit-out", value: "RM 96,500", keep: false },
  { site: "Seri Kembangan D3", type: "New build", value: "RM 1,240,000", keep: false },
  { site: "Jalan Ampang 9", type: "Renovation", value: "RM 238,000", keep: true },
] as const;
const PAD = 14;
const TOOLBAR = 58;
const HEAD = 46;
const FILTER = 52;
const ROW = 46;
const CELL: React.CSSProperties = { fontFamily: SANS, fontSize: 22, lineHeight: "26px", color: C.text };

const SortIcon: React.FC<{ active: number }> = ({ active }) => (
  <svg width={14} height={20} viewBox="0 0 14 20" style={{ marginLeft: 10 }}>
    <path d="M7 2 L12 8 H2 Z" fill={interpolateColors(active, [0, 1], [C.lineStrong, C.lineStrong])} />
    <path d="M7 18 L12 12 H2 Z" fill={interpolateColors(active, [0, 1], [C.lineStrong, C.accent])} />
  </svg>
);

const Chevron: React.FC<{ color: string }> = ({ color }) => (
  <svg width={14} height={10} viewBox="0 0 14 10">
    <path d="M2 2 L7 7 L12 2" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Check: React.FC<{ on: boolean }> = ({ on }) => (
  <svg width={22} height={22} viewBox="0 0 22 22">
    <rect x={1} y={1} width={20} height={20} rx={5} fill={on ? C.accent : C.surface} stroke={on ? C.accent : C.lineStrong} strokeWidth={1.5} />
    {on ? <path d="M6 11 L9.5 14.5 L16 7.5" fill="none" stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /> : null}
  </svg>
);

const TablesT1Inner: React.FC<Props> = ({ command, finding, clean, chromeIn, chromeOut }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The fix: one spring (damping 200, no overshoot) from 3.6 s to 4.2 s.
  const p = interpolate(frame, [3.6 * fps, 4.2 * fps], [0, 1], { ...clamp, easing: Easing.spring({ damping: 200 }) });
  const tb = TOOLBAR * p;
  const headY = PAD + tb;
  const filterY = headY + HEAD;
  const bodyY = filterY + FILTER;
  let y = bodyY;
  const rows = ROWS.map((r) => {
    const h = r.keep ? ROW : ROW * (1 - p);
    const out = { ...r, y, h };
    y += h;
    return out;
  });
  const cardH = y - 0 + 10;

  return (
    <Frame
      category="Tables"
      ruleId="T1"
      ruleText="A column filter is a panel, not a single input."
      verdict={interpolate(frame, [4.0 * fps, 4.2 * fps], [0, 1], clamp)}
      chromeOpacity={interpolate(
        frame,
        [0, 0.4 * fps, 5.7 * fps, 6 * fps],
        [chromeIn ? 0 : 1, 1, 1, chromeOut ? 0 : 1],
        clamp,
      )}
      contentOpacity={interpolate(frame, [0, 0.4 * fps, 5.7 * fps, 6 * fps], [0, 1, 1, 0], clamp)}
      command={command}
      typed={interpolate(frame, [0.8 * fps, 1.2 * fps], [0, command.length], clamp)}
      finding={finding}
      findingOpacity={interpolate(frame, [1.2 * fps, 1.3 * fps], [0, 1], clamp)}
      findingDim={interpolate(frame, [3.6 * fps, 3.9 * fps], [0, 1], clamp)}
      clean={clean}
      cleanOpacity={interpolate(frame, [4.0 * fps, 4.15 * fps], [0, 1], clamp)}
    >
      {/* The sample table, drawn as vector UI */}
      <Interactive.Div
        name="Sample table"
        style={{
          position: "absolute",
          left: 0,
          top: 4,
          width: 1104,
          height: cardH,
          boxSizing: "border-box",
          background: C.surface,
          border: `1.5px solid ${C.line}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Toolbar (right only): search box and live count */}
        <div style={{ position: "absolute", left: 24, top: PAD, height: tb, width: 600, overflow: "hidden", opacity: p }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 2,
              width: 340,
              height: 42,
              boxSizing: "border-box",
              border: `1.5px solid ${C.lineStrong}`,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 12px",
            }}
          >
            <svg width={18} height={18} viewBox="0 0 18 18">
              <circle cx={7.5} cy={7.5} r={5.5} fill="none" stroke={C.muted} strokeWidth={2} />
              <path d="M11.5 11.5 L16 16" stroke={C.muted} strokeWidth={2} strokeLinecap="round" />
            </svg>
            <span style={{ ...CELL, color: C.muted }}>Search sites...</span>
          </div>
          <div
            style={{
              position: "absolute",
              left: 360,
              top: 2,
              height: 42,
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              borderRadius: 21,
              background: C.wash,
              ...CELL,
              fontWeight: 600,
              color: C.accent,
            }}
          >
            2 of 4
          </div>
        </div>

        {/* Header block: titles and filters, one line under the filters only */}
        {COLS.map((c) => (
          <div
            key={c.title}
            style={{
              position: "absolute",
              left: c.x + 16,
              top: headY,
              height: HEAD,
              display: "flex",
              alignItems: "center",
              ...CELL,
              fontWeight: 700,
            }}
          >
            {c.title}
            <SortIcon active={c.title === "Value" ? p : 0} />
          </div>
        ))}
        {COLS.map((c) => {
          const isType = c.title === "Type";
          const label = isType ? "1 of 3" : "All";
          return (
            <div
              key={c.title}
              style={{
                position: "absolute",
                left: c.x + 12,
                top: filterY + 6,
                width: interpolate(p, [0, 1], [c.w - 24, isType ? 150 : 104]),
                height: 40,
                boxSizing: "border-box",
                border: `1.5px solid ${isType ? interpolateColors(p, [0, 1], [C.lineStrong, C.accent]) : C.lineStrong}`,
                borderRadius: 8,
                background: isType ? interpolateColors(p, [0, 1], [C.surface, C.wash]) : C.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 12px",
                overflow: "hidden",
              }}
            >
              <span style={{ ...CELL, fontWeight: 600, color: isType ? C.accent : C.text, opacity: p, whiteSpace: "nowrap" }}>{label}</span>
              <span style={{ opacity: p, display: "flex" }}>
                <Chevron color={isType ? C.accent : C.muted} />
              </span>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, top: bodyY - 1.5, height: 1.5, background: C.lineStrong }} />

        {/* Body rows: the two filtered out fold away, the rest are sorted by value */}
        {rows.map((r, i) => (
          <div
            key={r.site}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: r.y,
              height: r.h,
              overflow: "hidden",
              opacity: r.keep ? 1 : interpolate(p, [0, 0.5], [1, 0], clamp),
              borderBottom: i < ROWS.length - 1 ? `1px solid ${C.line}` : "none",
            }}
          >
            {[r.site, r.type, r.value].map((v, k) => (
              <div key={k} style={{ position: "absolute", left: COLS[k].x + 16, top: 10, ...CELL }}>
                {v}
              </div>
            ))}
          </div>
        ))}
      </Interactive.Div>

      {/* The open panel under the Type filter: sort, value list with counts, no OK or Cancel */}
      <Interactive.Div
        name="Filter panel"
        style={{
          position: "absolute",
          left: COLS[1].x + 12,
          top: 4 + PAD + TOOLBAR + HEAD + 6 + 40 + 8,
          width: 300,
          boxSizing: "border-box",
          padding: "8px 0",
          background: C.surface,
          border: `1.5px solid ${C.lineStrong}`,
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(28,26,24,0.14)",
          opacity: interpolate(frame, [3.9 * fps, 4.2 * fps], [0, 1], clamp),
          translate: `0px ${interpolate(frame, [3.9 * fps, 4.2 * fps], [-10, 0], { ...clamp, easing: Easing.spring({ damping: 200 }) })}px`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, height: 36, padding: "0 16px", ...CELL, fontWeight: 600 }}>
          <span style={{ color: C.muted, fontWeight: 600 }}>Sort</span>
          <span>A-Z</span>
          <span>Z-A</span>
        </div>
        <div style={{ height: 1, background: C.line, margin: "2px 0 4px" }} />
        {[
          { v: "Renovation", n: 2, on: true },
          { v: "Fit-out", n: 1, on: false },
          { v: "New build", n: 1, on: false },
        ].map((o) => (
          <div key={o.v} style={{ display: "flex", alignItems: "center", gap: 12, height: 36, padding: "0 16px", ...CELL }}>
            <Check on={o.on} />
            <span style={{ flex: 1 }}>{o.v}</span>
            <span style={{ color: C.muted, fontFamily: MONO, fontSize: 22 }}>{o.n}</span>
          </div>
        ))}
      </Interactive.Div>

      {/* The finding, drawn on the element: magenta outline round the filter row and its tag */}
      <Interactive.Div
        name="Finding mark"
        style={{
          position: "absolute",
          left: COLS[0].x + 4,
          top: 4 + PAD + HEAD - 2,
          width: COLS[2].x + COLS[2].w - COLS[0].x - 8,
          height: FILTER + 4,
          boxSizing: "border-box",
          border: `3px solid ${C.magenta}`,
          borderRadius: 10,
          opacity: interpolate(frame, [1.2 * fps, 1.3 * fps, 3.4 * fps, 3.6 * fps], [0, 1, 1, 0], clamp),
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 16,
            top: -18,
            height: 32,
            padding: "0 12px",
            borderRadius: 6,
            background: C.magenta,
            color: "#ffffff",
            fontFamily: MONO,
            fontSize: 22,
            fontWeight: 700,
            lineHeight: "32px",
          }}
        >
          BOX
        </div>
      </Interactive.Div>
    </Frame>
  );
};

const schema = {
  command: { type: "string", default: "table-check.js", description: "Command typed in the console" },
  finding: { type: "string", default: "", description: "Finding line (real check output, cut at a word)" },
  clean: { type: "string", default: "", description: "Clean line (real check output)" },
  chromeIn: { type: "boolean", default: true, description: "Fade the frame in (after the poster)", keyframable: false },
  chromeOut: { type: "boolean", default: false, description: "Fade the frame out at the end", keyframable: false },
} as const satisfies InteractivitySchema;

export const TablesT1 = Interactive.withSchema({
  Component: TablesT1Inner,
  componentName: "TablesT1",
  schema,
  wrapInSequence: true,
  layout: "absolute-fill",
});
