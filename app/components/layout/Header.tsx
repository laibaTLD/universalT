'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Service, ServiceAreaPage } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import {
  getBrandName,
  buildHeaderNavEntries,
  getPageHref,
  type HomeHeaderNavEntry,
} from '@/app/lib/siteContent';
import {
  getAreaCity,
  getAreaRegion,
  getServiceAreaPageHref,
  getServiceSlugFromAreaPage,
  normalizeSlug,
  resolveServiceSlug,
} from '@/app/lib/serviceAreaSlugs';
import { buildSectionPalette } from '@/app/lib/sectionPalette';
import { cn, getImageSrc } from '@/app/lib/utils';

type ServiceArea = { city: string; region: string };

type ServingAreaGroup = {
  label: string;
  href: string;
  serviceSlug: string;
  areas: ServiceArea[];
};

function isVisibleService(service: Service): boolean {
  return service.status === 'published';
}

function buildServingAreaGroups(
  services: Service[],
  serviceAreaPages: ServiceAreaPage[],
  siteAreas: string[] | undefined
): ServingAreaGroup[] {
  const visibleServices = services.filter(isVisibleService);
  const groups: ServingAreaGroup[] = [];

  const resolveSlugForPage = (page: ServiceAreaPage): string => {
    const fromPage = getServiceSlugFromAreaPage(page);
    if (fromPage) return fromPage;

    const serviceRef = page.serviceId as string | { slug?: string } | undefined;
    if (serviceRef && typeof serviceRef === 'object' && serviceRef.slug) {
      return resolveServiceSlug({ slug: serviceRef.slug });
    }
    if (typeof serviceRef === 'string') {
      const svc = services.find((s) => s._id === serviceRef);
      if (svc) return resolveServiceSlug(svc);
    }
    return '';
  };

  for (const service of visibleServices) {
    const serviceSlug = resolveServiceSlug(service);
    const seen = new Set<string>();
    const areas: ServiceArea[] = [];

    const addArea = (area: unknown) => {
      const city = getAreaCity(area);
      if (!city) return;
      const region = getAreaRegion(area);
      const key = `${city}|${region}`.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      areas.push({ city, region });
    };

    serviceAreaPages.forEach((page) => {
      if (page.status !== 'published' || !page.city?.trim()) return;
      const pageSlug = resolveSlugForPage(page);
      if (normalizeSlug(pageSlug) !== normalizeSlug(serviceSlug)) return;
      addArea({ city: page.city, region: page.region });
    });

    if (areas.length === 0) {
      (service.serviceAreas ?? []).forEach((area) => addArea(area));
    }

    if (areas.length > 0) {
      groups.push({
        label: service.name,
        href: `/service/${serviceSlug}`,
        serviceSlug,
        areas,
      });
    }
  }

  if (groups.length === 0 && siteAreas?.length) {
    const fallbackSlug = visibleServices[0] ? resolveServiceSlug(visibleServices[0]) : 'service';
    const areas: ServiceArea[] = [];
    const seen = new Set<string>();

    siteAreas.forEach((area) => {
      const city = getAreaCity(area);
      if (!city) return;
      const region = getAreaRegion(area);
      const key = `${city}|${region}`.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      areas.push({ city, region });
    });

    if (areas.length > 0) {
      groups.push({
        label: 'Serving Areas',
        href: `/service/${fallbackSlug}`,
        serviceSlug: fallbackSlug,
        areas,
      });
    }
  }

  return groups;
}

function NavLink({
  href,
  children,
  accentColor,
  textColor,
  fontFamily,
  onClick,
}: {
  href: string;
  children: ReactNode;
  accentColor: string;
  textColor: string;
  fontFamily?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group relative text-[10px] font-bold uppercase tracking-[0.4em] transition-opacity hover:opacity-70"
      style={{ color: textColor, fontFamily }}
    >
      {children}
      <span
        className="absolute -bottom-2 left-1/2 h-px w-0 -translate-x-1/2 transition-all duration-500 group-hover:w-full"
        style={{ backgroundColor: accentColor }}
      />
    </Link>
  );
}

export function Header() {
  const { site, pages, services, serviceAreaPages } = useWebBuilder();
  const theme = useSectionTheme();
  const { fonts } = theme;
  const palette = useMemo(() => buildSectionPalette(site), [site]);

  const [isOpen, setIsOpen] = useState(false);
  const [mobileAreasOpen, setMobileAreasOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileExpandedServiceSlug, setMobileExpandedServiceSlug] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const businessName = useMemo(() => getBrandName(site), [site]);
  const phoneNumber = site?.business?.phone?.trim() || site?.business?.emergencyPhone?.trim() || '';
  const logoImage = useMemo(() => {
    const url = site?.theme?.logoUrl || site?.footer?.logo?.url;
    return url ? getImageSrc(url) : '/logo.png';
  }, [site?.theme?.logoUrl, site?.footer?.logo?.url]);

  const servingAreaGroups = useMemo(
    () => buildServingAreaGroups(services, serviceAreaPages, site?.serviceAreas),
    [services, serviceAreaPages, site?.serviceAreas]
  );

  const visibleServices = useMemo(() => services.filter(isVisibleService), [services]);

  const homeNavEntries = useMemo<HomeHeaderNavEntry[]>(
    () =>
      buildHeaderNavEntries(pages, {
        includeServingAreas: servingAreaGroups.length > 0,
        includeServicesDropdown: visibleServices.length > 0,
      }),
    [pages, servingAreaGroups.length, visibleServices.length]
  );

  const contactHref = useMemo(() => {
    const contactPage = pages.find((p) => p.status === 'published' && p.pageType === 'contact');
    return contactPage ? getPageHref(contactPage) : null;
  }, [pages]);

  const accent = palette.primaryButton;
  const text = palette.text;
  const subtext = palette.subtext;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
    setMobileAreasOpen(false);
    setMobileServicesOpen(false);
    setMobileExpandedServiceSlug(null);
  };

  const dropdownPanelStyle = {
    background: `linear-gradient(180deg, ${palette.bgTop} 0%, ${palette.bgBottom} 100%)`,
    border: `1px solid color-mix(in srgb, ${text} 10%, transparent)`,
  };

  const servicesNavDropdown = (
    entry: Extract<HomeHeaderNavEntry, { kind: 'services-dropdown' }>,
    className?: string
  ) => (
    <div className={cn('group relative py-3', className)}>
      <Link
        href={entry.href}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] transition-opacity group-hover:opacity-70"
        style={{ color: text, fontFamily: fonts.body }}
      >
        {entry.name}
        <svg
          className="h-2.5 w-2.5 opacity-40 transition-transform duration-300 group-hover:rotate-180"
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </Link>

      <div className="invisible absolute left-1/2 top-full z-50 min-w-[12rem] -translate-x-1/2 pt-3 opacity-0 transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="py-2" style={dropdownPanelStyle}>
          <Link
            href={entry.href}
            className="block px-4 py-3 text-[9px] font-bold uppercase tracking-[0.28em] transition-opacity hover:opacity-70"
            style={{ color: text, fontFamily: fonts.body }}
          >
            All Services
          </Link>
          {visibleServices.map((service) => (
            <Link
              key={service._id}
              href={`/service/${resolveServiceSlug(service)}`}
              className="block px-4 py-3 text-[9px] font-bold uppercase tracking-[0.28em] transition-opacity hover:opacity-70"
              style={{ color: subtext, fontFamily: fonts.body }}
            >
              {service.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  const areasNavDropdown = (className?: string) =>
    servingAreaGroups.length > 0 ? (
      <div className={cn('group relative py-3', className)}>
        <button
          type="button"
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] transition-opacity group-hover:opacity-70"
          style={{ color: text, fontFamily: fonts.body }}
        >
          Areas
          <svg
            className="h-2.5 w-2.5 opacity-40 transition-transform duration-300 group-hover:rotate-180"
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path d="M2 4l4 4 4-4" />
          </svg>
        </button>

        <div className="invisible absolute left-1/2 top-full z-50 min-w-[12rem] -translate-x-1/2 pt-3 opacity-0 transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
          <div className="py-2" style={dropdownPanelStyle}>
            {servingAreaGroups.map((group) => (
              <div key={group.serviceSlug} className="group/service relative">
                <Link
                  href={group.href}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.28em] transition-opacity hover:opacity-70"
                  style={{ color: text, fontFamily: fonts.body }}
                >
                  {group.label}
                  {group.areas.length > 0 && (
                    <svg
                      className="h-2 w-2 shrink-0 opacity-40"
                      viewBox="0 0 12 12"
                      fill="currentColor"
                    >
                      <path d="M4 2l4 4-4 4" />
                    </svg>
                  )}
                </Link>

                {group.areas.length > 0 && (
                  <div className="invisible absolute left-full top-0 z-50 min-w-[10rem] pl-2 opacity-0 transition-all duration-300 group-hover/service:visible group-hover/service:opacity-100">
                    <div className="py-2" style={dropdownPanelStyle}>
                      {group.areas.map((area, idx) => (
                        <Link
                          key={idx}
                          href={getServiceAreaPageHref(group.serviceSlug, area, serviceAreaPages)}
                          className="block px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.22em] transition-opacity hover:opacity-70"
                          style={{ color: subtext, fontFamily: fonts.body }}
                        >
                          {area.city}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-[100] transition-all duration-500"
        style={{
          background: scrolled
            ? `color-mix(in srgb, ${palette.bgTop} 92%, transparent)`
            : `linear-gradient(180deg, ${palette.bgTop} 0%, color-mix(in srgb, ${palette.bgTop} 55%, transparent) 100%)`,
          backdropFilter: scrolled ? 'blur(12px)' : undefined,
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : undefined,
          borderBottom: scrolled
            ? `1px solid color-mix(in srgb, ${text} 8%, transparent)`
            : '1px solid transparent',
        }}
      >
        <div className="mx-auto w-full max-w-[90rem] px-6 md:px-12 lg:px-16 xl:px-20">
          <div className="grid h-[6.5rem] grid-cols-[auto_1fr_auto] items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
            <Link href="/" className="inline-flex min-w-0 shrink-0 items-center">
              <Image
                src={logoImage}
                alt={businessName || 'Logo'}
                width={160}
                height={160}
                className="h-[5.25rem] w-auto max-w-[16rem] object-contain sm:h-[5.75rem] sm:max-w-[18rem]"
                priority
              />
            </Link>

            <nav className="hidden items-center justify-center gap-8 lg:flex">
              {homeNavEntries.map((entry) =>
                entry.kind === 'services-dropdown' ? (
                  <div key={entry.id}>{servicesNavDropdown(entry)}</div>
                ) : entry.kind === 'serving-areas' ? (
                  <div key="serving-areas">{areasNavDropdown()}</div>
                ) : entry.kind === 'anchor' ? (
                  <NavLink
                    key={entry.id}
                    href={entry.href}
                    accentColor={accent}
                    textColor={text}
                    fontFamily={fonts.body}
                  >
                    {entry.name}
                  </NavLink>
                ) : null
              )}
            </nav>

            <div className="flex items-center justify-end gap-3">
              {phoneNumber && (
                <Link
                  href={`tel:${phoneNumber.replace(/\s/g, '')}`}
                  className="hidden px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-opacity hover:opacity-90 lg:inline-block"
                  style={{
                    backgroundColor: accent,
                    color: palette.textOnDark,
                    fontFamily: fonts.body,
                  }}
                >
                  {phoneNumber}
                </Link>
              )}

              {!phoneNumber && contactHref && (
                <Link
                  href={contactHref}
                  className="hidden px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-opacity hover:opacity-90 lg:inline-block"
                  style={{
                    backgroundColor: accent,
                    color: palette.textOnDark,
                    fontFamily: fonts.body,
                  }}
                >
                  Contact
                </Link>
              )}

              <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                className="relative z-[110] p-2 lg:hidden"
              >
                <div className="flex w-7 flex-col items-end gap-1.5">
                  <span
                    className={cn(
                      'block h-px w-7 transition-all duration-500',
                      isOpen && 'translate-y-[5px] rotate-45'
                    )}
                    style={{ backgroundColor: text }}
                  />
                  <span
                    className={cn(
                      'block h-px transition-all duration-500',
                      isOpen ? 'w-0 opacity-0' : 'w-5'
                    )}
                    style={{ backgroundColor: text }}
                  />
                  <span
                    className={cn(
                      'block h-px transition-all duration-500',
                      isOpen ? 'w-7 -translate-y-[5px] -rotate-45' : 'w-3'
                    )}
                    style={{ backgroundColor: text }}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-[105] transition-all duration-500 lg:hidden',
          isOpen ? 'visible opacity-100' : 'invisible pointer-events-none opacity-0'
        )}
        style={{
          background: `linear-gradient(180deg, ${palette.bgTop} 0%, ${palette.bgBottom} 100%)`,
        }}
      >
        <div className="flex h-full flex-col px-6 pb-10 pt-24">
          <div className="mb-10 flex items-center gap-3">
            <div className="h-px w-10" style={{ backgroundColor: accent }} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.5em]"
              style={{ color: accent, fontFamily: fonts.body }}
            >
              Menu
            </span>
          </div>

          <nav className="flex flex-1 flex-col gap-7">
            {homeNavEntries.map((entry) =>
              entry.kind === 'services-dropdown' ? (
                <div key={entry.id}>
                  <button
                    type="button"
                    onClick={() => setMobileServicesOpen((open) => !open)}
                    className="flex w-full items-center justify-between text-[clamp(1.65rem,5vw,2.25rem)] font-normal tracking-tight"
                    style={{ fontFamily: fonts.heading, color: text }}
                  >
                    {entry.name}
                    <span className="text-sm" style={{ color: subtext }}>
                      {mobileServicesOpen ? '−' : '+'}
                    </span>
                  </button>

                  {mobileServicesOpen && (
                    <div
                      className="mt-5 space-y-4 pt-5"
                      style={{ borderTop: `1px solid color-mix(in srgb, ${text} 12%, transparent)` }}
                    >
                      <Link
                        href={entry.href}
                        onClick={closeMenu}
                        className="block text-[10px] font-bold uppercase tracking-[0.28em]"
                        style={{ color: text, fontFamily: fonts.body }}
                      >
                        All Services
                      </Link>
                      {visibleServices.map((service) => (
                        <Link
                          key={service._id}
                          href={`/service/${resolveServiceSlug(service)}`}
                          onClick={closeMenu}
                          className="block text-[10px] font-bold uppercase tracking-[0.28em]"
                          style={{ color: subtext, fontFamily: fonts.body }}
                        >
                          {service.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : entry.kind === 'serving-areas' ? (
                servingAreaGroups.length > 0 && (
                  <div key="serving-areas">
                    <button
                      type="button"
                      onClick={() => setMobileAreasOpen((open) => !open)}
                      className="flex w-full items-center justify-between text-[clamp(1.65rem,5vw,2.25rem)] font-normal tracking-tight"
                      style={{ fontFamily: fonts.heading, color: text }}
                    >
                      Areas
                      <span className="text-sm" style={{ color: subtext }}>
                        {mobileAreasOpen ? '−' : '+'}
                      </span>
                    </button>

                    {mobileAreasOpen && (
                      <div
                        className="mt-5 space-y-4 pt-5"
                        style={{ borderTop: `1px solid color-mix(in srgb, ${text} 12%, transparent)` }}
                      >
                        {servingAreaGroups.map((group) => (
                          <div key={group.serviceSlug}>
                            <button
                              type="button"
                              onClick={() =>
                                setMobileExpandedServiceSlug((slug) =>
                                  slug === group.serviceSlug ? null : group.serviceSlug
                                )
                              }
                              className="flex w-full items-center justify-between text-[10px] font-bold uppercase tracking-[0.28em]"
                              style={{ color: text, fontFamily: fonts.body }}
                            >
                              {group.label}
                              <span className="text-sm" style={{ color: subtext }}>
                                {mobileExpandedServiceSlug === group.serviceSlug ? '−' : '+'}
                              </span>
                            </button>

                            {mobileExpandedServiceSlug === group.serviceSlug && (
                              <div className="mt-3 space-y-2 pl-4">
                                <Link
                                  href={group.href}
                                  onClick={closeMenu}
                                  className="block text-[10px] uppercase tracking-[0.18em]"
                                  style={{ color: text, fontFamily: fonts.body }}
                                >
                                  View Service
                                </Link>
                                {group.areas.map((area, idx) => (
                                  <Link
                                    key={idx}
                                    href={getServiceAreaPageHref(
                                      group.serviceSlug,
                                      area,
                                      serviceAreaPages
                                    )}
                                    onClick={closeMenu}
                                    className="block text-[10px] uppercase tracking-[0.18em]"
                                    style={{ color: subtext, fontFamily: fonts.body }}
                                  >
                                    {area.city}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ) : entry.kind === 'anchor' ? (
                <Link
                  key={entry.id}
                  href={entry.href}
                  onClick={closeMenu}
                  className="text-[clamp(1.65rem,5vw,2.25rem)] font-normal tracking-tight"
                  style={{ fontFamily: fonts.heading, color: text }}
                >
                  {entry.name}
                </Link>
              ) : null
            )}
          </nav>

          {(phoneNumber || contactHref) && (
            <div
              className="pt-6"
              style={{ borderTop: `1px solid color-mix(in srgb, ${text} 12%, transparent)` }}
            >
              <Link
                href={phoneNumber ? `tel:${phoneNumber.replace(/\s/g, '')}` : contactHref!}
                onClick={closeMenu}
                className="inline-block px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: accent,
                  color: palette.textOnDark,
                  fontFamily: fonts.body,
                }}
              >
                {phoneNumber || 'Contact'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Header;
