import { siteApi } from '@/app/lib/api';
import { getSiteOrigin } from '@/app/lib/seo';

const TEXT_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
};

function fallbackRobots(): string {
  const origin = getSiteOrigin() || 'http://localhost:3000';
  return `User-Agent: *\nAllow: /\nDisallow: /api/\nDisallow: /_next/\nDisallow: /admin/\nDisallow: /private/\nSitemap: ${origin}/sitemap.xml\n`;
}

export async function GET() {
  const siteSlug = process.env.NEXT_PUBLIC_WEBBUILDER_SITE_SLUG;
  if (!siteSlug) {
    return new Response(fallbackRobots(), { headers: TEXT_HEADERS });
  }

  try {
    const site = await siteApi.getSiteBySlug(siteSlug, { silent: true });
    const body = (site?.files?.robotsTxt || '').trim();
    return new Response(body || fallbackRobots(), { headers: TEXT_HEADERS });
  } catch {
    return new Response(fallbackRobots(), { headers: TEXT_HEADERS });
  }
}
