import Script from 'next/script';
import type { Site } from '@/app/lib/types';
import {
  extractGtmId,
  isGa4Id,
  isGoogleAdsId,
  isGtmId,
  looksLikeHtml,
  officialGtagConfigScript,
  officialGtmHeadScript,
  parseIntegrationHtml,
  resolveGa4,
  resolveGtmHead,
  type IntegrationHtmlNode,
} from '@/app/lib/integrations';

function passthroughAttrs(attrs: Record<string, string>): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'http-equiv') mapped.httpEquiv = value;
    else if (key === 'charset') mapped.charSet = value;
    else if (key === 'crossorigin') mapped.crossOrigin = value;
    else mapped[key] = value;
  }
  return mapped;
}

function HtmlNodes({ nodes, idPrefix }: { nodes: IntegrationHtmlNode[]; idPrefix: string }) {
  return (
    <>
      {nodes.map((node, index) => {
        const id = `${idPrefix}-${index}`;
        if (node.kind === 'script') {
          if (node.src) {
            return (
              <Script
                key={id}
                id={node.id || id}
                src={node.src}
                strategy="beforeInteractive"
                type={node.type}
              />
            );
          }
          if (!node.innerHTML) return null;
          return (
            <Script key={id} id={node.id || id} strategy="beforeInteractive">
              {node.innerHTML}
            </Script>
          );
        }
        if (node.kind === 'meta') {
          return <meta key={id} {...passthroughAttrs(node.attrs)} />;
        }
        if (node.kind === 'link') {
          return <link key={id} {...passthroughAttrs(node.attrs)} />;
        }
        return null;
      })}
    </>
  );
}

function HeadSnippet({ value, idPrefix }: { value: string; idPrefix: string }) {
  if (looksLikeHtml(value)) {
    return <HtmlNodes nodes={parseIntegrationHtml(value)} idPrefix={idPrefix} />;
  }
  if (/^https?:\/\//i.test(value)) {
    return <Script id={idPrefix} src={value} strategy="beforeInteractive" />;
  }
  return null;
}

function GtagLoader({ id, measurementId }: { id: string; measurementId: string }) {
  return (
    <>
      <Script
        id={`${id}-src`}
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="beforeInteractive"
      />
      <Script id={`${id}-config`} strategy="beforeInteractive">
        {officialGtagConfigScript(measurementId)}
      </Script>
    </>
  );
}

/**
 * Head-level Sitify Studio integrations. Search Console is emitted via
 * generateMetadata (`verification.google`), not here — nested meta tags fail verification.
 */
export function SiteHeadIntegrations({ site }: { site?: Site | null }) {
  if (!site) return null;

  const gtmHead = resolveGtmHead(site.integrations, site.seo);
  const ga4 = resolveGa4(site.integrations, site.seo);
  const googleAds = (site.integrations?.googleAds || '').trim();
  const googleMaps = (site.integrations?.googleMaps || '').trim();

  const gtmId = gtmHead && !looksLikeHtml(gtmHead) && isGtmId(gtmHead) ? gtmHead : extractGtmId(gtmHead);

  return (
    <>
      {gtmHead ? (
        looksLikeHtml(gtmHead) ? (
          <HeadSnippet value={gtmHead} idPrefix="sitify-gtm-head" />
        ) : gtmId ? (
          <Script id="sitify-gtm-head" strategy="beforeInteractive">
            {officialGtmHeadScript(gtmId)}
          </Script>
        ) : null
      ) : null}

      {ga4 ? (
        looksLikeHtml(ga4) ? (
          <HeadSnippet value={ga4} idPrefix="sitify-ga4" />
        ) : isGa4Id(ga4) ? (
          <GtagLoader id="sitify-ga4" measurementId={ga4} />
        ) : null
      ) : null}

      {googleAds ? (
        looksLikeHtml(googleAds) ? (
          <HeadSnippet value={googleAds} idPrefix="sitify-google-ads" />
        ) : isGoogleAdsId(googleAds) || isGa4Id(googleAds) ? (
          <GtagLoader id="sitify-google-ads" measurementId={googleAds} />
        ) : null
      ) : null}

      {googleMaps ? <HeadSnippet value={googleMaps} idPrefix="sitify-google-maps" /> : null}
    </>
  );
}

export function GtmNoscript({ html }: { html: string }) {
  if (!html.trim()) return null;
  return <noscript dangerouslySetInnerHTML={{ __html: html }} />;
}
