import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.flycargolanka.lk';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/payment/', '/profile/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
