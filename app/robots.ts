import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/onboarding', '/login', '/signup', '/forgot-password', '/reset-password', '/api'],
      },
    ],
    sitemap: 'https://stratly.fr/sitemap.xml',
  }
}
