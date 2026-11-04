import type { MetadataRoute } from 'next';

const ORIGIN = 'https://lujian-video-guide-demo.caiyiwenann.chatgpt.site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${ORIGIN}/sitemap.xml`,
    host: ORIGIN,
  };
}
