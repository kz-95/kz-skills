import React from "react";
import { AbsoluteFill, Interactive, interpolateColors } from "remotion";
import { CATEGORIES, L, MONO, SANS, SOLID, tokens, type Category } from "./theme";

// The shared frame of a category scene: top bar (category, rule, WRONG/RIGHT chip),
// stage (the sample UI, passed as children), console and footer. Every value that moves
// is passed in by the scene, which keyframes it inline.

type FrameProps = {
  readonly category: Category;
  readonly ruleId: string;
  readonly ruleText: string;
  /** 0 = WRONG chip, 1 = RIGHT chip. */
  readonly verdict: number;
  /** The chrome (cards, footer): 1 when the frame is already on screen from the scene before. */
  readonly chromeOpacity: number;
  /** Everything that belongs to this scene: top bar text, stage, console lines. */
  readonly contentOpacity: number;
  readonly command: string;
  /** Characters of the command typed so far. */
  readonly typed: number;
  readonly finding: string;
  readonly findingOpacity: number;
  /** 0 = the finding as reported, 1 = dimmed once the fix is in. */
  readonly findingDim: number;
  readonly clean: string;
  readonly cleanOpacity: number;
  /** 0 = light theme, 1 = dark theme (the Contrast scene); in between while it fades. */
  readonly dark?: number;
  readonly children: React.ReactNode;
};

const Chip: React.FC<{ label: string; bg: string; opacity: number }> = ({ label, bg, opacity }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: bg,
      color: "#ffffff",
      borderRadius: 10,
      fontFamily: SANS,
      fontSize: 32,
      fontWeight: 700,
      letterSpacing: 1,
      opacity,
    }}
  >
    {label}
  </div>
);

export const Frame: React.FC<FrameProps> = ({
  category,
  ruleId,
  ruleText,
  verdict,
  chromeOpacity,
  contentOpacity,
  command,
  typed,
  finding,
  findingOpacity,
  findingDim,
  clean,
  cleanOpacity,
  dark = 0,
  children,
}) => {
  const C = tokens(dark);
  const sep = finding.indexOf(" | ");
  const code = sep > 0 ? finding.slice(0, sep) : "";
  const rest = sep > 0 ? finding.slice(sep) : finding;
  const lineStyle: React.CSSProperties = {
    fontFamily: MONO,
    fontSize: 24,
    lineHeight: "38px",
    height: 38,
    whiteSpace: "pre",
    overflow: "hidden",
  };
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: SANS }}>
      {/* Top bar */}
      <Interactive.Div
        name="Top bar"
        style={{
          position: "absolute",
          left: L.margin,
          right: L.margin,
          top: L.topBar.y,
          height: L.topBar.h,
          opacity: contentOpacity,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            fontSize: 22,
            lineHeight: "26px",
            fontWeight: 600,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: C.muted,
          }}
        >
          {category}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            fontSize: 32,
            lineHeight: "40px",
            fontWeight: 700,
            letterSpacing: -0.3,
            color: C.text,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: C.accent, marginRight: 16 }}>{ruleId}</span>
          {ruleText}
        </div>
        <div style={{ position: "absolute", right: 0, top: 4, width: 160, height: 60 }}>
          <Chip label="WRONG" bg={SOLID.wrong} opacity={1 - verdict} />
          <Chip label="RIGHT" bg={SOLID.right} opacity={verdict} />
        </div>
      </Interactive.Div>

      {/* Stage: the sample UI */}
      <Interactive.Div
        name="Stage"
        style={{
          position: "absolute",
          left: L.margin,
          right: L.margin,
          top: L.stage.y,
          height: L.stage.h,
          opacity: contentOpacity,
        }}
      >
        {children}
      </Interactive.Div>

      {/* Console */}
      <Interactive.Div
        name="Console"
        style={{
          position: "absolute",
          left: L.margin,
          right: L.margin,
          top: L.console.y,
          height: L.console.h,
          boxSizing: "border-box",
          padding: "15px 20px",
          background: C.surface,
          border: `1.5px solid ${C.line}`,
          borderRadius: 12,
          opacity: chromeOpacity,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 20,
            top: 20,
            fontFamily: SANS,
            fontSize: 22,
            lineHeight: "26px",
            fontWeight: 600,
            color: C.muted,
          }}
        >
          browser console
        </div>
        <div style={{ opacity: contentOpacity }}>
          <div style={{ ...lineStyle, color: C.text }}>
            <span style={{ color: C.accent, fontWeight: 700 }}>{"> "}</span>
            {command.slice(0, Math.round(typed))}
          </div>
          <div
            style={{
              ...lineStyle,
              opacity: findingOpacity,
              color: interpolateColors(findingDim, [0, 1], [C.text, C.muted]),
            }}
          >
            <span
              style={{
                fontWeight: 700,
                color: interpolateColors(findingDim, [0, 1], [C.magenta, C.muted]),
              }}
            >
              {code}
            </span>
            {rest}
          </div>
          <div style={{ ...lineStyle, color: C.green, fontWeight: 700, opacity: cleanOpacity }}>{clean}</div>
        </div>
      </Interactive.Div>

      {/* Footer */}
      <Interactive.Div
        name="Footer"
        style={{
          position: "absolute",
          left: L.margin,
          right: L.margin,
          top: L.footer.y,
          height: L.footer.h,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: chromeOpacity,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: C.accent }}>kz-skills</div>
        <div style={{ display: "flex", gap: 10 }}>
          {CATEGORIES.map((c) => {
            const on = c === category;
            return (
              <div
                key={c}
                style={{
                  height: L.footer.h,
                  boxSizing: "border-box",
                  padding: "0 14px",
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 22,
                  fontWeight: 600,
                  background: on ? SOLID.accent : "transparent",
                  border: `1.5px solid ${on ? SOLID.accent : C.lineStrong}`,
                  color: on ? "#ffffff" : C.muted,
                }}
              >
                {c}
              </div>
            );
          })}
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
