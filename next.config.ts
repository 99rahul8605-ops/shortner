import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' }
      ] },
      { source: '/go/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'Cache-Control', value: 'private, no-store, max-age=0' }] },
      { source: '/s/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }] },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }, { key: 'Service-Worker-Allowed', value: '/' }] }
    ];
  }
};
export default nextConfig;
