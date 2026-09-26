import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { readProgress } from "@/lib/auth";
import { getLink, getSettings, seconds } from "@/lib/data";
import ContinueTimer from "@/components/ContinueTimer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Get Link | BingoLink",
  robots: { index: false, follow: false },
};

export default async function GetLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ vt?: string }>;
}) {
  const { slug } = await params;
  const { vt } = await searchParams;
  if (!/^[a-z0-9_-]{3,40}$/.test(slug)) notFound();

  const link = await getLink(slug);
  if (!link || !link.enabled) notFound();

  const progress = await readProgress();
  if (!progress || progress.slug !== slug || progress.step !== 4 || progress.routeToken !== vt) {
    redirect(`/s/${encodeURIComponent(slug)}`);
  }

  const settings = await getSettings();
  // Accept an already-running legacy final session created by the older /go/4 route.
  const finalStart = progress.startedAt > 0 ? progress.startedAt : progress.popupAt;

  return (
    <main className="reader-shell">
      <header className="reader-header">
        <Link href="/" className="reader-brand">BingoLink</Link>
        <span className="reader-step">Get Link</span>
      </header>
      <div className="reader-page">
        <div className="reader-lead" style={{ textAlign: "center" }}>
          <span className="reader-category">ALL ARTICLES COMPLETED</span>
          <h1>Your link is almost ready</h1>
          <p>Wait for the final countdown, then use Get Link to open your destination.</p>
        </div>
        <div className="final-info" style={{ textAlign: "center" }}>
          <ContinueTimer
            final
            slug={slug}
            step={4}
            routeToken={progress.routeToken}
            startedAt={finalStart}
            seconds={seconds(settings, 4)}
          />
        </div>
      </div>
      <footer className="reader-footer">
        <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
      </footer>
    </main>
  );
}
