'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';
import { useThemeColors } from '@/app/hooks/useTheme';
import { HeroSection } from './serving-area-detail-sections/Hero';
import { Highlights } from './serving-area-detail-sections/Highlights';
import { About } from './serving-area-detail-sections/About';
import { OurServices } from './serving-area-detail-sections/OurServices';
import { CTA } from './serving-area-detail-sections/CTA';
import { ServiceOverview } from './serving-area-detail-sections/ServiceOverview';
import { ServiceDetails } from './serving-area-detail-sections/ServiceDetails';
import { WhyChooseUs } from './serving-area-detail-sections/WhyChooseUs';
import { FAQs } from './serving-area-detail-sections/FAQs';
import {
  ServingAreas,
  stripStaticAreasFromConfig,
} from './serving-area-detail-sections/ServingAreas';

export interface ServingAreasdetailSectionData {
  hero?: unknown;
  highlights?: unknown;
  about?: unknown;
  ourServices?: unknown;
  /** Parent service for this service area page (builder auto-includes it in Our Services) */
  pageServiceId?: string;
  cta?: unknown;
  serviceOverview?: unknown;
  serviceDetails?: unknown;
  whyChooseUs?: unknown;
  faqs?: unknown;
  /** CMS section config (title, description, serviceSlug) — area list is live from WebBuilder */
  servingAreas?: unknown;
}

interface ServingAreasdetailSectionProps {
  data: ServingAreasdetailSectionData;
  className?: string;
}

export const ServingAreasdetailSection: React.FC<ServingAreasdetailSectionProps> = ({
  data,
  className,
}) => {
  const themeColors = useThemeColors();
  const whyChooseUs = data.whyChooseUs ?? data.about;
  const servingAreasConfig = stripStaticAreasFromConfig(data.servingAreas);
  const servingAreasEnabled =
    servingAreasConfig &&
    typeof servingAreasConfig === 'object' &&
    (servingAreasConfig as { enabled?: boolean }).enabled === false
      ? false
      : true;

  return (
    <div className={cn('w-full', className)} style={{ backgroundColor: themeColors.pageBackground }}>
      {data.hero ? <HeroSection hero={data.hero} /> : null}
      {data.highlights ? <Highlights highlights={data.highlights} /> : null}
      {data.about ? <About about={data.about} /> : null}
      {data.ourServices != null &&
      typeof data.ourServices === 'object' &&
      (data.ourServices as { enabled?: boolean }).enabled !== false ? (
        <OurServices services={data.ourServices} pageServiceId={data.pageServiceId} />
      ) : null}
      {data.cta ? <CTA cta={data.cta} /> : null}
      {data.serviceOverview != null &&
      typeof data.serviceOverview === 'object' &&
      (data.serviceOverview as { enabled?: boolean }).enabled !== false ? (
        <ServiceOverview overview={data.serviceOverview} />
      ) : null}
      {(whyChooseUs || data.serviceDetails) ? (
        <div
          className="grid grid-cols-1 lg:grid-cols-2 lg:items-stretch"
          style={{
            borderTop: `1px solid color-mix(in srgb, ${themeColors.mainText} 12%, transparent)`,
          }}
        >
          {whyChooseUs ? <WhyChooseUs whyChooseUs={whyChooseUs} className="h-full min-h-0" /> : null}
          {data.serviceDetails ? (
            <div
              className="h-full min-h-0 border-t lg:border-t-0 lg:border-l"
              style={{
                borderColor: `color-mix(in srgb, ${themeColors.mainText} 12%, transparent)`,
              }}
            >
              <ServiceDetails details={data.serviceDetails} className="h-full" />
            </div>
          ) : null}
        </div>
      ) : null}
      {data.faqs ? <FAQs faqs={data.faqs} /> : null}
      {servingAreasEnabled ? <ServingAreas service={servingAreasConfig} /> : null}
    </div>
  );
};

export default ServingAreasdetailSection;
