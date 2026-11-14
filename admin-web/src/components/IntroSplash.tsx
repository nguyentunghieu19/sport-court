import { useState, useEffect } from "react";
import "./IntroSplash.css";

export function IntroSplash({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"playing" | "fading" | "done">("playing");

  useEffect(() => {
    // After 2.4s, start fading out
    const fadeTimer = setTimeout(() => setPhase("fading"), 2400);
    // After 3s, done
    const doneTimer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div
      className={`sc-intro${phase === "fading" ? " sc-intro--fade-out" : ""}`}
      aria-hidden="true"
    >
      {/* Gradient background */}
      <div className="sc-intro__bg" />

      {/* Floating sports items */}
      <div className="sc-intro__items">
        {/* Tennis ball */}
        <svg className="sc-intro__item sc-intro__tennis" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="#c8e646" />
          <path d="M10 32c0-12 8-22 20-26M54 32c0 12-8 22-20 26" stroke="#a8c520" strokeWidth="2.5" fill="none" />
          <circle cx="24" cy="18" r="4" fill="#e8ff8a" opacity=".6" />
        </svg>

        {/* Badminton shuttlecock */}
        <svg className="sc-intro__item sc-intro__shuttle" viewBox="0 0 64 80">
          <ellipse cx="32" cy="16" rx="10" ry="10" fill="#fff" />
          <ellipse cx="32" cy="14" rx="6" ry="6" fill="#f0f4e8" />
          <path d="M22 22l-6 50M32 22v52M42 22l6 50" stroke="#d5ef87" strokeWidth="1.8" />
          <path d="M18 48h28M20 58h24M22 68h20" stroke="#d5ef87" strokeWidth="1.2" opacity=".5" />
        </svg>

        {/* Football / Soccer ball */}
        <svg className="sc-intro__item sc-intro__football" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="#f8faf4" stroke="#cdd8c0" strokeWidth="1.5" />
          <path d="M32 4l6 14-10 8-10-8 6-14M32 60l6-14-10-8-10 8 6 14" stroke="#3a5a3a" strokeWidth="1.5" fill="#163f30" opacity=".6" />
          <path d="M4 26h12l6 10-6 10H4M60 26H48l-6 10 6 10h12" stroke="#3a5a3a" strokeWidth="1.5" fill="#163f30" opacity=".6" />
        </svg>

        {/* Pickleball paddle */}
        <svg className="sc-intro__item sc-intro__paddle" viewBox="0 0 56 90">
          <rect x="23" y="55" width="10" height="30" rx="4" fill="#8b6f47" />
          <ellipse cx="28" cy="30" rx="24" ry="28" fill="#1e6b4e" stroke="#2d8a63" strokeWidth="2" />
          <circle cx="20" cy="22" r="2" fill="#0d3d2a" opacity=".4" />
          <circle cx="28" cy="18" r="2" fill="#0d3d2a" opacity=".4" />
          <circle cx="36" cy="22" r="2" fill="#0d3d2a" opacity=".4" />
          <circle cx="22" cy="30" r="2" fill="#0d3d2a" opacity=".4" />
          <circle cx="30" cy="30" r="2" fill="#0d3d2a" opacity=".4" />
          <circle cx="28" cy="38" r="2" fill="#0d3d2a" opacity=".4" />
          <circle cx="20" cy="38" r="2" fill="#0d3d2a" opacity=".4" />
          <circle cx="36" cy="30" r="2" fill="#0d3d2a" opacity=".4" />
          <circle cx="36" cy="38" r="2" fill="#0d3d2a" opacity=".4" />
        </svg>

        {/* Basketball */}
        <svg className="sc-intro__item sc-intro__basketball" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="#f58c42" />
          <path d="M32 4v56M4 32h56M8 14c14 6 20 20 14 36M56 14c-14 6-20 20-14 36" stroke="#c86a20" strokeWidth="2" fill="none" />
          <circle cx="22" cy="16" r="5" fill="#ffa85c" opacity=".5" />
        </svg>

        {/* Tennis racket */}
        <svg className="sc-intro__item sc-intro__racket" viewBox="0 0 60 100">
          <rect x="26" y="65" width="8" height="30" rx="3" fill="#6b4e2e" />
          <ellipse cx="30" cy="34" rx="26" ry="32" fill="none" stroke="#d5ef87" strokeWidth="2.5" />
          <ellipse cx="30" cy="34" rx="22" ry="28" fill="#163f30" opacity=".3" />
          <line x1="8" y1="34" x2="52" y2="34" stroke="#d5ef87" strokeWidth="1" opacity=".5" />
          <line x1="30" y1="4" x2="30" y2="64" stroke="#d5ef87" strokeWidth="1" opacity=".5" />
          <line x1="12" y1="18" x2="48" y2="50" stroke="#d5ef87" strokeWidth=".8" opacity=".3" />
          <line x1="48" y1="18" x2="12" y2="50" stroke="#d5ef87" strokeWidth=".8" opacity=".3" />
        </svg>
      </div>

      {/* Particles */}
      <div className="sc-intro__particles">
        <span className="sc-intro__particle sc-intro__particle--1" />
        <span className="sc-intro__particle sc-intro__particle--2" />
        <span className="sc-intro__particle sc-intro__particle--3" />
        <span className="sc-intro__particle sc-intro__particle--4" />
        <span className="sc-intro__particle sc-intro__particle--5" />
        <span className="sc-intro__particle sc-intro__particle--6" />
        <span className="sc-intro__particle sc-intro__particle--7" />
        <span className="sc-intro__particle sc-intro__particle--8" />
      </div>

      {/* Center logo & text */}
      <div className="sc-intro__center">
        <div className="sc-intro__logo">
          <svg viewBox="0 0 32 32" fill="none">
            <rect x="4" y="6" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 6v20M4 11h24M4 21h24M9 11v10m14-10v10M9 16h14" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>
        <h1 className="sc-intro__title">
          Sport<span>Court</span><em>.</em>
        </h1>
        <p className="sc-intro__tagline">Your Court. Your Game.</p>
      </div>

      {/* Radial sweep */}
      <div className="sc-intro__sweep" />
    </div>
  );
}
