import Link from 'next/link';
import type {ReactNode} from 'react';

export default function PublicShell({children,wide=false}:{children:ReactNode;wide?:boolean}){
 return <div className="site-shell"><header className="site-header"><div className="site-container site-header-inner">
  <Link className="site-brand" href="/"><span className="site-brand-symbol">↗</span><span>Bingo<b>Link</b></span></Link>
  <nav className="site-nav" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/developers">Developers</Link><Link href="/report">Report abuse</Link></nav>
  <div className="site-header-actions"><Link href="/login" className="site-link-button">Sign in</Link><Link href="/register" className="site-solid-button">Get started <span aria-hidden="true">↗</span></Link></div>
 </div></header><main className={wide?'site-content site-container':'site-content site-container site-content-narrow'}>{children}</main>
 <footer className="site-footer"><div className="site-container site-footer-inner"><div><Link href="/" className="site-footer-brand">↗ BingoLink</Link><p>Better links. Clearer insights.</p></div><nav aria-label="Footer navigation"><Link href="/developers">API docs</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/report">Report abuse</Link><Link href="/admin/login">Admin</Link></nav><small>© {new Date().getFullYear()} BingoLink</small></div></footer>
 </div>;
}
