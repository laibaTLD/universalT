import { siteApi } from '@/app/lib/api';

const EMPTY_SITEMAP =
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';

const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
};

export async function GET() {
  const siteSlug = process.env.NEXT_PUBLIC_WEBBUILDER_SITE_SLUG;
  if (!siteSlug) {
    return new Response(EMPTY_SITEMAP, { headers: XML_HEADERS });
  }

  try {
    const site = await siteApi.getSiteBySlug(siteSlug, { silent: true });
    const xml = (site?.files?.sitemap || '').trim();
    return new Response(xml || EMPTY_SITEMAP, { headers: XML_HEADERS });
  } catch {
    return new Response(EMPTY_SITEMAP, { headers: XML_HEADERS });
  }
}
