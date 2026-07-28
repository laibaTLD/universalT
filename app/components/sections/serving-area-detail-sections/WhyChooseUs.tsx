'use client';

import { useMemo } from 'react';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import type { Page } from '@/app/lib/types';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { cn } from '@/app/lib/utils';
import { tiptapToText } from '@/app/lib/seo';

interface WhyChooseUsProps {
  whyChooseUs: unknown;
  className?: string;
}

type ReasonItem = {
  title?: unknown;
  description?: unknown;
  titleText: string;
  descriptionText: string;
};

type SectionData = {
  title?: unknown;
  description?: unknown;
  items: ReasonItem[];
};

function isStatValue(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 14) return false;
  if (/[+%]/.test(trimmed)) return true;
  if (/^\d[\d.,]*\s*(k|m|\+|%|yrs?|years?)?$/i.test(trimmed)) return true;
  return /^[\d.,]+$/.test(trimmed);
}

function formatStatValue(text: string): { value: string; suffix: string } {
  if (text.includes('+')) return { value: text.replace('+', '').trim(), suffix: '+' };
  if (text.includes('%')) return { value: text.replace('%', '').trim(), suffix: '%' };
  return { value: text.trim(), suffix: '' };
}

function normalizeWhyChooseUs(whyChooseUs: unknown): SectionData | null {
  if (!whyChooseUs || typeof whyChooseUs !== 'object') return null;

  const data = whyChooseUs as Record<string, unknown>;
  if (data.enabled === false) return null;

  const rawItems = (data.reasons ?? data.items) as Array<{
    title?: unknown;
    description?: unknown;
  }> | undefined;

  const items: ReasonItem[] =
    rawItems
      ?.map((item) => ({
        title: item.title,
        description: item.description,
        titleText: tiptapToText(item.title),
        descriptionText: tiptapToText(item.description),
      }))
      .filter((item) => item.titleText || item.descriptionText) ?? [];

  if (!data.title && !data.description && items.length === 0) return null;

  return {
    title: data.title,
    description: data.description ?? data.subtitle,
    items,
  };
}

function hasRichContent(content: unknown): boolean {
  if (content == null || content === '') return false;
  if (typeof content === 'object') return Boolean(tiptapToText(content));
  return Boolean(String(content).trim());
}

export const WhyChooseUs: React.FC<WhyChooseUsProps> = ({ whyChooseUs, className }) => {
  const theme = useSectionTheme();
  const { colors, fonts } = theme;

  const section = useMemo(() => normalizeWhyChooseUs(whyChooseUs), [whyChooseUs]);

  const titleText = useMemo(() => tiptapToText(section?.title), [section?.title]);
  const descriptionText = useMemo(
    () => tiptapToText(section?.description),
    [section?.description]
  );

  if (!section) return null;

  const showTitle = hasRichContent(section.title) || Boolean(titleText);
  const showDescription = hasRichContent(section.description) || Boolean(descriptionText);
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
      <div className="wb-surface-lux-inner mx-auto w-full max-w-[90rem] px-6 md:px-12 lg:px-16 xl:px-20 py-10 sm:py-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 xl:gap-20">
          <header className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] mb-6" style={{ fontFamily: fonts.body }}>
              <span style={{ color: subtextColor }}>[ </span>
              <span style={{ color: textColor }}>Why Choose Us</span>
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

            {showDescription && hasRichContent(section.description) && (
              <div
                className={cn('mt-5 text-base sm:text-lg font-light leading-relaxed', !showTitle && 'mt-0')}
                style={{ color: subtextColor }}
              >
                <TiptapRenderer content={section.description} />
              </div>
            )}

            {showDescription && !hasRichContent(section.description) && descriptionText && (
              <p
                className={cn('mt-5 text-base sm:text-lg font-light leading-relaxed', !showTitle && 'mt-0')}
                style={{ color: subtextColor }}
              >
                {descriptionText}
              </p>
            )}
          </header>

          {section.items.length > 0 && (
            <ul
              className="lg:col-span-8 grid gap-0 sm:grid-cols-2 sm:gap-x-10 lg:gap-x-12"
              style={{ borderTop: `1px solid ${borderColor}` }}
            >
              {section.items.map((item, index) => {
                const number = String(index + 1).padStart(2, '0');
                const statInDescription = isStatValue(item.descriptionText);
                const statInTitle = isStatValue(item.titleText);
                const statText = statInDescription ? item.descriptionText : statInTitle ? item.titleText : '';
                const stat = statText ? formatStatValue(statText) : null;
                const labelText = statInDescription ? item.titleText : statInTitle ? item.descriptionText : item.titleText;
                const bodyText =
                  statInDescription || statInTitle
                    ? ''
                    : item.descriptionText;

                return (
                  <li
                    key={`${item.titleText}-${index}`}
                    className="py-7 sm:py-8 border-b"
                    style={{ borderColor }}
                  >
                    {stat ? (
                      <div>
                        <p
                          className="text-[clamp(2rem,4vw,2.75rem)] font-normal leading-none tracking-tight"
                          style={{ fontFamily: fonts.heading, color: textColor }}
                        >
                          {stat.value}
                          {stat.suffix && (
                            <span style={{ color: colors.primaryButton }}>{stat.suffix}</span>
                          )}
                        </p>
                        {labelText && (
                          <p
                            className="mt-3 text-base sm:text-lg leading-snug"
                            style={{ fontFamily: fonts.heading, color: textColor }}
                          >
                            {hasRichContent(item.title) && !statInTitle ? (
                              <TiptapRenderer content={item.title} as="inline" />
                            ) : (
                              labelText
                            )}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-4 sm:gap-5">
                        <span
                          className="text-xs tabular-nums font-medium pt-1 shrink-0"
                          style={{ color: subtextColor, opacity: 0.55 }}
                        >
                          {number}
                        </span>
                        <div className="min-w-0">
                          {item.titleText && (
                            <h3
                              className="text-base sm:text-lg leading-snug"
                              style={{ fontFamily: fonts.heading, color: textColor }}
                            >
                              {hasRichContent(item.title) ? (
                                <TiptapRenderer content={item.title} as="inline" />
                              ) : (
                                item.titleText
                              )}
                            </h3>
                          )}
                          {bodyText && (
                            <p
                              className={cn('text-sm sm:text-base leading-relaxed', item.titleText && 'mt-2')}
                              style={{ color: subtextColor }}
                            >
                              {hasRichContent(item.description) ? (
                                <TiptapRenderer content={item.description} as="inline" />
                              ) : (
                                bodyText
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
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

export default WhyChooseUs;
