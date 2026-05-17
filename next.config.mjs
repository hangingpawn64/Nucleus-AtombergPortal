const imageRemotePatterns = [
  {
    protocol: "https",
    hostname: "lh3.googleusercontent.com",
  },
];

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    imageRemotePatterns.push({
      protocol: supabaseUrl.protocol.replace(":", ""),
      hostname: supabaseUrl.hostname,
      pathname: "/storage/v1/object/public/profile-avatars/**",
    });
  } catch {
    // Ignore invalid local configuration; the app handles missing Supabase config.
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: imageRemotePatterns,
  },
};

export default nextConfig;
