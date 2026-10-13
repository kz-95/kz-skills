import { Config } from "@remotion/cli/config";

// Render with the Chromium already on the machine; pass --browser-executable to override.
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
