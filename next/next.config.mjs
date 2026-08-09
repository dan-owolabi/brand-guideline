/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app lives in a subfolder alongside the Vite app; pin the tracing root
  // so Next doesn't infer a parent directory from stray lockfiles.
  outputFileTracingRoot: import.meta.dirname,
  // Supabase storage serves public assets from its own domain; allow plain <img>
  // usage without next/image optimization complaints.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
