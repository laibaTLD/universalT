import type { Site, SiteIntegrations } from '@/app/lib/types';

export type IntegrationHtmlNode =
  | {
      kind: 'script';
      src?: string;
      async?: boolean;
      defer?: boolean;
      type?: string;
      id?: string;
      innerHTML: string;
    }
  | { kind: 'noscript'; innerHTML: string }
  | { kind: 'meta'; attrs: Record<string, string> }
  | { kind: 'link'; attrs: Record<string, string> };

function trimValue(value?: string | null): string {
  return (value || '').trim();
}

export function isNonEmptyIntegration(value?: string | null): boolean {
  return trimValue(value).length > 0;
}

export function looksLikeHtml(value: string): boolean {
  return /<[a-z!?/]/i.test(value);
}

export function isGa4Id(value: string): boolean {
  return /^G-[A-Z0-9]+$/i.test(value.trim());
}

export function isGtmId(value: string): boolean {
  return /^GTM-[A-Z0-9]+$/i.test(value.trim());
}

export function isGoogleAdsId(value: string): boolean {
  return /^AW-[0-9]+$/i.test(value.trim());
}

function parseAttrs(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([:@\w.-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attrStr))) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return attrs;
}

/** Split admin-authored HTML into script / noscript / meta / link nodes (order preserved). */
export function parseIntegrationHtml(html: string): IntegrationHtmlNode[] {
  const nodes: IntegrationHtmlNode[] = [];
  const trimmed = html.trim();
  if (!trimmed) return nodes;

  const tokenRe =
    /<script\b([^>]*)>([\s\S]*?)<\/script>|<noscript\b([^>]*)>([\s\S]*?)<\/noscript>|<meta\b([^>]*)\/?\s*>|<link\b([^>]*)\/?\s*>/gi;

  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(trimmed))) {
    const raw = match[0];
    const lower = raw.toLowerCase();
    if (lower.startsWith('<script')) {
      const attrs = parseAttrs(match[1] || '');
      nodes.push({
        kind: 'script',
        src: attrs.src || undefined,
        async: Object.prototype.hasOwnProperty.call(attrs, 'async'),
        defer: Object.prototype.hasOwnProperty.call(attrs, 'defer'),
        type: attrs.type || undefined,
        id: attrs.id || undefined,
        innerHTML: (match[2] || '').trim(),
      });
    } else if (lower.startsWith('<noscript')) {
      nodes.push({ kind: 'noscript', innerHTML: (match[4] || '').trim() });
    } else if (lower.startsWith('<meta')) {
      nodes.push({ kind: 'meta', attrs: parseAttrs(match[5] || '') });
    } else if (lower.startsWith('<link')) {
      nodes.push({ kind: 'link', attrs: parseAttrs(match[6] || '') });
    }
  }

  return nodes;
}

export function extractGoogleVerificationToken(value?: string | null): string | undefined {
  const v = trimValue(value);
  if (!v) return undefined;

  const fromContent = v.match(/content\s*=\s*["']([^"']+)["']/i);
  if (fromContent?.[1]) return fromContent[1].trim();

  const fromUnquoted = v.match(/google-site-verification[^>]*content\s*=\s*([^\s>]+)/i);
  if (fromUnquoted?.[1]) return fromUnquoted[1].replace(/["']/g, '').trim();

  if (!looksLikeHtml(v)) return v;
  return undefined;
}

export function extractGtmId(value?: string | null): string | undefined {
  const v = trimValue(value);
  if (!v) return undefined;
  if (isGtmId(v)) return v;
  return v.match(/GTM-[A-Z0-9]+/i)?.[0];
}

/**
 * Prefer integrations.ga4; fall back to legacy seo.gaId only when integrations.ga4 is empty.
 * Do not combine both — that would double-load GA.
 */
export function resolveGa4(integrations?: SiteIntegrations | null, seo?: Site['seo']): string {
  const fromIntegrations = trimValue(integrations?.ga4);
  if (fromIntegrations) return fromIntegrations;
  return trimValue(seo?.gaId);
}

/**
 * Prefer integrations.gtmHead; fall back to legacy seo.gtmId only when integrations.gtmHead is empty.
 */
export function resolveGtmHead(integrations?: SiteIntegrations | null, seo?: Site['seo']): string {
  const fromIntegrations = trimValue(integrations?.gtmHead);
  if (fromIntegrations) return fromIntegrations;
  return trimValue(seo?.gtmId);
}

export function getGtmNoscriptInnerHtml(site?: Site | null): string {
  if (!site) return '';

  const fromBody = trimValue(site.integrations?.gtmBody);
  if (fromBody) {
    const wrapped = fromBody.match(/<noscript\b[^>]*>([\s\S]*?)<\/noscript>/i);
    return (wrapped?.[1] ?? fromBody).trim();
  }

  const gtmHead = resolveGtmHead(site.integrations, site.seo);
  const id = extractGtmId(gtmHead);
  if (!id) return '';

  return `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
}

export function officialGtmHeadScript(gtmId: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`;
}

export function officialGtagConfigScript(measurementId: string): string {
  return `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');`;
}
