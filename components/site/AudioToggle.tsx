"use client";

import { useEffect, useRef, useState } from "react";
import { STARTUP_INTRO_FINISHED_EVENT } from "./motionEvents";
import "./AudioToggle.css";

export function AudioToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const interactedRef = useRef(false);
  const requestedRef = useRef(false);
  const attemptRef = useRef(0);
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    const attempt = attemptRef;
    let timeout: number | undefined;

    function schedulePrompt() {
      window.clearTimeout(timeout);
      if (document.readyState !== "complete" || interactedRef.current) return;
      timeout = window.setTimeout(() => {
        // Let the existing startup overlay finish before opening the pill.
        if (!interactedRef.current && !document.querySelector(".startup-intro[data-playing]")) {
          setExpanded(true);
        }
      }, 1000);
    }

    schedulePrompt();
    window.addEventListener("load", schedulePrompt);
    window.addEventListener(STARTUP_INTRO_FINISHED_EVENT, schedulePrompt);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("load", schedulePrompt);
      window.removeEventListener(STARTUP_INTRO_FINISHED_EVENT, schedulePrompt);
      requestedRef.current = false;
      attempt.current++;
      audio?.pause();
    };
  }, []);

  async function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;

    interactedRef.current = true;
    requestedRef.current = !requestedRef.current;
    const attempt = ++attemptRef.current;
    setError("");

    if (!requestedRef.current) {
      audio.pause();
      setPlaying(false);
      setExpanded(false);
      return;
    }

    // Only request the track after a user gesture, never on page load.
    audio.volume = 0.4;
    try {
      await audio.play();
    } catch {
      if (attempt !== attemptRef.current) return;
      requestedRef.current = false;
      setPlaying(false);
      setError("Audio couldn’t play. Please try again.");
    }
  }

  function dismissPrompt() {
    interactedRef.current = true;
    requestedRef.current = false;
    attemptRef.current++;
    audioRef.current?.pause();
    setPlaying(false);
    setExpanded(false);
    setError("");
    buttonRef.current?.focus({ preventScroll: true });
  }

  function onPlaying() {
    if (!requestedRef.current) {
      audioRef.current?.pause();
      return;
    }
    setPlaying(true);
    setExpanded(false);
    setError("");
  }

  return (
    <div className="audio-toggle">
      <audio
        ref={audioRef}
        src="/audio/tech-club-ambient.mp3"
        preload="none"
        loop
        onPlaying={onPlaying}
        onPause={() => setPlaying(false)}
        onError={() => {
          attemptRef.current++;
          requestedRef.current = false;
          setPlaying(false);
          setError("Audio couldn’t load. Please try again.");
        }}
      />
      <button
        ref={buttonRef}
        type="button"
        className="audio-toggle__button"
        data-expanded={expanded ? "" : undefined}
        data-playing={playing ? "" : undefined}
        aria-label={playing ? "Disable audio" : "Enable audio"}
        aria-pressed={playing}
        title={playing ? "Disable audio" : "Enable audio"}
        onClick={toggleAudio}
      >
        <span className="audio-toggle__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 17V5l11-2v12M9 8l11-2" />
            <ellipse cx="6" cy="17" rx="3" ry="2.5" />
            <ellipse cx="17" cy="15" rx="3" ry="2.5" />
            <path className="audio-toggle__slash" d="m3 3 18 18" />
          </svg>
        </span>
        <span className="audio-toggle__label" aria-hidden="true">Enable audio</span>
      </button>
      {expanded && (
        <button
          type="button"
          className="audio-toggle__dismiss"
          aria-label="Dismiss audio prompt"
          title="Dismiss audio prompt"
          onClick={dismissPrompt}
        >
          <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="m3 3 6 6m0-6-6 6" />
          </svg>
        </button>
      )}
      <span className="audio-toggle__status" role="status">{error}</span>
    </div>
  );
}
