import React from "react";
import { Composition, Folder } from "remotion";
import { Hero } from "./Hero";
import { ChartsC5 } from "./scenes/ChartsC5";
import { Close } from "./scenes/Close";
import { ContrastY2 } from "./scenes/ContrastY2";
import { DiagramsG6 } from "./scenes/DiagramsG6";
import { Poster } from "./scenes/Poster";
import { TablesT1 } from "./scenes/TablesT1";

// 1200x675 at 30 fps, rendered with --every-nth-frame=2 (15 fps, 7 cs a frame in the GIF).
// Hero: poster 4 s + four scenes of 6 s + close 3.5 s = 31.5 s (945 frames).
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Scenes">
        <Composition
          id="Poster"
          component={Poster}
          durationInFrames={120}
          fps={30}
          width={1200}
          height={675}
          defaultProps={{
            headline: "kz-skills",
            line: "UI rules for AI coding agents, each with a browser check that measures it.",
          }}
        />
        <Composition
          id="TablesT1"
          component={TablesT1}
          durationInFrames={180}
          fps={30}
          width={1200}
          height={675}
          defaultProps={{
            command: "table-check.js",
            finding: "BOX | table 1 | 3 of 3 column filters are a bare text box...",
            clean: "table check: 1 table(s) read - no failures",
            chromeIn: true,
            chromeOut: false,
          }}
        />
        <Composition
          id="ContrastY2"
          component={ContrastY2}
          durationInFrames={180}
          fps={30}
          width={1200}
          height={675}
          defaultProps={{
            command: "contrast-check.js",
            finding: "LOW | dark: span.label | 1.05:1, needs 4.5:1...",
            clean: "contrast check: clean - 6 text runs read in both themes",
          }}
        />
        <Composition
          id="ChartsC5"
          component={ChartsC5}
          durationInFrames={180}
          fps={30}
          width={1200}
          height={675}
          defaultProps={{
            command: "layout-audit.js",
            finding: "FOCUS BOX | wedge | 3 x path.wedge: the focus ring is the bounding box...",
            clean: "clean",
            fromDark: true,
          }}
        />
        <Composition
          id="DiagramsG6"
          component={DiagramsG6}
          durationInFrames={180}
          fps={30}
          width={1200}
          height={675}
          defaultProps={{
            command: "diagram-check.js",
            finding: "LABEL ON LINE | svg \"Checkout\" | plate \"WRITE\" covers its own line...",
            clean: "diagram check: clean - 1 diagram(s) measured",
            chromeOut: true,
          }}
        />
        <Composition
          id="Close"
          component={Close}
          durationInFrames={105}
          fps={30}
          width={1200}
          height={675}
          defaultProps={{
            headline: "94 rules. 10 checks. Any stack.",
            install: "npx skills add kz-95/kz-skills",
            posterHeadline: "kz-skills",
            posterLine: "UI rules for AI coding agents, each with a browser check that measures it.",
          }}
        />
      </Folder>
      <Composition id="Hero" component={Hero} durationInFrames={945} fps={30} width={1200} height={675} />
    </>
  );
};
