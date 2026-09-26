import LoginForm from '@/components/LoginForm';
import PublicShell from '@/components/PublicShell';
export default function Login(){return <PublicShell><div className="site-centered-page"><div className="site-page-icon">◈</div><span className="site-overline">SECURE OWNER ACCESS</span><h1>Admin sign in</h1><p className="site-lead">Access your BingoLink management workspace.</p><section className="site-form-card"><LoginForm/><div className="site-card-links"><a href="/">← Back to website</a></div></section></div></PublicShell>}
