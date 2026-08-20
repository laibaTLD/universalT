import type { Metadata } from 'next';
import { Page, Site, Service, BlogPost, ServiceAreaPage } from './types';
import { getImageSrc } from './utils';
import { extractGoogleVerificationToken } from './integrations';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImageUrl?: string;
  noIndex?: boolean;
}

function resolveApiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';
  if (!raw) return '';
  try {
    const withApi = /\/api$/i.test(raw) ? raw : `${raw}/api`;
    return new URL(withApi).origin;
  } catch {
    return '';
  }
}

/** Absolute builder favicon URL (never site-relative `/api/uploads/...`). */
export function getSiteFaviconUrl(site?: Site | null): string | undefined {
  const rawValue = site?.seo?.faviconUrl as string | { url?: string } | undefined;
  const raw =
    typeof rawValue === 'string'
      ? rawValue.trim()
      : typeof rawValue?.url === 'string'
        ? rawValue.url.trim()
        : '';
  if (!raw) return undefined;

  const src = getImageSrc(raw);
  if (!src) return undefined;

  if (/^https?:\/\//i.test(src)) {
    return src.replace(/^http:\/\//i, 'https://');
  }

  const origin = resolveApiOrigin();
  if (!origin) return undefined;

  if (src.startsWith('/')) return `${origin}${src}`;
  return `${origin}/${src}`;
}

export function getFaviconMimeType(url?: string): string | undefined {
  if (!url) return undefined;
  const lower = url.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg';
  if (lower.includes('.svg')) return 'image/svg+xml';
  if (lower.includes('.ico')) return 'image/x-icon';
  if (lower.includes('.webp')) return 'image/webp';
  return undefined;
}

/** Metadata icons — same-origin proxy first (works even when /api uploads are remote). */
export function buildFaviconMetadata(site?: Site | null): Metadata['icons'] | undefined {
  const absolute = getSiteFaviconUrl(site);
  if (!absolute) return undefined;
  const type = getFaviconMimeType(absolute);
  return {
    icon: [
      { url: '/api/favicon', type },
      { url: '/favicon.ico', type },
      { url: absolute, type },
    ],
    shortcut: [{ url: '/api/favicon', type }],
    apple: [{ url: '/api/favicon', type }],
  };
}

export function generateMetadata(seoData: SEOData, site?: Site): Metadata {
  const { title, description, keywords, ogImageUrl, noIndex } = seoData;

  const siteName = site?.business?.name || site?.name || 'Web Builder Site';
  const finalTitle = title ? `${title} | ${siteName}` : siteName;

  const metadata: Metadata = {
    title: finalTitle,
    description: description || site?.business?.description || 'Generated site using Web Builder',
    keywords: keywords?.join(', ') || site?.seo?.keywords?.join(', '),
  };

  const icons = buildFaviconMetadata(site);
  if (icons) metadata.icons = icons;

  if (ogImageUrl || site?.seo?.ogImageUrl) {
    metadata.openGraph = {
      title: finalTitle,
      description: description || site?.business?.description || 'Generated site using Web Builder',
      images: [
        {
          url: ogImageUrl || site?.seo?.ogImageUrl || '',
          width: 1200,
          height: 630,
          alt: finalTitle,
        },
      ],
    };
  }

  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    };
  }

  const googleToken = extractGoogleVerificationToken(site?.integrations?.searchConsoleVerification);
  if (googleToken) {
    metadata.verification = { google: googleToken };
  }

  return metadata;
}

export function getPageSeoData(page: Page | ServiceAreaPage): SEOData {
  return {
    title: page.seo?.title,
    description: page.seo?.description,
    keywords: page.seo?.keywords,
    ogImageUrl: page.seo?.ogImageUrl,
    noIndex: page.seo?.noIndex,
  };
}

export function getServiceSeoData(service: Service): SEOData {
  return {
    title: service.seo?.title || service.name,
    description: service.seo?.description,
    keywords: service.seo?.keywords,
    ogImageUrl: service.seo?.ogImageUrl,
    noIndex: false,
  };
}

export function getBlogPostSeoData(blogPost: BlogPost): SEOData {
  return {
    title: blogPost.seo?.title || blogPost.title,
    description: blogPost.seo?.description || blogPost.excerpt,
    keywords: blogPost.seo?.keywords,
    ogImageUrl: blogPost.seo?.ogImageUrl || blogPost.featuredImage?.url,
    noIndex: false,
  };
}

export function getSiteSeoData(site: Site): SEOData {
  return {
    title: site.seo?.title,
    description: site.seo?.description,
    keywords: site.seo?.keywords,
    ogImageUrl: site.seo?.ogImageUrl,
    noIndex: false,
  };
}
