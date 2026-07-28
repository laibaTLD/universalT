'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { OptimizedImage, IMAGE_SIZES } from '@/app/components/ui/OptimizedImage';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import type { Page } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { getPageHref } from '@/app/lib/siteContent';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { cn, getImageSrc } from '@/app/lib/utils';
import { tiptapToText } from '@/app/lib/seo';

interface AboutProps {
  about: unknown;
  className?: string;
}

type AboutFeature = NonNullable<Page['aboutSection']>['features'][number];

type AboutCta = { label: string; href: string };

type AboutSectionData = NonNullable<Page['aboutSection']>;

type AboutData = {
  title?: AboutSectionData['title'];
  description?: AboutSectionData['description'];
  features: AboutFeature[];
  image?: AboutSectionData['image'];
  cta?: AboutCta;
};

function normalizeImage(raw: unknown): AboutData['image'] | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string' && raw.trim()) {
    return { url: raw.trim() };
  }
  if (typeof raw === 'object' && raw !== null && 'url' in raw) {
    const record = raw as { url?: string; altText?: string };
    if (record.url?.trim()) {
      return { url: record.url.trim(), altText: record.altText };
    }
  }
  return undefined;
}

function normalizeHref(href: string): string {
  const t = href.trim();
  if (t.startsWith('http') || t.startsWith('mailto:') || t.startsWith('tel:')) return t;
  return t.startsWith('/') ? t : `/${t}`;
}

function resolveAboutCta(data: Record<string, unknown>): AboutCta | undefined {
  const primary = data.primaryCta as { label?: string; href?: string } | undefined;
  if (primary?.label?.trim()) {
    return {
      label: primary.label.trim(),
      href: normalizeHref(primary.href?.trim() || '/contact-us'),
    };
  }

  const primaryButton = data.primaryButton as { label?: string; href?: string } | undefined;
  if (primaryButton?.label?.trim()) {
    return {
      label: primaryButton.label.trim(),
      href: normalizeHref(primaryButton.href?.trim() || '/contact-us'),
    };
  }

  const legacy = data.ctaButton as {
    text?: string;
    url?: string;
    label?: string;
    href?: string;
  };
  const label = legacy?.text?.trim() || legacy?.label?.trim();
  if (label) {
    return {
      label,
      href: normalizeHref(legacy?.url?.trim() || legacy?.href?.trim() || '/contact-us'),
    };
  }

  const button = data.button as { label?: string; text?: string; href?: string; url?: string };
  const buttonLabel = button?.label?.trim() || button?.text?.trim();
  if (buttonLabel) {
    return {
      label: buttonLabel,
      href: normalizeHref(button?.href?.trim() || button?.url?.trim() || '/contact-us'),
    };
  }

  return undefined;
}

function normalizeAbout(about: unknown): AboutData | null {
  if (!about || typeof about !== 'object') return null;

  const data = about as Record<string, unknown>;
  if (data.enabled === false) return null;

  const features = Array.isArray(data.features)
    ? (data.features as AboutFeature[]).filter((f) => f?.label?.trim())
    : [];

  const title = data.title as AboutData['title'];
  const description = data.description as AboutData['description'];
  const image = normalizeImage(data.image);
  const cta = resolveAboutCta(data);

  if (!title && !description && !image && features.length === 0 && !cta) return null;

  return { title, description, features, image, cta };
}

function hasRichContent(content: unknown): boolean {
  if (content == null || content === '') return false;
  if (typeof content === 'object') return Boolean(tiptapToText(content));
  return Boolean(String(content).trim());
}

export const About: React.FC<AboutProps> = ({ about, className }) => {
  const theme = useSectionTheme();
  const { colors, fonts } = theme;
  const { pages } = useWebBuilder();

  const section = useMemo(() => normalizeAbout(about), [about]);

  const cta = useMemo((): AboutCta => {
    if (section?.cta) return section.cta;
    const contactPage = pages?.find((p) => p.pageType === 'contact');
    if (contactPage) {
      return { label: 'Contact Us', href: getPageHref(contactPage) };
    }
    return { label: 'Book Now', href: '/contact-us' };
  }, [section?.cta, pages]);

  const titleText = useMemo(() => tiptapToText(section?.title), [section?.title]);
  const imageSrc = useMemo(() => {
    const url = section?.image?.url;
    return url ? getImageSrc(url) : undefined;
  }, [section?.image?.url]);
  const imageAlt = section?.image?.altText?.trim() || titleText || 'About us';

  if (!section) return null;

  const showTitle = hasRichContent(section.title) || Boolean(titleText);
  const showDescription = hasRichContent(section.description);
  const borderColor = `color-mix(in srgb, ${colors.darkPrimaryText} 12%, transparent)`;
  const textColor = colors.darkPrimaryText;
  const subtextColor = colors.darkSecondaryText;

  return (
    <section
      className={cn('relative border-t wb-surface-lux', className)}
      style={{
        borderColor,
        fontFamily: fonts.body,
      }}
    >
      <div className="wb-surface-lux-inner mx-auto w-full max-w-[90rem] px-6 md:px-12 lg:px-16 xl:px-20 py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 xl:gap-20 lg:items-stretch">
          {/* Copy column — sets row height on desktop */}
          <div className="lg:col-span-5 flex flex-col justify-center order-1">
            <p
              className="text-[11px] font-medium uppercase tracking-[0.28em] mb-6"
              style={{ fontFamily: fonts.body }}
            >
              <span style={{ color: subtextColor }}>[ </span>
              <span style={{ color: textColor }}>About</span>
              <span style={{ color: subtextColor }}> ]</span>
            </p>

            {showTitle && (
              <h2
                className="text-[clamp(1.75rem,3.2vw,2.75rem)] font-normal leading-[1.12] tracking-tight"
                style={{ fontFamily: fonts.heading, color: textColor }}
              >
                {hasRichContent(section.title) ? (
                  <TiptapRenderer content={section.title} as="inline" />
                ) : (
                  titleText
                )}
              </h2>
            )}

            {showDescription && (
              <div
                className={cn(
                  'mt-6 text-base sm:text-lg font-light leading-relaxed max-w-md',
                  !showTitle && 'mt-0'
                )}
                style={{ color: subtextColor, fontFamily: fonts.body }}
              >
                <TiptapRenderer content={section.description} />
              </div>
            )}

            {!showDescription && tiptapToText(section.description) && (
              <p
                className="mt-6 text-base sm:text-lg font-light leading-relaxed max-w-md"
                style={{ color: subtextColor }}
              >
                {tiptapToText(section.description)}
              </p>
            )}

            <div className="mt-8 sm:mt-10">
              {cta.href.startsWith('http') ||
              cta.href.startsWith('mailto:') ||
              cta.href.startsWith('tel:') ? (
                <a
                  href={cta.href}
                  className="group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-xs font-medium uppercase tracking-[0.2em] transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: colors.primaryButton,
                    color: 'var(--wb-text-on-dark, #fff)',
                    fontFamily: fonts.body,
                  }}
                >
                  {cta.label}
                  <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </a>
              ) : (
                <Link
                  href={cta.href}
                  className="group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-xs font-medium uppercase tracking-[0.2em] transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: colors.primaryButton,
                    color: 'var(--wb-text-on-dark, #fff)',
                    fontFamily: fonts.body,
                  }}
                >
                  {cta.label}
                  <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Image — matches copy column height on lg+ */}
          {imageSrc && (
            <div className="lg:col-span-7 order-2 relative min-h-[260px] sm:min-h-[300px] lg:min-h-0 lg:h-auto">
              <div className="absolute inset-0 overflow-hidden rounded-sm">
                <OptimizedImage
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  sizes={IMAGE_SIZES.sectionWide}
                  className="object-cover"
                  priority={false}
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, transparent 50%, color-mix(in srgb, ${colors.primaryButton} 8%, transparent))`,
                  }}
                />
              </div>
            </div>
          )}

          {section.features.length > 0 && (
            <ul
              className={cn(
                'order-3 grid gap-8 sm:grid-cols-2 sm:gap-x-12 pt-8 sm:pt-10 lg:col-span-12',
                imageSrc && 'lg:mt-4'
              )}
              style={{ borderTop: `1px solid ${borderColor}` }}
            >
              {section.features.map((feature, index) => {
                const featureDesc = tiptapToText(feature.description);
                const number = String(index + 1).padStart(2, '0');

                return (
                  <li key={`${feature.label}-${index}`}>
                    <div className="flex gap-4 sm:gap-5">
                      <span
                        className="text-xs tabular-nums font-medium pt-1 shrink-0"
                        style={{ color: subtextColor, opacity: 0.55 }}
                      >
                        {number}
                      </span>
                      <div className="min-w-0">
                        <p
                          className="text-base sm:text-lg leading-snug"
                          style={{ fontFamily: fonts.heading, color: textColor }}
                        >
                          {feature.label.trim()}
                        </p>
                        {featureDesc && (
                          <p
                            className="mt-2 text-sm leading-relaxed"
                            style={{ color: subtextColor }}
                          >
                            {featureDesc}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default About;
