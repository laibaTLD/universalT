'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { OptimizedImage, IMAGE_QUALITY_HIGH, IMAGE_SIZES } from '@/app/components/ui/OptimizedImage';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { getPageHref } from '@/app/lib/siteContent';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { cn, getImageSrc } from '@/app/lib/utils';
import { tiptapToText } from '@/app/lib/seo';

interface CTAProps {
  cta: unknown;
  className?: string;
}

type CtaButton = { label: string; href: string };

type NormalizedCta = {
  title?: unknown;
  description?: unknown;
  subtitle?: unknown;
  primaryButton?: CtaButton;
  backgroundImage?: string;
};

function normalizeHref(href: string): string {
  const t = href.trim();
  if (t.startsWith('http') || t.startsWith('mailto:') || t.startsWith('tel:')) return t;
  return t.startsWith('/') ? t : `/${t}`;
}

function resolveMediaUrl(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed ? getImageSrc(trimmed) : undefined;
  }
  if (typeof raw === 'object' && raw !== null && 'url' in raw) {
    const url = (raw as { url?: string }).url?.trim();
    return url ? getImageSrc(url) : undefined;
  }
  return undefined;
}

function resolveBackgroundImage(cta: Record<string, unknown>): string | undefined {
  const mediaItems = Array.isArray(cta.mediaItems) ? cta.mediaItems : [];

  const candidates: unknown[] = [
    cta.backgroundImage,
    cta.image,
    mediaItems[0],
    (mediaItems[0] as { url?: string } | undefined)?.url,
  ];

  for (const candidate of candidates) {
    const src = resolveMediaUrl(candidate);
    if (src) return src;
  }

  return undefined;
}

function resolvePrimaryButton(cta: Record<string, unknown>): CtaButton | undefined {
  const primary = cta.primaryButton as { label?: string; href?: string } | undefined;
  if (primary?.label?.trim()) {
    return {
      label: primary.label.trim(),
      href: normalizeHref(primary.href?.trim() || '/contact-us'),
    };
  }

  const legacy = cta.ctaButton as { text?: string; url?: string; label?: string; href?: string } | undefined;
  const label = legacy?.text?.trim() || legacy?.label?.trim();
  if (label) {
    return {
      label,
      href: normalizeHref(legacy?.url?.trim() || legacy?.href?.trim() || '/contact-us'),
    };
  }

  return undefined;
}

function normalizeCtaSection(cta: unknown): NormalizedCta | null {
  if (!cta || typeof cta !== 'object') return null;

  const data = cta as Record<string, unknown>;
  if (data.enabled === false) return null;

  const primaryButton = resolvePrimaryButton(data);
  const backgroundImage = resolveBackgroundImage(data);
  const title = data.title;
  const description = data.description;
  const subtitle = data.subtitle ?? data.label;

  if (!title && !description && !primaryButton && !subtitle) return null;

  return {
    title,
    description,
    subtitle,
    primaryButton,
    backgroundImage,
  };
}

function hasRichContent(content: unknown): boolean {
  if (content == null || content === '') return false;
  if (typeof content === 'object') return Boolean(tiptapToText(content));
  return Boolean(String(content).trim());
}

/** Service area CTA — full-bleed image, dark overlay, content stacked on top. */
export const CTA: React.FC<CTAProps> = ({ cta, className }) => {
  const theme = useSectionTheme();
  const { colors, fonts } = theme;
  const { pages } = useWebBuilder();

  const section = useMemo(() => normalizeCtaSection(cta), [cta]);

  const titleText = useMemo(() => tiptapToText(section?.title), [section?.title]);
  const descriptionText = useMemo(
    () => tiptapToText(section?.description),
    [section?.description]
  );
  const subtitleText = useMemo(() => tiptapToText(section?.subtitle), [section?.subtitle]);

  const ctaLabel = section?.primaryButton?.label?.trim() || 'Contact Us';
  const ctaHref = useMemo(() => {
    if (section?.primaryButton?.href) return section.primaryButton.href;
    const contactPage = pages?.find((p) => p.pageType === 'contact');
    return contactPage ? getPageHref(contactPage) : '/contact-us';
  }, [section?.primaryButton?.href, pages]);

  if (!section) return null;

  const showTitle = hasRichContent(section.title) || Boolean(titleText);
  const showDescription = hasRichContent(section.description) || Boolean(descriptionText);
  const showSubtitle = hasRichContent(section.subtitle) || Boolean(subtitleText);
  const bgImage = section.backgroundImage;
  const isExternal =
    ctaHref.startsWith('http') || ctaHref.startsWith('mailto:') || ctaHref.startsWith('tel:');

  const button = (
    <span
      className="inline-flex items-center gap-2 border px-7 py-3.5 text-xs font-medium uppercase tracking-[0.18em] transition-colors duration-300"
      style={{
        borderColor: 'rgba(255,255,255,0.85)',
        color: '#fff',
        fontFamily: fonts.body,
        backgroundColor: 'transparent',
      }}
    >
      {ctaLabel}
      <span aria-hidden>→</span>
    </span>
  );

  return (
    <section
      className={cn('relative isolate overflow-hidden border-t', className)}
      style={{
        borderColor: `color-mix(in srgb, ${colors.mainText} 12%, transparent)`,
        fontFamily: fonts.body,
      }}
    >
      {/* Background image */}
      <div className="absolute inset-0 -z-20">
        {bgImage ? (
          <OptimizedImage
            src={bgImage}
            alt=""
            fill
            className="object-cover"
            sizes={IMAGE_SIZES.fullWidth}
            quality={IMAGE_QUALITY_HIGH}
            priority={false}
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: colors.mainText }} />
        )}
      </div>

      {/* Overlay opacity on image */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: bgImage
            ? `linear-gradient(
                to bottom,
                color-mix(in srgb, ${colors.mainText} 72%, transparent) 0%,
                color-mix(in srgb, ${colors.mainText} 78%, transparent) 55%,
                color-mix(in srgb, ${colors.mainText} 88%, transparent) 100%
              )`
            : `color-mix(in srgb, ${colors.mainText} 92%, transparent)`,
        }}
        aria-hidden
      />

      {/* Content on top */}
      <div className="relative mx-auto flex w-full max-w-[90rem] flex-col items-center justify-center px-6 py-20 text-center sm:py-24 md:px-12 lg:min-h-[28rem] lg:px-16 lg:py-28 xl:px-20">
        <div className="mx-auto max-w-2xl">
          <p
            className="mb-6 text-[11px] font-medium uppercase tracking-[0.28em]"
            style={{ fontFamily: fonts.body, color: 'rgba(255,255,255,0.65)' }}
          >
            <span>[ </span>
            <span style={{ color: '#fff' }}>
              {showSubtitle && hasRichContent(section.subtitle) ? (
                <TiptapRenderer content={section.subtitle} as="inline" />
              ) : (
                subtitleText || 'Get Started'
              )}
            </span>
            <span> ]</span>
          </p>

          {showTitle && (
            <h2
              className="text-[clamp(1.4rem,2.5vw,2rem)] font-normal leading-[1.2] tracking-tight text-white"
              style={{ fontFamily: fonts.heading }}
            >
              {hasRichContent(section.title) ? (
                <TiptapRenderer content={section.title} as="inline" />
              ) : (
                titleText
              )}
            </h2>
          )}

          {showDescription && hasRichContent(section.description) && (
            <div
              className={cn(
                'mx-auto mt-5 max-w-xl text-base font-light leading-relaxed sm:text-lg',
                !showTitle && 'mt-0'
              )}
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
              <TiptapRenderer content={section.description} />
            </div>
          )}

          {showDescription && !hasRichContent(section.description) && descriptionText && (
            <p
              className={cn(
                'mx-auto mt-5 max-w-xl text-base font-light leading-relaxed sm:text-lg',
                !showTitle && 'mt-0'
              )}
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
              {descriptionText}
            </p>
          )}

          <div className="mt-8 flex justify-center sm:mt-10">
            {isExternal ? (
              <a
                href={ctaHref}
                className="group inline-block [&_span]:group-hover:bg-white [&_span]:group-hover:text-[color:var(--cta-hover-text)]"
                style={{ ['--cta-hover-text' as string]: colors.mainText }}
              >
                {button}
              </a>
            ) : (
              <Link
                href={ctaHref}
                className="group inline-block [&_span]:group-hover:bg-white [&_span]:group-hover:text-[color:var(--cta-hover-text)]"
                style={{ ['--cta-hover-text' as string]: colors.mainText }}
              >
                {button}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
