import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);

// Pinned GIF encoder (PLAN.md, "Canvas, timing, encoding"): a palette built from the
// pixels that change, and only the changed rectangle redrawn, so flat areas stay flat.
// No dither: compared with dither=bayer:bayer_scale=5 on the same frames, it is 7%
// smaller (1.99MB against 2.14MB) and equally clean at 200% (flat UI, few gradients).
// Replaces Remotion's default "split[v],palettegen,[v]paletteuse".
const GIF_FILTER = "split[v],palettegen=stats_mode=diff,[v]paletteuse=dither=none:diff_mode=rectangle";

Config.overrideFfmpegCommand(({ type, args }) => {
  if (type !== "stitcher") {
    return args;
  }
  return args.map((a) => (a === "split[v],palettegen,[v]paletteuse" ? GIF_FILTER : a));
});
