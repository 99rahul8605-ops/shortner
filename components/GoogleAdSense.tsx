/** Google AdSense: only mount on reviewed, public content pages.
 * React 19 hoists async external scripts into the HTML <head> during SSR.
 * Do not mount in short-link step, countdown, admin, or login pages.
 */
export default function GoogleAdSense() {
  return (
    <script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4307435753931604"
      crossOrigin="anonymous"
    />
  );
}
