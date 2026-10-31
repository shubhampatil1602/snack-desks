import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables "use cache" for query results (see lib/cache-tags.ts)
  cacheComponents: true,
  experimental: {
    // Revisiting a page within 60s reuses it instead of refetching.
    // Server actions (revalidatePath/updateTag) and SSE refreshes clear it.
    staleTimes: {
      dynamic: 60,
    },
  },
};

export default nextConfig;
