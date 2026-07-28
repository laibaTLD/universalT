'use client';

import { useMemo } from 'react';
import type { Page } from '@/app/lib/types';
import { useScrollAnimation, useStaggeredAnimation } from '@/app/hooks/useScrollAnimation';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { tiptapToText } from '@/app/lib/seo';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { cn } from '@/app/lib/utils';

interface WhyChooseUsSectionProps {
  whyChooseUsSection?: Page['whyChooseUsSection'];
  className?: string;
}

export function WhyChooseUsSection({ whyChooseUsSection, className }: WhyChooseUsSectionProps) {
  const theme = useSectionTheme();
  const { colors, fonts } = theme;

  const title = useMemo(() => tiptapToText(whyChooseUsSection?.title), [whyChooseUsSection?.title]);
  const description = useMemo(
    () => tiptapToText(whyChooseUsSection?.description),
    [whyChooseUsSection?.description]
  );
  const sectionsData = useMemo(
    () =>
      (whyChooseUsSection?.items ?? [])
        .map((item) => ({
          heading: tiptapToText(item.title),
          description: tiptapToText(item.description),
        }))
        .filter((item) => item.heading || item.description),
    [whyChooseUsSection?.items]
  );

  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.2 });
  const { ref: sectionsRef, visibleItems: sectionsVisible } = useStaggeredAnimation(sectionsData.length, 120);

  if (!whyChooseUsSection || whyChooseUsSection.enabled === false) return null;
  if (!title && !description && sectionsData.length === 0) return null;

  const accentColor = colors.primaryButton;

  return (
    <section
      id="why-choose-us"
      className={cn('relative overflow-hidden pt-12 lg:pt-16 pb-8 lg:pb-10', className)}
      style={{ backgroundColor: colors.pageBackground }}
    >
      <div className="container mx-auto px-6 lg:px-12">
        <div
          ref={titleRef}
          className={cn(
            'mb-8 lg:mb-10 mx-auto max-w-3xl transition-all duration-1000',
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <SectionHeading
            eyebrow="Why Choose Us"
            title={title}
            description={description}
            align="center"
            descriptionClassName="max-w-2xl"
          />
        </div>

        {sectionsData.length > 0 && (
          <div
            ref={sectionsRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-12 lg:gap-y-16"
          >
            {sectionsData.map((section, index) => (
              <div
                key={index}
                className={cn(
                  'group border-t border-slate-200 pt-8 transition-all duration-700',
                  sectionsVisible.includes(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                )}
              >
                <div className="flex items-baseline justify-between gap-4 mb-5">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.35em]"
                    style={{ color: accentColor }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="h-px flex-1 max-w-16" style={{ backgroundColor: `${accentColor}40` }} />
                </div>

                {section.heading && (
                  <h3
                    className="text-xl sm:text-2xl font-normal tracking-tight text-slate-900 mb-4"
                    style={{ fontFamily: fonts.heading }}
                  >
                    {section.heading}
                  </h3>
                )}

                {section.description && (
                  <p className="text-sm sm:text-base font-light leading-relaxed text-slate-600 max-w-md">
                    {section.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default WhyChooseUsSection;
