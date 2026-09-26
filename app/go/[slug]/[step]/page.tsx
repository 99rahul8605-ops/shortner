import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { readProgress } from "@/lib/auth";
import { getLink, getSettings, seconds } from "@/lib/data";
import { query } from "@/lib/db";
import { articles } from "@/lib/articles";
import VisitorMonetag from "@/components/VisitorMonetag";
import HilltopBanner from "@/components/HilltopBanner";
import VisitorPopup from "@/components/VisitorPopup";
import ContinueTimer from "@/components/ContinueTimer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DirectRow = { url: string };

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; step: string }>;
  searchParams: Promise<{ vt?: string }>;
}) {
  const { slug, step: raw } = await params;
  const { vt } = await searchParams;
  const step = Number(raw);

  if (!Number.isInteger(step) || step < 1 || step > 4 || !/^[a-z0-9_-]{3,40}$/.test(slug)) notFound();
  const link = await getLink(slug);
  if (!link || !link.enabled) notFound();

  const progress = await readProgress();
  if (!progress || progress.slug !== slug || progress.step !== step || progress.routeToken !== vt) {
    redirect(`/s/${encodeURIComponent(slug)}`);
  }

  // Old /go/slug/4 bookmarks are forwarded to the dedicated ad-free page.
  // Get Link is NOT a fourth article step.
  if (step === 4) {
    redirect(`/get/${encodeURIComponent(slug)}?vt=${encodeURIComponent(progress.routeToken)}`);
  }

  const [settings, directResult] = await Promise.all([
    getSettings(),
    query<DirectRow>("SELECT url FROM direct_links WHERE enabled=TRUE ORDER BY random() LIMIT 1"),
  ]);
  const article = articles[step - 1];
  if (!article) notFound();
  const adsEnabled = settings.ads_enabled === "true";
  const bannerTextAbove = settings.banner_text_above?.trim();
  const bannerTextBelow = settings.banner_text_below?.trim();

  return (
    <main className="reader-shell">
      <VisitorMonetag enabled={adsEnabled} />
      <VisitorPopup
        directUrl={directResult.rows[0]?.url || null}
        slug={slug}
        step={step}
        routeToken={progress.routeToken}
        required={progress.startedAt === 0}
        labels={{
          title: settings.popup_title,
          intro: settings.popup_intro,
          heading: settings.popup_heading,
          description: settings.popup_description,
          orange: settings.popup_orange_label,
          blue: settings.popup_blue_label,
          middleNote: settings.popup_middle_note,
        }}
      />
      <header className="reader-header">
        <Link href="/" className="reader-brand">BingoLink</Link>
        <span className="reader-step">Step {step} of 3</span>
      </header>
      <div className="reader-page">
        <div className="reader-lead">
          <span className="reader-category">{article.tag}</span>
          <h1>{article.title}</h1>
          <p>{article.intro}</p>
        </div>
        <figure className="article-figure">
          <img src={article.cover} alt={article.coverAlt} loading="eager" />
          <figcaption>Illustrative photograph</figcaption>
        </figure>
        <div className="banner-message-group">
          {bannerTextAbove && <div className="banner-text-box">{bannerTextAbove}</div>}
          {adsEnabled && (
            <div className="ad-placement ad-placement-compact">
              <span>ADVERTISEMENT</span>
              <HilltopBanner enabled slot="top" />
            </div>
          )}
          {bannerTextBelow && <div className="banner-text-box">{bannerTextBelow}</div>}
        </div>
        <article className="long-article">
          <ContinueTimer
            slug={slug}
            step={step}
            routeToken={progress.routeToken}
            startedAt={progress.startedAt}
            seconds={seconds(settings, step)}
          >
            {adsEnabled && (
              <div className="article-banner-stack">
                <div className="ad-placement ad-placement-compact">
                  <span>ADVERTISEMENT</span>
                  <HilltopBanner enabled slot="below-timer" />
                </div>
              </div>
            )}
            <p className="article-intro">
              {article.intro} This guide is for general information; confirm requirements, costs,
              and deadlines with official providers before making decisions.
            </p>
            {article.sections.map(([heading, body], i) => (
              <div key={heading}>
                <section className="article-section"><h2>{heading}</h2><p>{body}</p></section>
                {i === 1 && (
                  <figure className="article-figure inline-figure">
                    <img src={article.inline} alt={article.inlineAlt} loading="lazy" />
                    <figcaption>Related image</figcaption>
                  </figure>
                )}
              </div>
            ))}
            {adsEnabled && (
              <div className="article-banner-stack" aria-label="Bottom advertisements">
                <div className="ad-placement ad-placement-compact">
                  <span>ADVERTISEMENT</span>
                  <HilltopBanner enabled slot="bottom-one" />
                </div>
                <div className="ad-placement ad-placement-compact">
                  <span>ADVERTISEMENT</span>
                  <HilltopBanner enabled slot="bottom-two" />
                </div>
              </div>
            )}
          </ContinueTimer>
        </article>
      </div>
      <footer className="reader-footer">
        <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · Advertisements are optional
      </footer>
    </main>
  );
}
