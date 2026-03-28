// components/HowItWorksSection.tsx
"use client";

import { useState } from "react";
import { Player } from "@remotion/player";
import { VocalisPromo } from "../remotion/src/VocalisPromo";

export default function HowItWorksSection() {
  const [playing, setPlaying] = useState(false);

  return (
    <section id="how-it-works" className="relative py-32 px-6 bg-[#0a0a0a] overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full bg-[#c8f53a] opacity-[0.04] blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto flex flex-col items-center gap-12 relative z-10">
        {/* Heading */}
        <div className="text-center">
          <p className="text-[#c8f53a] text-sm font-semibold tracking-[6px] uppercase mb-4">
            See It In Action
          </p>
          <h2 className="text-white text-5xl font-black tracking-tight leading-none">
            See how it works.
          </h2>
        </div>

        {/* Player */}
        <div
          className="relative w-full rounded-2xl overflow-hidden border border-white/10"
          style={{ aspectRatio: "16/9" }}
        >
          {!playing ? (
            /* Poster / play button */
            <div
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-[#111] group"
              onClick={() => setPlaying(true)}
            >
              {/* Thumbnail text */}
              <p className="text-white/20 text-sm tracking-widest uppercase mb-8">
                Vocalis — 14 second overview
              </p>
              {/* Play button */}
              <div className="w-20 h-20 rounded-full bg-[#c8f53a] flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#0a0a0a">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
              <p className="text-white/30 text-sm mt-6">Click to play</p>
            </div>
          ) : (
            <Player
              component={VocalisPromo}
              durationInFrames={420}
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{ width: "100%", height: "100%" }}
              autoPlay
              controls
            />
          )}
        </div>
      </div>
    </section>
  );
}