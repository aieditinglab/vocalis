import { Composition } from "remotion";
import { VocalisPromo } from "./VocalisPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VocalisPromo"
        component={VocalisPromo}
        durationInFrames={420}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
