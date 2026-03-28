import React from "react";
import { Composition } from "remotion";
import { VocalisPromo } from "./VocalisPromo";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="VocalisPromo"
    component={VocalisPromo}
    durationInFrames={480}
    fps={30}
    width={1920}
    height={1080}
  />
);
