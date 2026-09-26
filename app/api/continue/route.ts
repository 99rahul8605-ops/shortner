import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import {
  readProgress,
  signProgress,
  progressCookieName,
  cookieOptions,
  correctOrigin,
} from "@/lib/auth";
import { getLink, getSettings, seconds } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!correctOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const progress = await readProgress();
  if (
    !progress ||
    progress.slug !== body.slug ||
    progress.step !== body.step ||
    progress.routeToken !== body.vt
  ) {
    return NextResponse.json({ error: "Session expired. Reopen your short link." }, { status: 403 });
  }

  const link = await getLink(progress.slug);
  if (!link || !link.enabled) return NextResponse.json({ error: "Link unavailable" }, { status: 404 });

  const settings = await getSettings();
  // Older sessions created on /go/4 started their last countdown at popupAt.
  const startedAt = progress.step === 4 && progress.startedAt <= 0
    ? progress.popupAt
    : progress.startedAt;
  const wait = seconds(settings, progress.step) * 1000;
  if (startedAt <= 0 || Date.now() - startedAt < wait) {
    return NextResponse.json({ error: "Countdown is not finished" }, { status: 429 });
  }

  if (progress.step === 4) {
    const response = NextResponse.json({ next: link.destination });
    response.cookies.delete(progressCookieName);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (progress.step < 1 || progress.step > 3) {
    return NextResponse.json({ error: "Invalid progress" }, { status: 403 });
  }

  const nextStep = progress.step + 1;
  const routeToken = randomBytes(24).toString("base64url");
  const isFinal = nextStep === 4;
  const nextProgress = await signProgress({
    ...progress,
    step: nextStep,
    // The final page has no ad popup; its ten-second countdown starts immediately.
    startedAt: isFinal ? Date.now() : 0,
    popupAt: Date.now(),
    routeToken,
  });
  const next = isFinal
    ? `/get/${encodeURIComponent(progress.slug)}?vt=${encodeURIComponent(routeToken)}`
    : `/go/${encodeURIComponent(progress.slug)}/${nextStep}?vt=${encodeURIComponent(routeToken)}`;

  const response = NextResponse.json({ next });
  response.cookies.set(progressCookieName, nextProgress, cookieOptions(1200));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
