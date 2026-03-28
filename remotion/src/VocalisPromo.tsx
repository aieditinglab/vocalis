import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Syne";

loadFont();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fadeIn = (frame: number, from: number, dur = 20) =>
  interpolate(frame, [from, from + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const slideUp = (spr: number) => interpolate(spr, [0, 1], [48, 0]);
const scaleIn = (spr: number) => interpolate(spr, [0, 1], [0.92, 1]);

// ─── Shared BG ────────────────────────────────────────────────────────────────

const BG: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0a0a0a", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(200,245,58,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(200,245,58,0.025) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
      }} />
      <div style={{
        position: "absolute",
        width: 900, height: 900, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,245,58,0.07) 0%, transparent 65%)",
        left: `${20 + Math.sin(frame * 0.01) * 8}%`,
        top: `${-10 + Math.cos(frame * 0.008) * 6}%`,
        transform: "translate(-50%,-50%)",
      }} />
    </AbsoluteFill>
  );
};

// ─── Scene 1: Brand Punch (0–70) ─────────────────────────────────────────────

const SceneBrand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpr = spring({ frame, fps, config: { damping: 10, stiffness: 55, mass: 1.2 } });
  const tagSpr  = spring({ frame: frame - 22, fps, config: { damping: 14, stiffness: 70 } });
  const lineSpr = spring({ frame: frame - 10, fps, config: { damping: 20, stiffness: 100 } });
  const lineW   = interpolate(lineSpr, [0, 1], [0, 480]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 28,
        opacity: interpolate(logoSpr, [0, 1], [0, 1]),
        transform: `scale(${interpolate(logoSpr, [0, 1], [0.5, 1])})`,
        marginBottom: 28,
      }}>
        <div style={{ width: 80, height: 80, background: "#c8f53a", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[20, 32, 42, 32, 20].map((h, i) => (
              <div key={i} style={{ width: 6, height: h, background: "#0a0a0a", borderRadius: 3 }} />
            ))}
          </div>
        </div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 96, fontWeight: 900, color: "#fff", letterSpacing: -4, lineHeight: 1 }}>Vocalis</span>
      </div>

      <div style={{ width: lineW, height: 2, background: "linear-gradient(90deg, #c8f53a, rgba(200,245,58,0.1))", marginBottom: 28 }} />

      <div style={{
        opacity: interpolate(tagSpr, [0, 1], [0, 1]),
        transform: `translateY(${slideUp(tagSpr)}px)`,
        fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 500,
        color: "rgba(255,255,255,0.4)", letterSpacing: 7, textTransform: "uppercase",
      }}>
        Train Your Voice. Own The Room.
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Practice Screen (70–200) ───────────────────────────────────────

const PROMPT = "Describe a challenge you've overcome and what it taught you about yourself.";

const ScenePractice: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpr  = spring({ frame, fps, config: { damping: 14, stiffness: 70 } });
  const promptReveal = interpolate(frame, [15, 50], [0, PROMPT.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const visiblePrompt = PROMPT.slice(0, Math.floor(promptReveal));
  const isRecording = frame > 55;
  const recOpacity  = isRecording ? (Math.sin(frame * 0.15) * 0.4 + 0.6) : 0;
  const btnSpr = spring({ frame: frame - 40, fps, config: { damping: 14, stiffness: 80 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", padding: "0 160px" }}>
      <div style={{
        opacity: fadeIn(frame, 0, 15),
        fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700,
        letterSpacing: 6, color: "#c8f53a", textTransform: "uppercase",
        marginBottom: 36, alignSelf: "flex-start",
      }}>
        Practice Mode — New Rep
      </div>

      <div style={{
        width: "100%",
        opacity: interpolate(cardSpr, [0, 1], [0, 1]),
        transform: `translateY(${slideUp(cardSpr)}px)`,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 28, padding: "48px 52px",
        display: "flex", flexDirection: "column", gap: 36,
      }}>
        {/* Prompt */}
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 16 }}>
            Your Prompt
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>
            "{visiblePrompt}<span style={{ opacity: Math.sin(frame * 0.25) > 0 ? 1 : 0, color: "#c8f53a" }}>|</span>"
          </div>
        </div>

        {/* Waveform */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 64 }}>
            {Array.from({ length: 52 }).map((_, i) => {
              const base = 12;
              const amp  = isRecording ? 48 : 4;
              const h    = base + amp * Math.abs(Math.sin(frame * 0.18 + i * 0.7 + i * 0.3));
              return (
                <div key={i} style={{
                  width: 4, height: h, borderRadius: 2,
                  background: isRecording ? "#c8f53a" : "rgba(200,245,58,0.2)",
                  opacity: isRecording ? 1 : 0.4,
                }} />
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: interpolate(btnSpr, [0, 1], [0, 1]) }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: isRecording ? "#c8f53a" : "rgba(200,245,58,0.15)",
                border: isRecording ? "none" : "2px solid rgba(200,245,58,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
              }}>
                {isRecording
                  ? <div style={{ width: 16, height: 16, background: "#0a0a0a", borderRadius: 3 }} />
                  : <div style={{ width: 18, height: 18, background: "#c8f53a", borderRadius: "50%" }} />
                }
                {isRecording && (
                  <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "2px solid rgba(200,245,58,0.3)", opacity: recOpacity }} />
                )}
              </div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: isRecording ? "#c8f53a" : "rgba(255,255,255,0.5)" }}>
                {isRecording ? "Recording..." : "Tap to Record"}
              </span>
            </div>

            {isRecording && (
              <div style={{
                fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800,
                color: "rgba(255,255,255,0.3)", letterSpacing: 2,
                opacity: fadeIn(frame, 56, 8),
              }}>
                {String(Math.floor((frame - 55) / 30)).padStart(2, "0")}:{String(((frame - 55) % 30) * 2).padStart(2, "0")}
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: AI Feedback (200–325) ──────────────────────────────────────────

const FEEDBACK = [
  { icon: "🎯", label: "Clarity",     score: 92, text: "Strong structure. Your key point landed in the first sentence." },
  { icon: "⚡", label: "Filler Words", score: 88, text: "Only 2 filler words detected. Down from 7 last session." },
  { icon: "🔥", label: "Confidence",  score: 95, text: "Tone was steady throughout. No hesitation on key phrases." },
];

const SceneFeedback: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerSpr = spring({ frame, fps, config: { damping: 14, stiffness: 70 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", flexDirection: "column", padding: "0 160px" }}>
      <div style={{
        opacity: interpolate(headerSpr, [0, 1], [0, 1]),
        transform: `translateY(${slideUp(headerSpr)}px)`,
        marginBottom: 40, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 6, color: "#c8f53a", textTransform: "uppercase", marginBottom: 8 }}>
            AI Feedback — Instant Analysis
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 900, color: "#fff", letterSpacing: -2, lineHeight: 1 }}>
            Here's what<br />we found.
          </div>
        </div>
        <div style={{
          opacity: fadeIn(frame, 5, 15),
          background: "rgba(200,245,58,0.1)", border: "1px solid rgba(200,245,58,0.25)",
          borderRadius: 100, padding: "10px 20px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c8f53a" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#c8f53a" }}>Analysis Complete</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {FEEDBACK.map((item, i) => {
          const delay = i * 18;
          const spr = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 75 } });
          const barW = interpolate(frame, [delay + 20, delay + 50], [0, item.score], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={item.label} style={{
              opacity: interpolate(spr, [0, 1], [0, 1]),
              transform: `translateY(${slideUp(spr)}px)`,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>{item.label}</span>
                </div>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 900, color: "#c8f53a" }}>{Math.floor(barW)}</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${barW}%`, background: "linear-gradient(90deg, #c8f53a, #a8e020)", borderRadius: 2 }} />
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{item.text}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Score Ring (325–405) ───────────────────────────────────────────

const SceneScore: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numSpr   = spring({ frame: frame - 10, fps, config: { damping: 10, stiffness: 40, mass: 2 } });
  const labelSpr = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 70 } });
  const badgeSpr = spring({ frame: frame - 45, fps, config: { damping: 10, stiffness: 100 } });
  const num = Math.floor(interpolate(numSpr, [0, 1], [60, 95]));

  const circumference = 2 * Math.PI * 110;
  const ringProgress  = interpolate(frame, [10, 60], [0, 0.95], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dashOffset    = circumference * (1 - ringProgress);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,245,58,0.1) 0%, transparent 65%)" }} />

      <div style={{ position: "relative", width: 280, height: 280, marginBottom: 40 }}>
        <svg width="280" height="280" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx="140" cy="140" r="110" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="140" cy="140" r="110" fill="none" stroke="#c8f53a" strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 80, fontWeight: 900, color: "#fff", letterSpacing: -4, lineHeight: 1, opacity: interpolate(numSpr, [0, 1], [0, 1]) }}>
            {num}
          </span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, color: "rgba(255,255,255,0.35)", letterSpacing: 2 }}>/ 100</span>
        </div>
      </div>

      <div style={{ opacity: interpolate(labelSpr, [0, 1], [0, 1]), transform: `translateY(${slideUp(labelSpr)}px)`, textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>Clarity Score</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>Your best session yet</div>
      </div>

      <div style={{
        opacity: interpolate(badgeSpr, [0, 1], [0, 1]),
        transform: `scale(${scaleIn(badgeSpr)})`,
        background: "#c8f53a", borderRadius: 100, padding: "12px 28px",
        fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: "#0a0a0a", letterSpacing: 1,
      }}>
        🏆 New Personal Best
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5: Outro CTA (405–480) ────────────────────────────────────────────

const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mainSpr = spring({ frame, fps, config: { damping: 12, stiffness: 60 } });
  const subSpr  = spring({ frame: frame - 18, fps, config: { damping: 12, stiffness: 60 } });
  const logoSpr = spring({ frame: frame - 32, fps, config: { damping: 12, stiffness: 60 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,245,58,0.09) 0%, transparent 65%)" }} />

      <div style={{
        opacity: interpolate(mainSpr, [0, 1], [0, 1]),
        transform: `translateY(${slideUp(mainSpr)}px)`,
        fontFamily: "'Syne', sans-serif", fontSize: 108, fontWeight: 900,
        color: "#fff", letterSpacing: -5, lineHeight: 0.92, textAlign: "center", marginBottom: 20,
      }}>
        Own <span style={{ color: "#c8f53a" }}>the</span><br />room.
      </div>

      <div style={{ opacity: interpolate(subSpr, [0, 1], [0, 1]), fontFamily: "'Syne', sans-serif", fontSize: 18, color: "rgba(255,255,255,0.35)", letterSpacing: 5, textTransform: "uppercase", marginBottom: 52 }}>
        vocalis-zeta.vercel.app
      </div>

      <div style={{ opacity: interpolate(logoSpr, [0, 1], [0, 1]), transform: `scale(${scaleIn(logoSpr)})`, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 44, height: 44, background: "#c8f53a", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 3.5, alignItems: "center" }}>
            {[11, 18, 22, 18, 11].map((h, i) => (
              <div key={i} style={{ width: 3.5, height: h, background: "#0a0a0a", borderRadius: 2 }} />
            ))}
          </div>
        </div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 38, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>Vocalis</span>
      </div>
    </AbsoluteFill>
  );
};

// ─── Flash ────────────────────────────────────────────────────────────────────

const Flash: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [at - 4, at, at + 8], [0, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "#c8f53a", opacity, pointerEvents: "none" }} />;
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export const VocalisPromo: React.FC = () => (
  <AbsoluteFill style={{ background: "#0a0a0a", fontFamily: "'Syne', sans-serif" }}>
    <BG />
    <Sequence from={0}   durationInFrames={75}><SceneBrand /></Sequence>
    <Sequence from={75}  durationInFrames={130}><ScenePractice /></Sequence>
    <Sequence from={205} durationInFrames={125}><SceneFeedback /></Sequence>
    <Sequence from={330} durationInFrames={80}><SceneScore /></Sequence>
    <Sequence from={410} durationInFrames={70}><SceneOutro /></Sequence>
    <Flash at={75} />
    <Flash at={205} />
    <Flash at={330} />
    <Flash at={410} />
  </AbsoluteFill>
);
