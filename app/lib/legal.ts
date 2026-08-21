import type { LegalPage, Site } from '@/app/lib/types';
import { getImageSrc } from '@/app/lib/utils';
import { getSiteOrigin } from '@/app/lib/seo';

export function parseTiptapContent(content: unknown): unknown {
  if (content == null) return null;
  if (typeof content !== 'string') return content;

  const trimmed = content.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function nodeHasVisibleContent(node: unknown): boolean {
  if (node == null) return false;
  if (typeof node === 'string') {
    const trimmed = node.trim();
    if (!trimmed) return false;
    if (/<[a-z][\s\S]*>/i.test(trimmed)) {
      return Boolean(trimmed.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').trim());
    }
    return true;
  }
  if (typeof node !== 'object') return false;

  const n = node as {
    type?: string;
    text?: unknown;
    attrs?: Record<string, unknown>;
    content?: unknown[];
  };

  if (typeof n.text === 'string' && n.text.trim()) return true;
  if (n.type === 'image' && (n.attrs?.src || n.attrs?.alt)) return true;
  if (n.type === 'horizontalRule' || n.type === 'table' || n.type === 'hardBreak') return true;
  if (Array.isArray(n.content) && n.content.some(nodeHasVisibleContent)) return true;
  return false;
}

/** True when a legal document has a real Tiptap/HTML/text body (empty docs 404). */
export function hasLegalBody(doc?: LegalPage | null): boolean {
  if (!doc) return false;
  return nodeHasVisibleContent(parseTiptapContent(doc.content));
}

export function parseSchemaArray(schemaJson?: string | null): unknown[] {
  const raw = (schemaJson || '').trim();
  if (!raw || raw === '[]') return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && typeof item === 'object');
    }
    if (parsed && typeof parsed === 'object') return [parsed];
    return [];
  } catch {
    return [];
  }
}

function fallbackJsonLd(site?: Site | null): unknown[] {
  if (!site) return [];

  const origin = getSiteOrigin();
  const nodes: unknown[] = [];
  const businessName = site.business?.name?.trim();

  if (businessName) {
    const logo = site.theme?.logoUrl ? getImageSrc(site.theme.logoUrl) : '';
    const logoUrl = logo && origin && logo.startsWith('/') ? `${origin}${logo}` : logo;
    const sameAs = (site.socialLinks || []).map((link) => link.url).filter(Boolean);

    nodes.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: businessName,
      ...(origin ? { url: origin } : {}),
      ...(logoUrl ? { logo: logoUrl } : {}),
      ...(site.business?.email || site.business?.phone
        ? {
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              ...(site.business.phone ? { telephone: site.business.phone } : {}),
              ...(site.business.email ? { email: site.business.email } : {}),
            },
          }
        : {}),
      ...(site.business?.address
        ? {
            address: {
              '@type': 'PostalAddress',
              streetAddress: site.business.address.street,
              addressLocality: site.business.address.city,
              addressRegion: site.business.address.state,
              postalCode: site.business.address.zipCode,
              addressCountry: site.business.address.country || 'US',
            },
          }
        : {}),
      ...(sameAs.length ? { sameAs } : {}),
    });
  }

  if (site.name || origin) {
    nodes.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name || businessName,
      ...(origin ? { url: origin } : {}),
      ...(site.seo?.description ? { description: site.seo.description } : {}),
    });
  }

  return nodes;
}

/** Prefer Studio `files.schemaJson`; otherwise keep the template’s Organization/WebSite schema. */
export function getJsonLdGraph(site?: Site | null): unknown[] {
  const fromStudio = parseSchemaArray(site?.files?.schemaJson);
  if (fromStudio.length) return fromStudio;
  return fallbackJsonLd(site);
}

export function normalizeLegalHref(href: string): string {
  const raw = (href || '').trim();
  if (!raw) return '';
  try {
    const path = raw.startsWith('http') ? new URL(raw).pathname : raw;
    return path.replace(/\/+$/, '').toLowerCase() || '/';
  } catch {
    return raw.replace(/\/+$/, '').toLowerCase() || '/';
  }
}
