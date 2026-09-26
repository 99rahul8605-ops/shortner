"use client";

import { useEffect, useState, type ReactNode } from "react";

type Props = {
  slug: string;
  step: number;
  routeToken: string;
  startedAt: number;
  seconds: number;
  children?: ReactNode;
  /** The ad-free Get Link page uses one button, not the article's two-button flow. */
  final?: boolean;
};

export default function ContinueTimer({
  slug,
  step,
  routeToken,
  startedAt,
  seconds,
  children,
  final = false,
}: Props) {
  const [actualStart, setActualStart] = useState(startedAt);
  const [remaining, setRemaining] = useState(seconds);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (final) return;
    const onPopupClose = (event: Event) => {
      const value = (event as CustomEvent<{ startedAt: number }>).detail?.startedAt;
      if (typeof value === "number" && value > 0) setActualStart(value);
    };
    window.addEventListener("bingolink:popup-closed", onPopupClose);
    return () => window.removeEventListener("bingolink:popup-closed", onPopupClose);
  }, [final]);

  useEffect(() => {
    if (actualStart <= 0) {
      setRemaining(seconds);
      return;
    }
    const tick = () => setRemaining(Math.max(0, seconds - Math.floor((Date.now() - actualStart) / 1000)));
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [seconds, actualStart]);

  const ready = actualStart > 0 && remaining === 0;

  async function next() {
    if (!ready || (!final && !revealed) || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, step, vt: routeToken }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.next !== "string") {
        throw new Error(data.error || "Please try again");
      }
      window.location.assign(data.next);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <>
      <section className="timer-card timer-card-compact" id="continue-timer">
        {!ready ? (
          <>
            <div className="timer-compact-label">
              {final ? "Preparing your destination" : "Next step is almost ready"}
            </div>
            <div className="timer-compact-clock" role="timer" aria-live="off">
              {String(Math.floor(remaining / 60)).padStart(2, "0")}:
              {String(remaining % 60).padStart(2, "0")}
            </div>
            <p className="timer-compact-note">
              {actualStart <= 0 ? "Close the popup to start your timer." : "Please wait for the countdown."}
            </p>
          </>
        ) : final ? (
          <>
            <div className="timer-compact-label">Your destination is ready</div>
            <button className="continue-main" type="button" disabled={loading} onClick={next}>
              {loading ? "Opening…" : "GET LINK"}
            </button>
            {error && <p className="alert" role="alert">{error}</p>}
          </>
        ) : !revealed ? (
          <>
            <div className="timer-compact-label">Your wait is complete</div>
            <button className="continue-main" type="button" onClick={() => setRevealed(true)}>
              Continue
            </button>
          </>
        ) : (
          <p className="scroll-hint" role="status">Scroll down and tap Continue below.</p>
        )}
      </section>
      {children}
      {!final && ready && revealed && (
        <section className="bottom-continue" id="final-continue">
          <button className="continue-main" type="button" disabled={loading} onClick={next}>
            {loading ? "Opening…" : "CONTINUE TO NEXT STEP"}
          </button>
          {error && <p className="alert" role="alert">{error}</p>}
        </section>
      )}
    </>
  );
}
