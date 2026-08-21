import { NextResponse } from 'next/server';
import { siteApi } from '@/app/lib/api';
import { getJsonLdGraph } from '@/app/lib/legal';

export async function GET() {
  const siteSlug = process.env.NEXT_PUBLIC_WEBBUILDER_SITE_SLUG;
  if (!siteSlug) {
    return NextResponse.json([], {
      headers: { 'Content-Type': 'application/ld+json' },
    });
  }

  try {
    const site = await siteApi.getSiteBySlug(siteSlug, { silent: true });
    return NextResponse.json(getJsonLdGraph(site), {
      headers: {
        'Content-Type': 'application/ld+json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch {
    return NextResponse.json([], {
      headers: { 'Content-Type': 'application/ld+json' },
    });
  }
}
