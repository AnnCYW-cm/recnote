import type { MetadataRoute } from 'next';

const ORIGIN = 'https://lujian-video-guide-demo.caiyiwenann.chatgpt.site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: ORIGIN,
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
