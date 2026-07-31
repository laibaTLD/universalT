'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { Page, Service, ServiceAreaPage } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { getBusinessTagline } from '@/app/lib/siteContent';
import { cn } from '@/app/lib/utils';
import { tiptapToText } from '@/app/lib/seo';
import {
  getAreaCity,
  getAreaRegion,
  getServiceAreaPageHref,
  getServiceSlugFromAreaPage,
  normalizeSlug,
  resolveServiceSlug,
} from '@/app/lib/serviceAreaSlugs';
import { useScrollAnimation, useStaggeredAnimation } from '@/app/hooks/useScrollAnimation';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { SectionHeading } from '@/app/components/ui/SectionHeading';

interface ServingAreasSectionProps {
  servingAreasSection?: Page['servingAreasSection'];
  className?: string;
}

type DisplayArea = {
  city: string;
  region: string;
  label: string;
  href?: string;
};

function resolveAreaCity(area: unknown): string {
  if (typeof area === 'string') {
    const trimmed = area.trim();
    if (!trimmed) return '';
    // "Everett, WA" / "King County, WA"
    const comma = trimmed.lastIndexOf(',');
    if (comma > 0) return trimmed.slice(0, comma).trim();
    return trimmed;
  }

  const fromHelper = getAreaCity(area);
  if (fromHelper) return fromHelper;

  if (area && typeof area === 'object') {
    const record = area as Record<string, unknown>;
    for (const key of ['area', 'location', 'label', 'title', 'name']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        const trimmed = value.trim();
        const comma = trimmed.lastIndexOf(',');
        if (comma > 0) return trimmed.slice(0, comma).trim();
        return trimmed;
      }
    }
  }

  return '';
}

function resolveAreaRegionFromUnknown(area: unknown): string {
  if (typeof area === 'string') {
    const trimmed = area.trim();
    const comma = trimmed.lastIndexOf(',');
    if (comma > 0) return trimmed.slice(comma + 1).trim();
    return '';
  }
  return getAreaRegion(area);
}

function formatAreaLabel(city: string, region: string): string {
  if (!region) return city;
  if (city.toLowerCase().includes(region.toLowerCase())) return city;
  return `${city}, ${region}`;
}

function normalizeServiceArea(area: unknown): Omit<DisplayArea, 'href' | 'label'> | null {
  const city = resolveAreaCity(area);
  if (!city) return null;

  const region = resolveAreaRegionFromUnknown(area);
  return { city, region };
}

function isVisibleService(service: Service): boolean {
  return service.status !== 'draft' && service.status !== 'archived';
}

function areaKey(area: Pick<DisplayArea, 'city' | 'region'>): string {
  return `${area.city.toLowerCase()}|${area.region.toLowerCase()}`;
}

function enrichArea(
  area: Omit<DisplayArea, 'href' | 'label'>,
  serviceSlug: string,
  serviceAreaPages: ServiceAreaPage[] | undefined
): DisplayArea {
  const href = getServiceAreaPageHref(serviceSlug, area, serviceAreaPages);
  return {
    ...area,
    label: formatAreaLabel(area.city, area.region),
    href: href || undefined,
  };
}

function AreaItem({
  area,
  index,
  accentColor,
  textColor,
  surface,
  fonts,
  visible,
  compact,
}: {
  area: DisplayArea;
  index: number;
  accentColor: string;
  textColor: string;
  surface: string;
  fonts: ReturnType<typeof useSectionTheme>['fonts'];
  visible: boolean;
  compact?: boolean;
}) {
  const content = (
    <div
      className={cn(
        'flex h-full flex-col transition-all duration-700',
        compact
          ? 'inline-flex items-center gap-4 px-6 py-5 sm:px-8 sm:py-6'
          : 'border-t px-5 py-6 sm:px-6',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        area.href && 'group'
      )}
      style={{
        backgroundColor: surface,
        borderColor: compact
          ? undefined
          : `color-mix(in srgb, ${textColor} 14%, transparent)`,
      }}
    >
      <span
        className="shrink-0 text-[10px] font-bold uppercase tracking-[0.35em]"
        style={{ color: accentColor }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      {!compact && (
        <div className="mb-4 mt-3 h-px max-w-12 shrink-0" style={{ backgroundColor: `${accentColor}40` }} />
      )}

      <p
        className={cn(
          'font-normal tracking-tight',
          compact
            ? 'text-xl sm:text-2xl'
            : 'mt-auto min-h-[2.75em] text-base leading-snug sm:min-h-[2.5em] sm:text-lg line-clamp-2',
          area.href && 'transition-opacity group-hover:opacity-70'
        )}
        style={{ color: textColor, fontFamily: fonts.heading }}
      >
        {area.label}
      </p>
    </div>
  );

  if (area.href) {
    return (
      <Link
        href={area.href}
        className={cn(
          'h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          compact ? 'inline-flex' : 'block'
        )}
      >
        {content}
      </Link>
    );
  }

  return content;
}

export function ServingAreasSection({ servingAreasSection, className }: ServingAreasSectionProps) {
  const theme = useSectionTheme();
  const { colors, fonts } = theme;
  const { site, services, serviceAreaPages } = useWebBuilder();

  const serviceAreas = useMemo<DisplayArea[]>(() => {
    const result: DisplayArea[] = [];
    const seen = new Set<string>();
    const pages = Array.isArray(serviceAreaPages) ? serviceAreaPages : [];

    const addArea = (area: unknown, serviceSlug: string) => {
      const normalized = normalizeServiceArea(area);
      if (!normalized) return;
      const key = areaKey(normalized);
      if (seen.has(key)) return;
      seen.add(key);
      result.push(enrichArea(normalized, serviceSlug, pages));
    };

    const resolveSlugForPage = (page: ServiceAreaPage): string => {
      const fromHelper = getServiceSlugFromAreaPage(page);
      if (fromHelper) return fromHelper;

      const serviceRef = page.serviceId as string | { slug?: string; name?: string } | undefined;
      if (serviceRef && typeof serviceRef === 'object') {
        return resolveServiceSlug(serviceRef);
      }
      if (typeof serviceRef === 'string') {
        const svc = services.find((s) => s._id === serviceRef);
        if (svc) return resolveServiceSlug(svc);
      }
      return '';
    };

    const pageRegion = (page: ServiceAreaPage): string => {
      const record = page as ServiceAreaPage & { state?: string };
      return (page.region || record.state || '').trim();
    };

    const addAreasFromServiceAreaPages = (filterPublished = true) => {
      pages.forEach((page) => {
        if (filterPublished && page.status && page.status !== 'published') return;
        if (!page.city?.trim()) return;
        const slug = resolveSlugForPage(page) || 'service';
        addArea({ city: page.city, region: pageRegion(page) }, slug);
      });
    };

    const addAreasFromServiceAreaPagesForSlug = (slug: string, filterPublished = true) => {
      const normSlug = normalizeSlug(slug);
      pages.forEach((page) => {
        if (filterPublished && page.status && page.status !== 'published') return;
        if (!page.city?.trim()) return;
        const pageSlug = resolveSlugForPage(page);
        if (!pageSlug || normalizeSlug(pageSlug) !== normSlug) return;
        addArea({ city: page.city, region: pageRegion(page) }, normSlug);
      });
    };

    const sectionSlug = servingAreasSection?.serviceSlug?.trim();
    if (sectionSlug) {
      const normSectionSlug = normalizeSlug(sectionSlug);
      const match = services.find((s: Service) => resolveServiceSlug(s) === normSectionSlug);
      const slug = match ? resolveServiceSlug(match) : normSectionSlug;

      addAreasFromServiceAreaPagesForSlug(slug, true);
      addAreasFromServiceAreaPagesForSlug(slug, false);
      (match?.serviceAreas ?? []).forEach((area) => addArea(area, slug));
      (site?.serviceAreas ?? []).forEach((area) => addArea(area, slug));
      return result;
    }

    // Union all live sources (pages + services + site list). Do not stop at first hit —
    // a single published area page would otherwise hide the rest of site.serviceAreas.
    addAreasFromServiceAreaPages(true);
    addAreasFromServiceAreaPages(false);

    const visibleServices = services.filter(isVisibleService);
    for (const service of visibleServices) {
      const slug = resolveServiceSlug(service);
      (service.serviceAreas ?? []).forEach((area) => addArea(area, slug));
    }

    const defaultSlug = visibleServices[0]
      ? resolveServiceSlug(visibleServices[0])
      : services[0]
        ? resolveServiceSlug(services[0])
        : 'service';
    (site?.serviceAreas ?? []).forEach((area) => addArea(area, defaultSlug));

    return result;
  }, [servingAreasSection?.serviceSlug, services, site?.serviceAreas, serviceAreaPages]);

  const sectionTitle = useMemo(() => {
    const text = tiptapToText(servingAreasSection?.title);
    return text || 'Our Service Areas';
  }, [servingAreasSection?.title]);

  const sectionDescription = useMemo(() => {
    const text = tiptapToText(servingAreasSection?.description);
    return text || getBusinessTagline(site) || '';
  }, [servingAreasSection?.description, site]);

  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.2 });
  const { ref: gridRef, visibleItems } = useStaggeredAnimation(serviceAreas.length, 80);

  if (servingAreasSection?.enabled === false) return null;
  if (serviceAreas.length === 0) return null;

  const accentColor = colors.primaryButton;
  const textColor = colors.mainText;
  const areaSurface = `color-mix(in srgb, ${colors.sectionBackgroundLight || accentColor} 28%, ${colors.pageBackground})`;
  const isSparse = serviceAreas.length <= 2;
  const gridClass =
    serviceAreas.length === 1
      ? 'grid-cols-1'
      : serviceAreas.length === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : serviceAreas.length === 3
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <section
      id="serving-areas"
      className={cn(
        'relative overflow-hidden',
        isSparse ? 'py-10 lg:py-12' : 'pt-12 pb-10 lg:pt-16 lg:pb-12',
        className
      )}
      style={{ backgroundColor: colors.pageBackground }}
    >
      <div className="container mx-auto px-6 lg:px-12">
        {isSparse ? (
          <div
            ref={titleRef}
            className={cn(
              'flex flex-col gap-8 transition-all duration-1000 lg:flex-row lg:items-end lg:justify-between lg:gap-16',
              titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            <div className="max-w-xl shrink-0">
              <SectionHeading
                eyebrow="Locations"
                title={sectionTitle}
                description={sectionDescription || undefined}
                descriptionClassName="max-w-md"
              />
            </div>

            <div
              ref={gridRef}
              className={cn(
                'flex flex-wrap items-stretch gap-4',
                serviceAreas.length === 1 ? 'lg:justify-end' : ''
              )}
            >
              {serviceAreas.map((area, index) => (
                <AreaItem
                  key={areaKey(area)}
                  area={area}
                  index={index}
                  accentColor={accentColor}
                  textColor={textColor}
                  surface={areaSurface}
                  fonts={fonts}
                  visible={visibleItems.includes(index)}
                  compact
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div
              ref={titleRef}
              className={cn(
                'mb-8 lg:mb-10 max-w-3xl transition-all duration-1000',
                titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
            >
              <SectionHeading
                eyebrow="Locations"
                title={sectionTitle}
                description={sectionDescription || undefined}
                descriptionClassName="max-w-2xl"
              />
            </div>

            <div ref={gridRef} className={cn('grid items-stretch gap-4 sm:gap-5', gridClass)}>
              {serviceAreas.map((area, index) => (
                <AreaItem
                  key={areaKey(area)}
                  area={area}
                  index={index}
                  accentColor={accentColor}
                  textColor={textColor}
                  surface={areaSurface}
                  fonts={fonts}
                  visible={visibleItems.includes(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default ServingAreasSection;
