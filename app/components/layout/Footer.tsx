'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import {
  getBrandName,
  getCopyrightText,
  getFooterDescriptionContent,
  getFooterNavLinks,
  getPageHref,
} from '@/app/lib/siteContent';
import { tiptapToText } from '@/app/lib/seo';
import { getImageSrc } from '@/app/lib/utils';

const FOOTER_SERVICES_LIMIT = 5;

export function Footer() {
  const { site, pages, services } = useWebBuilder();
  const theme = useSectionTheme();
  const { colors } = theme;

  const businessName = useMemo(() => getBrandName(site), [site]);
  const businessDescription = useMemo(
    () => tiptapToText(getFooterDescriptionContent(site)),
    [site]
  );
  const copyright = useMemo(() => getCopyrightText(site), [site]);
  const navLinks = useMemo(() => getFooterNavLinks(pages), [pages]);
  const allServiceLinks = useMemo(
    () =>
      (services ?? [])
        .filter((s) => s.status === 'published' && s.name?.trim())
        .map((s) => ({
          id: s._id,
          label: s.name.trim(),
          href: `/service/${s.slug || s.name.toLowerCase().replace(/\s+/g, '-')}`,
        })),
    [services]
  );
  const serviceLinks = useMemo(
    () => allServiceLinks.slice(0, FOOTER_SERVICES_LIMIT),
    [allServiceLinks]
  );
  const hasMoreServices = allServiceLinks.length > FOOTER_SERVICES_LIMIT;
  const servicesPageHref = useMemo(() => {
    const servicePage = pages.find((p) => p.pageType === 'service-list' && p.status === 'published');
    return servicePage ? getPageHref(servicePage) : '/services';
  }, [pages]);

  const logoSrc = useMemo(() => {
    const url = site?.footer?.logo?.url || site?.theme?.logoUrl;
    return url ? getImageSrc(url) : '/logo.png';
  }, [site?.footer?.logo?.url, site?.theme?.logoUrl]);

  const socialLinks = useMemo(() => {
    if (site?.footer?.showSocialLinks === false) return [];
    return site?.socialLinks ?? [];
  }, [site?.footer?.showSocialLinks, site?.socialLinks]);

  const email = site?.business?.email?.trim() || '';
  const address = site?.business?.address;
  const backgroundColor = colors.sectionBackgroundDark || colors.mainText;
  // Builder light / on-dark text (white)
  const textColor = colors.darkPrimaryText;
  const mutedColor = colors.darkSecondaryText || colors.darkPrimaryText;
  const accentColor = colors.primaryButton;

  return (
    <footer
      id="site-footer"
      className="relative pt-20 pb-10 overflow-hidden"
      style={{
        backgroundColor,
        borderTop: `1px solid color-mix(in srgb, ${textColor} 10%, transparent)`,
      }}
    >
      <div
        className="absolute top-0 right-0 w-1/3 h-full -skew-x-12 translate-x-1/2"
        style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 8%, transparent)` }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 sm:gap-12 mb-16 sm:mb-20">
          <div className="md:col-span-4">
            <div className="relative mb-8 h-24 w-72">
              <Image
                src={logoSrc}
                alt={businessName || 'Business Name'}
                fill
                className="object-contain object-left brightness-0 invert"
              />
            </div>
            {businessDescription && (
              <p className="text-sm font-light leading-relaxed max-w-sm" style={{ color: mutedColor }}>
                {businessDescription}
              </p>
            )}

            {socialLinks.length > 0 && (
              <div className="mt-8 flex gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={`${social.platform}-${index}`}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: textColor }}
                  >
                    <span className="w-8 h-px transition-all" style={{ backgroundColor: accentColor }} />
                    {social.platform}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.5em]" style={{ color: accentColor }}>
              Navigation
            </h4>
            <nav className="flex flex-col gap-4 mt-6">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="text-sm font-light hover:translate-x-2 transition-transform duration-500"
                  style={{ color: textColor }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {serviceLinks.length > 0 && (
            <div className="md:col-span-3">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.5em]" style={{ color: accentColor }}>
                Services
              </h4>
              <nav className="flex flex-col gap-4 mt-6">
                {serviceLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={link.href}
                    className="text-sm font-light hover:translate-x-2 transition-transform duration-500"
                    style={{ color: textColor }}
                  >
                    {link.label}
                  </Link>
                ))}
                {hasMoreServices && (
                  <Link
                    href={servicesPageHref}
                    className="mt-1 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] transition-opacity hover:opacity-70"
                    style={{ color: accentColor }}
                  >
                    See more services
                    <span aria-hidden>→</span>
                  </Link>
                )}
              </nav>
            </div>
          )}

          <div className={serviceLinks.length > 0 ? 'md:col-span-3' : 'md:col-span-6'}>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.5em]" style={{ color: accentColor }}>
              Contact
            </h4>
            <div className="space-y-6 text-sm font-light mt-6" style={{ color: textColor }}>
              {email && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: mutedColor }}>
                    Inquiries
                  </p>
                  <a href={`mailto:${email}`} className="transition-opacity hover:opacity-70" style={{ color: textColor }}>
                    {email}
                  </a>
                </div>
              )}
              {address && (address.street || address.city || address.state || address.zipCode) && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: mutedColor }}>
                    Office
                  </p>
                  <address className="not-italic" style={{ color: mutedColor }}>
                    {address.street && (
                      <>
                        {address.street}
                        <br />
                      </>
                    )}
                    {[address.city, address.state].filter(Boolean).join(', ')}
                    {address.zipCode ? ` ${address.zipCode}` : ''}
                  </address>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="pt-8 sm:pt-10 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6"
          style={{ borderTop: `1px solid color-mix(in srgb, ${textColor} 12%, transparent)` }}
        >
          <p className="text-[10px] uppercase tracking-[0.5em]" style={{ color: mutedColor }}>
            {copyright || `© ${new Date().getFullYear()} ${businessName}`}
          </p>

          <div
            className="flex items-center gap-8 text-[10px] uppercase tracking-[0.5em]"
            style={{ color: mutedColor }}
          >
            <Link href="/privacy-policy" className="hover:opacity-70 transition-opacity">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:opacity-70 transition-opacity">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
