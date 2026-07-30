'use client';

import React, { useMemo } from 'react';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { tiptapToText } from '@/app/lib/seo';
import { cn } from '@/app/lib/utils';
import { useScrollAnimation } from '@/app/hooks/useScrollAnimation';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

interface ServiceDetailsProps {
  details: unknown;
  className?: string;
}

type DetailsData = {
  title?: unknown;
  description?: unknown;
};

/** Service Details on service-area pages: title + description only. */
function normalizeDetailsSection(details: unknown): DetailsData | null {
  if (!details || typeof details !== 'object') return null;

  const data = details as Record<string, unknown>;
  if (data.enabled === false) return null;

  const title = data.title;
  const description = data.description ?? data.subtitle;

  if (!title && !description) return null;

  return { title, description };
}

function hasRichContent(content: unknown): boolean {
  if (content == null || content === '') return false;
  if (typeof content === 'object') return Boolean(tiptapToText(content));
  return Boolean(String(content).trim());
}

export const ServiceDetails: React.FC<ServiceDetailsProps> = ({ details, className }) => {
  const { colors, fonts } = useSectionTheme();
  const primaryColor = colors.primaryButton;

  const section = useMemo(() => normalizeDetailsSection(details), [details]);

  const resolvedHeading = useMemo(
    () => tiptapToText(section?.title) || 'Service Details',
    [section?.title]
  );

  const descriptionText = useMemo(
    () => tiptapToText(section?.description),
    [section?.description]
  );

  const { ref: triggerRef, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.12,
  });
  const loaded = isVisible;

  if (!section) return null;

  const showDescription =
    hasRichContent(section.description) || Boolean(descriptionText);

  return (
    <section
      id="service-details"
      className={cn('relative h-full overflow-hidden', className)}
      style={{ backgroundColor: colors.pageBackground }}
    >
      <div
        ref={triggerRef}
        className="flex h-full flex-col px-6 py-12 text-center sm:px-8 sm:py-14 lg:px-10 lg:py-16"
      >
        <p
          className="mb-5 flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em]"
          style={{
            fontFamily: fonts.body,
            color: primaryColor,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(16px)',
            transition: `opacity 0.6s ${EASE}, transform 0.6s ${EASE}`,
          }}
        >
          <span className="inline-block h-px w-8 shrink-0" style={{ backgroundColor: primaryColor }} />
          Service Details
        </p>

        <h2
          className="text-[clamp(1.2rem,1.8vw,1.65rem)] font-normal leading-[1.15] tracking-tight"
          style={{
            fontFamily: fonts.heading,
            color: colors.mainText,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(18px)',
            transition: `opacity 0.7s ${EASE}, transform 0.7s ${EASE}`,
            transitionDelay: '0.15s',
          }}
        >
          {resolvedHeading}
        </h2>

        {showDescription && hasRichContent(section.description) && (
          <div
            className="mx-auto mt-6 max-w-lg text-sm leading-relaxed sm:mt-7 sm:text-[0.9375rem] [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-bold [&_strong]:font-semibold"
            style={{
              fontFamily: fonts.body,
              color: colors.secondaryText,
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(18px)',
              transition: `opacity 0.75s ${EASE}, transform 0.75s ${EASE}`,
              transitionDelay: '0.55s',
            }}
          >
            <TiptapRenderer content={section.description} className="text-inherit" />
          </div>
        )}

        {showDescription && !hasRichContent(section.description) && descriptionText && (
          <p
            className="mx-auto mt-6 max-w-lg text-sm leading-relaxed sm:mt-7 sm:text-[0.9375rem]"
            style={{
              fontFamily: fonts.body,
              color: colors.secondaryText,
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(18px)',
              transition: `opacity 0.75s ${EASE}, transform 0.75s ${EASE}`,
              transitionDelay: '0.55s',
            }}
          >
            {descriptionText}
          </p>
        )}
      </div>
    </section>
  );
};

export default ServiceDetails;
