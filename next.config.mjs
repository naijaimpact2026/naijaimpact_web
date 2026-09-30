/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Increase body size limit for the upload API route (videos up to 500 MB)
    serverActions: {
      bodySizeLimit: '550mb',
    },
    // Client Router Cache retention for dynamic routes — default is 0, which
    // means revisiting any tab (Feed, Market, Learn, ...) always refetches
    // from the server even seconds after leaving it. 30s lets a quick
    // tab-switch reuse the cached render instead. Any router.refresh() call
    // (used throughout after mutations) still bypasses this correctly.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      // Cloudinary
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      // Unsplash
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Picsum — seed placeholder images on nm_listing_images
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      // Supabase Storage — plain public object URL
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Supabase Storage — render/transform URL (requires bucket transform policy)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/render/image/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/**',
      },
    ],
  },
}

export default nextConfig
