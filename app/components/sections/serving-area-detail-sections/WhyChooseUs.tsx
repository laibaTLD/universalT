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

  // Area pages only — do not fall back to home `whyChooseUsSection.items`
  const rawItems = data.reasons as Array<{
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
  const textColor = colors.darkPrimaryText;
  const subtextColor = colors.darkSecondaryText;
  const borderColor = `color-mix(in srgb, ${textColor} 12%, transparent)`;

  return (
    <section
      className={cn('relative h-full wb-surface-lux', className)}
      style={{
        fontFamily: fonts.body,
      }}
    >
      <div className="wb-surface-lux-inner flex h-full flex-col px-6 py-12 text-center sm:px-8 sm:py-14 lg:px-10 lg:py-16">
        <header className="mx-auto w-full max-w-lg">
          <p
            className="mb-5 text-[11px] font-medium uppercase tracking-[0.28em]"
            style={{ fontFamily: fonts.body }}
          >
            <span style={{ color: subtextColor }}>[ </span>
            <span style={{ color: textColor }}>Why Choose Us</span>
            <span style={{ color: subtextColor }}> ]</span>
          </p>

          {showTitle && (
            <h2
              className="text-[clamp(1.2rem,1.8vw,1.65rem)] font-normal leading-[1.25] tracking-tight"
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
              className={cn(
                'mt-5 text-sm leading-relaxed sm:mt-6 sm:text-[0.9375rem] [&_h1]:mt-3 [&_h1]:font-bold [&_h2]:mt-3 [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:font-bold [&_strong]:font-semibold',
                !showTitle && 'mt-0'
              )}
              style={{ color: subtextColor }}
            >
              <TiptapRenderer content={section.description} className="text-inherit" />
            </div>
          )}

          {showDescription && !hasRichContent(section.description) && descriptionText && (
            <p
              className={cn(
                'mt-5 text-sm leading-relaxed sm:mt-6 sm:text-[0.9375rem]',
                !showTitle && 'mt-0'
              )}
              style={{ color: subtextColor }}
            >
              {descriptionText}
            </p>
          )}
        </header>

        {section.items.length > 0 && (
          <ul
            className="mx-auto mt-8 w-full max-w-lg grid gap-0 text-center sm:mt-10"
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
                  className="border-b py-5 sm:py-6"
                  style={{ borderColor }}
                >
                  {stat ? (
                    <div>
                      <p
                        className="text-[clamp(1.5rem,2.5vw,2rem)] font-normal leading-none tracking-tight"
                        style={{ fontFamily: fonts.heading, color: textColor }}
                      >
                        {stat.value}
                        {stat.suffix && (
                          <span style={{ color: colors.primaryButton }}>{stat.suffix}</span>
                        )}
                      </p>
                      {labelText && (
                        <p
                          className="mt-2 text-sm leading-snug sm:text-base"
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
                    <div>
                      <span
                        className="mb-2 block text-xs font-medium tabular-nums"
                        style={{ color: subtextColor, opacity: 0.55 }}
                      >
                        {number}
                      </span>
                      {item.titleText && (
                        <h3
                          className="text-sm leading-snug sm:text-base"
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
                          className={cn('mx-auto max-w-sm text-sm leading-relaxed', item.titleText && 'mt-2')}
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
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

export default WhyChooseUs;
