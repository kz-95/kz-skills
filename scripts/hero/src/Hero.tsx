import React from "react";
import { TransitionSeries } from "@remotion/transitions";
import { useVideoConfig } from "remotion";
import { ChartsC5 } from "./scenes/ChartsC5";
import { Close } from "./scenes/Close";
import { ContrastY2 } from "./scenes/ContrastY2";
import { DiagramsG6 } from "./scenes/DiagramsG6";
import { Poster } from "./scenes/Poster";
import { TablesT1 } from "./scenes/TablesT1";

// The README hero: the poster, one scene per category, the close. Each scene fades its
// own content to the background and in again, so there is no UI-to-UI crossfade and the
// series needs no transitions. Console strings are the checks' real output on the
// sample pages, cut at a word boundary (README.md, "Console strings").
export const Hero: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Poster" durationInFrames={4 * fps} premountFor={fps}>
        <Poster headline="kz-skills" line="UI rules for AI coding agents, each with a browser check that measures it." />
      </TransitionSeries.Sequence>
      <TransitionSeries.Sequence name="Tables T1" durationInFrames={6 * fps} premountFor={fps}>
        <TablesT1
          command="table-check.js"
          finding="BOX | table 1 | 3 of 3 column filters are a bare text box..."
          clean="table check: 1 table(s) read - no failures"
          chromeIn
          chromeOut={false}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Sequence name="Contrast Y2" durationInFrames={6 * fps} premountFor={fps}>
        <ContrastY2
          command="contrast-check.js"
          finding="LOW | dark: span.label | 1.05:1, needs 4.5:1..."
          clean="contrast check: clean - 6 text runs read in both themes"
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Sequence name="Charts C5" durationInFrames={6 * fps} premountFor={fps}>
        <ChartsC5
          command="layout-audit.js"
          finding="FOCUS BOX | wedge | 3 x path.wedge: the focus ring is the bounding box..."
          clean="clean"
          fromDark
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Sequence name="Diagrams G6" durationInFrames={6 * fps} premountFor={fps}>
        <DiagramsG6
          command="diagram-check.js"
          finding={"LABEL ON LINE | svg \"Checkout\" | plate \"WRITE\" covers its own line..."}
          clean="diagram check: clean - 1 diagram(s) measured"
          chromeOut
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Sequence name="Close" durationInFrames={3.5 * fps} premountFor={fps}>
        <Close
          headline="94 rules. 10 checks. Any stack."
          install="npx skills add kz-95/kz-skills"
          posterHeadline="kz-skills"
          posterLine="UI rules for AI coding agents, each with a browser check that measures it."
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
