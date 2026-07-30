'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { OptimizedImage, IMAGE_QUALITY_HIGH, IMAGE_SIZES } from '@/app/components/ui/OptimizedImage';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import type { Page } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { getPageHref } from '@/app/lib/siteContent';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { useScrollAnimation } from '@/app/hooks/useScrollAnimation';
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

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

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

  const cta = useMemo((): AboutCta | null => {
    if (section?.cta) return section.cta;
    if (!section?.title && !section?.description) return null;
    const contactPage = pages?.find((p) => p.pageType === 'contact');
    if (contactPage) {
      return { label: 'Contact Us', href: getPageHref(contactPage) };
    }
    return { label: 'Book Now', href: '/contact-us' };
  }, [section?.cta, section?.title, section?.description, pages]);

  const titleText = useMemo(() => tiptapToText(section?.title), [section?.title]);
  const descriptionText = useMemo(
    () => tiptapToText(section?.description),
    [section?.description]
  );
  const imageSrc = useMemo(() => {
    const url = section?.image?.url;
    return url ? getImageSrc(url) : undefined;
  }, [section?.image?.url]);
  const imageAlt = section?.image?.altText?.trim() || titleText || 'About us';

  const { ref: triggerRef, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.12,
  });
  const loaded = isVisible;

  if (!section) return null;

  const showTitle = hasRichContent(section.title) || Boolean(titleText);
  const showDescription = hasRichContent(section.description) || Boolean(descriptionText);
  const borderColor = `color-mix(in srgb, ${colors.mainText} 12%, transparent)`;
  const isExternal =
    !!cta &&
    (cta.href.startsWith('http') || cta.href.startsWith('mailto:') || cta.href.startsWith('tel:'));

  const fade = (delay: string) =>
    ({
      opacity: loaded ? 1 : 0,
      transform: loaded ? 'translateY(0)' : 'translateY(18px)',
      transition: `opacity 0.75s ${EASE}, transform 0.75s ${EASE}`,
      transitionDelay: delay,
    }) as React.CSSProperties;

  const ctaButtonClass =
    'group inline-flex items-center gap-2 px-8 py-3.5 text-xs font-medium uppercase tracking-[0.18em] transition-opacity duration-300 hover:opacity-90';

  const ctaButton = cta ? (
    isExternal ? (
      <a
        href={cta.href}
        className={ctaButtonClass}
        style={{
          backgroundColor: colors.primaryButton,
          color: 'var(--wb-text-on-dark, #fff)',
          fontFamily: fonts.body,
        }}
      >
        {cta.label}
        <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>
          →
        </span>
      </a>
    ) : (
      <Link
        href={cta.href}
        className={ctaButtonClass}
        style={{
          backgroundColor: colors.primaryButton,
          color: 'var(--wb-text-on-dark, #fff)',
          fontFamily: fonts.body,
        }}
      >
        {cta.label}
        <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>
          →
        </span>
      </Link>
    )
  ) : null;

  return (
    <section
      className={cn('relative overflow-hidden border-t', className)}
      style={{
        backgroundColor: colors.pageBackground,
        borderColor,
        fontFamily: fonts.body,
      }}
    >
      {/* Full-bleed image */}
      {imageSrc && (
        <div className="relative h-[42vw] min-h-[220px] max-h-[420px] w-full overflow-hidden">
          <OptimizedImage
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes={IMAGE_SIZES.fullWidth}
            quality={IMAGE_QUALITY_HIGH}
            className="object-cover object-center"
            priority={false}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(
                to bottom,
                transparent 45%,
                color-mix(in srgb, ${colors.pageBackground} 55%, transparent) 78%,
                ${colors.pageBackground} 100%
              )`,
            }}
            aria-hidden
          />
        </div>
      )}

      <div
        ref={triggerRef}
        className={cn(
          'mx-auto w-full max-w-[90rem] px-6 text-center md:px-12 lg:px-16 xl:px-20',
          imageSrc ? 'pb-16 pt-2 sm:pb-20 lg:pb-24' : 'py-16 sm:py-20 lg:py-24'
        )}
      >
        <div className="mx-auto max-w-2xl">
          {showTitle && (
            <h2
              className="text-[clamp(1.35rem,2.2vw,1.875rem)] font-normal leading-[1.25] tracking-tight"
              style={{
                fontFamily: fonts.heading,
                color: colors.mainText,
                ...fade('0.05s'),
              }}
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
                'mx-auto mt-5 text-base font-light leading-relaxed sm:mt-6 sm:text-lg',
                !showTitle && 'mt-0'
              )}
              style={{ color: colors.secondaryText, ...fade('0.15s') }}
            >
              <TiptapRenderer content={section.description} />
            </div>
          )}

          {showDescription && !hasRichContent(section.description) && descriptionText && (
            <p
              className={cn(
                'mx-auto mt-5 text-base font-light leading-relaxed sm:mt-6 sm:text-lg',
                !showTitle && 'mt-0'
              )}
              style={{ color: colors.secondaryText, ...fade('0.15s') }}
            >
              {descriptionText}
            </p>
          )}

          {ctaButton && section.features.length === 0 && (
            <div className="mt-8 flex justify-center sm:mt-10" style={fade('0.28s')}>
              {ctaButton}
            </div>
          )}
        </div>

        {section.features.length > 0 && (
          <ul
            className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-0 border-t sm:mt-14 sm:grid-cols-2 lg:mt-16"
            style={{ borderColor, ...fade('0.22s') }}
          >
            {section.features.map((feature, index) => {
              const featureDesc = tiptapToText(feature.description);
              const number = String(index + 1).padStart(2, '0');
              const odd = index % 2 === 0;

              return (
                <li
                  key={`${feature.label}-${index}`}
                  className={cn(
                    'border-b px-4 py-8 text-left sm:px-8 sm:py-9',
                    odd ? 'sm:border-r' : ''
                  )}
                  style={{ borderColor }}
                >
                  <div className="flex gap-4">
                    <span
                      className="shrink-0 pt-0.5 text-[11px] font-medium tabular-nums tracking-wider"
                      style={{ color: colors.primaryButton }}
                    >
                      {number}
                    </span>
                    <div className="min-w-0">
                      <p
                        className="text-base leading-snug sm:text-[1.0625rem]"
                        style={{ fontFamily: fonts.heading, color: colors.mainText }}
                      >
                        {feature.label.trim()}
                      </p>
                      {featureDesc && (
                        <p
                          className="mt-2 text-sm leading-relaxed"
                          style={{ color: colors.secondaryText }}
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

        {ctaButton && section.features.length > 0 && (
          <div className="mt-10 flex justify-center sm:mt-12" style={fade('0.32s')}>
            {ctaButton}
          </div>
        )}
      </div>
    </section>
  );
};

export default About;
