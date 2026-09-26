"use client";

import { useEffect, useState } from "react";

/** This dialog is mounted ONLY by the public /go/[slug]/[step] page. */
export type PopupLabels = {
  title: string; intro: string; heading: string; description: string;
  orange: string; blue: string; middleNote: string;
};
export default function VisitorPopup({ directUrl, labels }: { directUrl: string | null; labels: PopupLabels }) {
  const [isOpen, setIsOpen] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(15);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="visitor-overlay" role="dialog" aria-modal="true" aria-labelledby="popup-heading">
      <div className="visitor-modal">
        <button
          type="button"
          className="modal-close"
          disabled={secondsLeft > 0}
          onClick={() => setIsOpen(false)}
          aria-label={secondsLeft > 0 ? `Close available in ${secondsLeft} seconds` : "Close popup"}
          title={secondsLeft > 0 ? `Available in ${secondsLeft}s` : "Close"}
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="modal-instructions" id="popup-heading">
          <strong>{labels.title}</strong>
          <p>{labels.intro}</p>
        </div>

        <div className="modal-body">
          <p className="popup-heading">{labels.heading}</p>
          <p className="popup-subheading">{labels.description}</p>
          {directUrl ? (
            <>
              <a
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="sponsor-button orange"
                aria-label="Open sponsored advertisement in a new tab"
              >
                {labels.orange} <span aria-hidden="true">↗</span>
              </a>
              <p className="popup-middle-note">{labels.middleNote}</p>
              <a
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="sponsor-button blue"
                aria-label="Explore sponsored advertisement in a new tab"
              >
                {labels.blue} <span aria-hidden="true">↗</span>
              </a>
            </>
          ) : (
            <div className="popup-no-ad">No sponsored links are configured yet.</div>
          )}
          <p className="close-countdown" aria-live="polite">
            {secondsLeft > 0
              ? `Close button available in ${secondsLeft} seconds`
              : "You can now close this popup to continue reading."}
          </p>
          <p className="popup-optional">You do not have to click an advertisement to access your link.</p>
        </div>
      </div>
    </div>
  );
}
