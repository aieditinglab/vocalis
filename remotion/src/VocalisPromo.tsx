import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const useFadeIn = (from: number, durationFrames = 20) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, from + durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

const useSlideUp = (from: number, durationFrames = 24) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - from,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.8 },
  });
  return interpolate(progress, [0, 1], [60, 0]);
};

const useScale = (from: number, durationFrames = 24) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - from,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.5 },
  });
  return interpolate(progress, [0, 1], [0.85, 1]);
};

// ─── Particle dots background ────────────────────────────────────────────────

const DOTS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: (i * 137.508) % 100,
  y: (i * 97.3) % 100,
  size: 1 + (i % 3),
  opacity: 0.04 + (i % 5) * 0.025,
  speed: 0.1 + (i % 4) * 0.05,
}));

const DotsBackground: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {DOTS.map((dot) => (
        <div
          key={dot.id}
          style={{
            position: "absolute",
            left: `${dot.x}%`,
            top: `${((dot.y + frame * dot.speed * 0.05) % 100)}%`,
            width: dot.size * 2,
            height: dot.size * 2,
            borderRadius: "50%",
            background: "#c8f53a",
            opacity: dot.opacity,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// ─── Noise grain overlay ─────────────────────────────────────────────────────

const GrainOverlay: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      opacity: 0.025,
      mixBlendMode: "overlay",
    }}
  />
);

// ─── Scene 1: Logo Intro (0–90) ───────────────────────────────────────────────

const SceneLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({ frame, fps, config: { damping: 10, stiffness: 60, mass: 1 } });
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);
  const logoScale = interpolate(logoSpring, [0, 1], [0.6, 1]);

  const lineWidth = interpolate(frame, [20, 60], [0, 320], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tagOpacity = interpolate(frame, [50, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tagY = interpolate(frame, [50, 80], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          display: "flex",
          alignItems: "center",
          gap: 28,
          marginBottom: 32,
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            background: "#c8f53a",
            borderRadius: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Waveform bars */}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {[18, 28, 36, 28, 18].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 5,
                  height: h,
                  background: "#0a0a0a",
                  borderRadius: 3,
                }}
              />
            ))}
          </div>
        </div>
        {/* Wordmark */}
        <span
          style={{
            fontFamily: "'Syne', 'Space Grotesk', sans-serif",
            fontSize: 88,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          Vocalis
        </span>
      </div>

      {/* Animated underline */}
      <div
        style={{
          width: lineWidth,
          height: 2,
          background: "linear-gradient(90deg, #c8f53a, transparent)",
          marginBottom: 32,
        }}
      />

      {/* Tagline */}
      <div
        style={{
          opacity: tagOpacity,
          transform: `translateY(${tagY}px)`,
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 400,
          color: "rgba(255,255,255,0.45)",
          letterSpacing: 6,
          textTransform: "uppercase",
        }}
      >
        Train Your Voice. Own The Room.
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Hero Statement (90–200) ────────────────────────────────────────

const SceneStatement: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1Spring = spring({ frame, fps, config: { damping: 14, stiffness: 70 } });
  const line2Spring = spring({ frame: frame - 14, fps, config: { damping: 14, stiffness: 70 } });
  const line3Spring = spring({ frame: frame - 28, fps, config: { damping: 14, stiffness: 70 } });

  const makeStyle = (s: number) => ({
    opacity: interpolate(s, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(s, [0, 1], [80, 0])}px)`,
  });

  const dotOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        paddingLeft: 140,
        paddingRight: 140,
        flexDirection: "column",
      }}
    >
      <div style={{ overflow: "hidden", marginBottom: 8 }}>
        <div
          style={{
            ...makeStyle(line1Spring),
            fontFamily: "'Syne', sans-serif",
            fontSize: 128,
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 0.95,
            letterSpacing: -5,
          }}
        >
          Speaking
        </div>
      </div>
      <div style={{ overflow: "hidden", marginBottom: 8 }}>
        <div
          style={{
            ...makeStyle(line2Spring),
            fontFamily: "'Syne', sans-serif",
            fontSize: 128,
            fontWeight: 900,
            color: "#c8f53a",
            lineHeight: 0.95,
            letterSpacing: -5,
          }}
        >
          is a skill.
        </div>
      </div>
      <div style={{ overflow: "hidden", marginTop: 40 }}>
        <div
          style={{
            ...makeStyle(line3Spring),
            fontFamily: "'Syne', sans-serif",
            fontSize: 26,
            fontWeight: 400,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.5,
            maxWidth: 600,
          }}
        >
          AI-powered communication coaching for the next generation of leaders.
        </div>
      </div>

      {/* Accent dot cluster */}
      <div
        style={{
          position: "absolute",
          right: 160,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: dotOpacity,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {[1, 0.5, 0.25].map((o, i) => (
          <div
            key={i}
            style={{
              width: 10 - i * 2,
              height: 10 - i * 2,
              borderRadius: "50%",
              background: "#c8f53a",
              opacity: o,
              alignSelf: "flex-end",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Features (200–330) ─────────────────────────────────────────────

const FEATURES = [
  {
    letter: "V",
    label: "Voice Clarity",
    desc: "Eliminate filler words. Speak with precision.",
  },
  {
    letter: "O",
    label: "Observe Patterns",
    desc: "AI analyzes every session in real time.",
  },
  {
    letter: "C",
    label: "Correct Instantly",
    desc: "Actionable feedback after every rep.",
  },
  {
    letter: "A",
    label: "Apply It Daily",
    desc: "Practice modes designed for your weak spots.",
  },
  {
    letter: "L",
    label: "Level Up",
    desc: "Track progress. Compete. Own the room.",
  },
];

const SceneFeatures: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 120,
        paddingRight: 120,
      }}
    >
      {/* Section label */}
      <div
        style={{
          opacity: titleOpacity,
          fontFamily: "'Syne', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 6,
          color: "#c8f53a",
          textTransform: "uppercase",
          marginBottom: 48,
          alignSelf: "flex-start",
        }}
      >
        The VOCAL Method
      </div>

      {/* Feature row */}
      <div
        style={{
          display: "flex",
          gap: 20,
          width: "100%",
        }}
      >
        {FEATURES.map((f, i) => {
          const cardSpring = spring({
            frame: frame - i * 12,
            fps,
            config: { damping: 14, stiffness: 80 },
          });
          const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
          const cardY = interpolate(cardSpring, [0, 1], [50, 0]);

          return (
            <div
              key={f.letter}
              style={{
                flex: 1,
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "40px 32px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  background: "#c8f53a",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#0a0a0a",
                }}
              >
                {f.letter}
              </div>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#ffffff",
                  lineHeight: 1.2,
                }}
              >
                {f.label}
              </div>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 15,
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.5,
                }}
              >
                {f.desc}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Outro CTA (330–420) ────────────────────────────────────────────

const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgScale = interpolate(frame, [0, 90], [1.1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const mainSpring = spring({ frame, fps, config: { damping: 12, stiffness: 60 } });
  const mainOpacity = interpolate(mainSpring, [0, 1], [0, 1]);
  const mainY = interpolate(mainSpring, [0, 1], [60, 0]);

  const subSpring = spring({ frame: frame - 16, fps, config: { damping: 12, stiffness: 60 } });
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);

  const logoSpring = spring({ frame: frame - 30, fps, config: { damping: 12, stiffness: 60 } });
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Big green glow blob */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,245,58,0.12) 0%, transparent 70%)",
          transform: `scale(${bgScale})`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          opacity: mainOpacity,
          transform: `translateY(${mainY}px)`,
          fontFamily: "'Syne', sans-serif",
          fontSize: 110,
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: -4,
          lineHeight: 0.95,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        Own{" "}
        <span style={{ color: "#c8f53a" }}>the</span>
        <br />
        room.
      </div>

      <div
        style={{
          opacity: subOpacity,
          fontFamily: "'Syne', sans-serif",
          fontSize: 20,
          fontWeight: 400,
          color: "rgba(255,255,255,0.45)",
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 64,
        }}
      >
        vocalis-zeta.vercel.app
      </div>

      {/* Logo lockup */}
      <div
        style={{
          opacity: logoOpacity,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            background: "#c8f53a",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            {[10, 16, 20, 16, 10].map((h, i) => (
              <div
                key={i}
                style={{ width: 3, height: h, background: "#0a0a0a", borderRadius: 2 }}
              />
            ))}
          </div>
        </div>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 36,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: -1,
          }}
        >
          Vocalis
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ─── Transition flash ─────────────────────────────────────────────────────────

const SceneTransition: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [at - 4, at, at + 6], [0, 0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        background: "#c8f53a",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

// ─── Root composition ─────────────────────────────────────────────────────────

export const VocalisPromo: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "#0a0a0a",
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {/* Persistent backgrounds */}
      <DotsBackground />
      <GrainOverlay />

      {/* Scenes */}
      <Sequence from={0} durationInFrames={100}>
        <SceneLogo />
      </Sequence>

      <Sequence from={100} durationInFrames={110}>
        <SceneStatement />
      </Sequence>

      <Sequence from={210} durationInFrames={120}>
        <SceneFeatures />
      </Sequence>

      <Sequence from={330} durationInFrames={90}>
        <SceneOutro />
      </Sequence>

      {/* Flash transitions */}
      <SceneTransition at={100} />
      <SceneTransition at={210} />
      <SceneTransition at={330} />
    </AbsoluteFill>
  );
};
