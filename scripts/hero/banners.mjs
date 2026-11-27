// Renders the README section banners, light and dark, into docs/assets/banners/.
// node banners.mjs   (CHROME=/path/to/chrome to use an installed browser)
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const OUT = "../../docs/assets/banners";
const BANNERS = [
  { name: "covers", text: "WRONG / RIGHT", shape: "butterfly", accentFrom: 8, label: "Wrong / right" },
  { name: "measured", text: "MEASURED", shape: "trapezoid", accentFrom: -1, label: "Measured" },
  { name: "loads", text: "96 RULES > 1 PACK", shape: "funnel", accentFrom: 11, label: "96 rules to 1 pack" },
];

mkdirSync(OUT, { recursive: true });
for (const b of BANNERS) {
  for (const theme of ["light", "dark"]) {
    const props = JSON.stringify({ text: b.text, shape: b.shape, theme, accentFrom: b.accentFrom, label: b.label });
    const args = ["remotion", "still", "src/index.ts", "Banner", `${OUT}/${b.name}-${theme}.png`,
      `--props=${props}`, "--scale=2", "--image-format=png"];
    if (process.env.CHROME) args.push(`--browser-executable=${process.env.CHROME}`);
    execFileSync("npx", args, { stdio: "inherit" });
  }
}
