import { Composition } from "remotion";
import { Hero } from "./Hero";

// 1200x600 at 30fps, 12 seconds. Rendered with --every-nth-frame=2 (15fps GIF).
export const RemotionRoot = () => {
  return (
    <Composition
      id="Hero"
      component={Hero}
      durationInFrames={360}
      fps={30}
      width={1200}
      height={600}
    />
  );
};
