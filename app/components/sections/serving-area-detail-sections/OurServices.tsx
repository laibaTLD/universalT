'use client';

import { useMemo } from 'react';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { cn } from '@/app/lib/utils';
import { tiptapToText } from '@/app/lib/seo';

interface OurServicesProps {
  /** CMS `ourServices` from builder (title, description) */
  services?: unknown;
  /** Kept for call-site compatibility; services list is not rendered */
  pageServiceId?: string;
  className?: string;
}

type SectionConfig = {
  title?: unknown;
  description?: unknown;
  label?: string;
};

function normalizeSectionConfig(services: unknown): SectionConfig | null {
  if (!services || typeof services !== 'object') return { title: undefined, description: undefined };

  const data = services as Record<string, unknown>;
  if (data.enabled === false) return null;

  return {
    title: data.title ?? data.label,
    description: data.description ?? data.subtitle,
    label: typeof data.label === 'string' ? data.label : undefined,
  };
}

function hasRichContent(content: unknown): boolean {
  if (content == null || content === '') return false;
  if (typeof content === 'object') return Boolean(tiptapToText(content));
  return Boolean(String(content).trim());
}

export const OurServices: React.FC<OurServicesProps> = ({
  services,
  className,
}) => {
  const theme = useSectionTheme();
  const { colors, fonts } = theme;

  const config = useMemo(() => normalizeSectionConfig(services), [services]);

  const titleText = useMemo(() => tiptapToText(config?.title), [config?.title]);
  const descriptionText = useMemo(
    () => tiptapToText(config?.description),
    [config?.description]
  );

  if (!config) return null;
  if (!titleText && !descriptionText && !hasRichContent(config.title)) {
    return null;
  }

  const showTitle = hasRichContent(config.title) || Boolean(titleText);
  const showDescription = hasRichContent(config.description) || Boolean(descriptionText);
  const borderColor = `color-mix(in srgb, ${colors.mainText} 12%, transparent)`;
  const eyebrow = config.label?.trim() || 'Services';

  return (
    <section
      className={cn('relative border-t', className)}
      style={{
        backgroundColor: colors.pageBackground,
        borderColor,
        fontFamily: fonts.body,
      }}
    >
      <div className="mx-auto w-full max-w-[90rem] px-6 md:px-12 lg:px-16 xl:px-20 py-16 sm:py-20 lg:py-24">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] mb-6" style={{ fontFamily: fonts.body }}>
            <span style={{ color: colors.secondaryText }}>[ </span>
            <span style={{ color: colors.mainText }}>{eyebrow}</span>
            <span style={{ color: colors.secondaryText }}> ]</span>
          </p>

          {showTitle && (
            <h2
              className="text-[clamp(1.75rem,3.2vw,2.75rem)] font-normal leading-[1.12] tracking-tight"
              style={{ fontFamily: fonts.heading, color: colors.mainText }}
            >
              {hasRichContent(config.title) ? (
                <TiptapRenderer content={config.title} as="inline" />
              ) : (
                titleText
              )}
            </h2>
          )}

          {showDescription && hasRichContent(config.description) && (
            <div
              className={cn('mt-5 text-base sm:text-lg font-light leading-relaxed', !showTitle && 'mt-0')}
              style={{ color: colors.secondaryText }}
            >
              <TiptapRenderer content={config.description} />
            </div>
          )}

          {showDescription && !hasRichContent(config.description) && descriptionText && (
            <p
              className={cn('mt-5 text-base sm:text-lg font-light leading-relaxed', !showTitle && 'mt-0')}
              style={{ color: colors.secondaryText }}
            >
              {descriptionText}
            </p>
          )}
        </header>
      </div>
    </section>
  );
};

export default OurServices;
