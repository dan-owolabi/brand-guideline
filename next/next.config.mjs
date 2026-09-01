/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app lives in a subfolder alongside the Vite app; pin the tracing root
  // so Next doesn't infer a parent directory from stray lockfiles.
  outputFileTracingRoot: import.meta.dirname,
  // Assets are served from the R2 custom domain. Optimization is done by
  // Cloudflare via /cdn-cgi/image/ URL prefixes (see lib/imageOptimizer.js),
  // not by next/image — which also keeps us off Vercel's image-optimization
  // billing. The Supabase host stays listed until the storage backfill is
  // finished and old URLs stop appearing in brand content.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.guidr.space' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
