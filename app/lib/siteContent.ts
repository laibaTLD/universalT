import type { Page, Site } from '@/app/lib/types';
import { getImageSrc } from '@/app/lib/utils';
import { tiptapToText } from '@/app/lib/seo';

export function getBrandName(site?: Site | null): string {
  return site?.business?.name?.trim() || site?.name?.trim() || '';
}

export function getBusinessTagline(site?: Site | null): string {
  return site?.business?.tagline?.trim() || '';
}

export function getHeroEyebrowText(hero?: Page['hero'], site?: Site | null): string {
  const eyebrow = tiptapToText(hero?.eyebrow);
  if (eyebrow) return eyebrow;
  const subtitle = tiptapToText(hero?.subtitle);
  if (subtitle) return subtitle;
  return getBusinessTagline(site);
}

export function getHeroTitleText(hero?: Page['hero'], site?: Site | null): string {
  const title = tiptapToText(hero?.title);
  if (title) return title;
  return getBrandName(site);
}

export function getHeroDescriptionExcerpt(hero?: Page['hero'], maxLen = 120): string {
  const text = tiptapToText(hero?.description);
  if (!text) return '';
  return text.length > maxLen ? `${text.slice(0, maxLen).trim()}…` : text;
}

export function getHeroFooterLine(hero?: Page['hero'], site?: Site | null): string {
  const excerpt = getHeroDescriptionExcerpt(hero, 140);
  if (excerpt) return excerpt;
  return getBusinessTagline(site);
}

export function getBusinessAddressLine(site?: Site | null): string {
  const addr = site?.business?.address;
  if (!addr) return '';

  const cityState = [addr.city, addr.state].filter(Boolean).join(', ');
  const parts = [addr.street, cityState, addr.zipCode, addr.country].filter(Boolean) as string[];
  return parts.join(' · ');
}

/** Raw CMS content for footer blurb (Tiptap JSON, HTML string, or plain text). */
export function getFooterDescriptionContent(site?: Site | null): unknown {
  const footerDesc = site?.footer?.description;
  if (footerDesc != null && footerDesc !== '') {
    if (typeof footerDesc === 'string' && !footerDesc.trim()) {
      // fall through
    } else {
      return footerDesc;
    }
  }

  const tagline = getBusinessTagline(site);
  if (tagline) return tagline;

  const businessDesc = site?.business?.description;
  if (businessDesc != null && businessDesc !== '') return businessDesc;

  return null;
}

export function hasFooterDescriptionContent(content: unknown): boolean {
  if (content == null || content === '') return false;
  if (typeof content === 'object') return true;
  return Boolean(tiptapToText(content) || String(content).trim());
}

export function getMenuFooterLine(site?: Site | null): string {
  const raw = getFooterDescriptionContent(site);
  const text = tiptapToText(raw);
  if (text) {
    return text.length > 140 ? `${text.slice(0, 140).trim()}…` : text;
  }
  return typeof raw === 'string' ? raw.trim() : '';
}

export function getHomePageLabel(pages?: Page[]): string {
  return pages?.find((p) => p.pageType === 'home')?.name?.trim() || '';
}

const PAGE_TYPE_PATHS: Record<Page['pageType'], string> = {
  home: '/',
  about: '/about-us',
  contact: '/contact-us',
  'service-list': '/services',
  'blog-list': '/blog',
  'project-detail': '/project-detail',
  testimonials: '/testimonials',
  gallery: '/gallery',
};

/** Slug → path when the app uses a dedicated route folder (not `[pageSlug]`). */
const SLUG_PATH_ALIASES: Record<string, string> = {
  testimonials: '/testimonials',
  gallery: '/gallery',
  'about-us': '/about-us',
  'contact-us': '/contact-us',
  services: '/services',
  blog: '/blog',
  'project-detail': '/project-detail',
};

/** Resolves a CMS page to the correct Next.js route. */
export function getPageHref(page: Page): string {
  if (page.pageType === 'home') return '/';

  const slug = (page.slug || '').replace(/^\/+|\/+$/g, '');
  const normalized = slug.toLowerCase();

  // Testimonials pages always use their CMS slug in the URL
  if (slug && isTestimonialsPageBySlugOrName(page)) {
    return `/${slug}`;
  }

  if (normalized && SLUG_PATH_ALIASES[normalized]) {
    return SLUG_PATH_ALIASES[normalized];
  }

  const typePath = PAGE_TYPE_PATHS[page.pageType];
  if (typePath && typePath !== '/') return typePath;

  return slug ? `/${slug}` : '/';
}

function normalizePageSlug(slug?: string): string {
  return (slug || '').replace(/^\/+|\/+$/g, '').toLowerCase();
}

export const TESTIMONIALS_ROUTE = '/testimonials';

function isTestimonialsPageBySlugOrName(page: Page): boolean {
  if (page.pageType === 'testimonials') return true;
  const slug = normalizePageSlug(page.slug);
  const name = (page.name || '').trim().toLowerCase();
  return (
    slug === 'testimonials' ||
    slug === 'testimonial' ||
    slug.includes('testimonial') ||
    name === 'testimonials' ||
    name === 'testimonial'
  );
}

export function isTestimonialsPage(page: Page): boolean {
  return isTestimonialsPageBySlugOrName(page);
}

export function isTestimonialsNavItem(item: HeaderNavItem, testimonialsHref = TESTIMONIALS_ROUTE): boolean {
  if (item.href === testimonialsHref) return true;
  const hrefSlug = item.href.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (hrefSlug.includes('testimonial')) return true;
  const name = item.name.trim().toLowerCase();
  return name === 'testimonials' || name === 'testimonial';
}

export function findTestimonialsPage(pages?: Page[]): Page | undefined {
  return pages?.find((p) => isTestimonialsPage(p));
}

export function getTestimonialsPageHref(page?: Page | null): string {
  const slug = normalizePageSlug(page?.slug);
  if (slug) return `/${slug}`;
  return TESTIMONIALS_ROUTE;
}

export function getTestimonialsNavItem(pages?: Page[]): HeaderNavItem {
  const cmsPage = findTestimonialsPage(pages);
  return {
    id: cmsPage?._id ?? 'nav-testimonials',
    name: cmsPage?.name?.trim() || 'Testimonials',
    href: getTestimonialsPageHref(cmsPage),
  };
}

export function getPublishedNavPages(pages?: Page[]): Page[] {
  return (
    pages
      ?.filter((p) => p.status === 'published' && p.pageType !== 'home')
      .sort(
        (a, b) =>
          ((a as Page & { order?: number }).order ?? 0) -
          ((b as Page & { order?: number }).order ?? 0)
      ) ?? []
  );
}

export type HeaderNavItem = {
  id: string;
  name: string;
  href: string;
};

export type HomeHeaderNavEntry =
  | { kind: 'anchor'; id: string; name: string; href: string }
  | { kind: 'services-dropdown'; id: string; name: string; href: string }
  | { kind: 'serving-areas' };

function isHomeSectionEnabled(enabled: boolean | undefined): boolean {
  return enabled !== false;
}

export function isHomeServingAreasEnabled(homePage?: Page): boolean {
  if (!homePage) return false;
  const section = homePage.servingAreasSection;
  if (!section) return true;
  return isHomeSectionEnabled(section.enabled);
}

/** Header nav derived from enabled sections on the CMS home page (anchor links + serving areas). */
export function getHomeHeaderNavEntries(homePage?: Page): HomeHeaderNavEntry[] {
  if (!homePage) return [];

  const entries: HomeHeaderNavEntry[] = [];

  if (isHomeSectionEnabled(homePage.aboutSection?.enabled)) {
    entries.push({ kind: 'anchor', id: 'about', name: 'About', href: '/#about' });
  }
  if (isHomeSectionEnabled(homePage.servicesSection?.enabled)) {
    entries.push({ kind: 'anchor', id: 'services', name: 'Services', href: '/#services' });
  }
  if (isHomeServingAreasEnabled(homePage)) {
    entries.push({ kind: 'serving-areas' });
  }
  if (isHomeSectionEnabled(homePage.blogSection?.enabled)) {
    entries.push({ kind: 'anchor', id: 'blog', name: 'Blog', href: '/#blog' });
  }
  if (
    isHomeSectionEnabled(homePage.projectsSection?.enabled) ||
    isHomeSectionEnabled(homePage.projectSection?.enabled)
  ) {
    entries.push({ kind: 'anchor', id: 'projects', name: 'Projects', href: '/#projects' });
  }
  if (isHomeSectionEnabled(homePage.gallerySection?.enabled)) {
    entries.push({ kind: 'anchor', id: 'gallery', name: 'Gallery', href: '/#gallery' });
  }
  if (isHomeSectionEnabled(homePage.testimonialsSection?.enabled)) {
    entries.push({ kind: 'anchor', id: 'testimonials', name: 'Testimonials', href: '/#testimonials' });
  }
  if (isHomeSectionEnabled(homePage.contactSection?.enabled)) {
    entries.push({ kind: 'anchor', id: 'contact', name: 'Contact', href: '/#contact' });
  }

  return entries;
}

/** Main header links (excludes testimonials — use getTestimonialsNavItem for the left slot). */
/** Routes shown in the header left cluster (testimonials uses getTestimonialsNavItem). */
export const LEFT_HEADER_NAV_HREFS = ['/services', '/project-detail'] as const;

export function isLeftHeaderNavItem(item: HeaderNavItem): boolean {
  if (item.href === TESTIMONIALS_ROUTE || isTestimonialsNavItem(item)) return true;
  return (LEFT_HEADER_NAV_HREFS as readonly string[]).includes(item.href);
}

export function splitHeaderNavItems(
  testimonialsNav: HeaderNavItem,
  items: HeaderNavItem[]
): { leftNavItems: HeaderNavItem[]; rightNavItems: HeaderNavItem[] } {
  const leftNavItems: HeaderNavItem[] = [testimonialsNav];
  const seenLeft = new Set<string>([testimonialsNav.href]);

  for (const href of LEFT_HEADER_NAV_HREFS) {
    const item = items.find((i) => i.href === href);
    if (item && !seenLeft.has(item.href)) {
      leftNavItems.push(item);
      seenLeft.add(item.href);
    }
  }

  const rightNavItems = items.filter(
    (item) => !seenLeft.has(item.href) && !isTestimonialsNavItem(item)
  );

  return { leftNavItems, rightNavItems };
}

export function getHeaderNavItems(pages?: Page[]): HeaderNavItem[] {
  const published = getPublishedNavPages(pages);
  const seenHrefs = new Set<string>();
  const items: HeaderNavItem[] = [];

  for (const p of published) {
    if (isTestimonialsPage(p)) continue;
    const href = getPageHref(p);
    if (seenHrefs.has(href)) continue;
    seenHrefs.add(href);
    const item = { id: p._id, name: p.name, href };
    if (isTestimonialsNavItem(item)) continue;
    items.push(item);
  }

  return items
    .filter((item) => !isTestimonialsNavItem(item))
    .sort((a, b) => {
    const pageA = pages?.find((p) => getPageHref(p) === a.href);
    const pageB = pages?.find((p) => getPageHref(p) === b.href);
    const orderA = (pageA as Page & { order?: number })?.order ?? 999;
    const orderB = (pageB as Page & { order?: number })?.order ?? 999;
    return orderA - orderB;
  });
}

export type FooterNavLink = {
  id: string;
  label: string;
  href: string;
};

const FOOTER_PAGE_TYPE_ORDER: Page['pageType'][] = [
  'home',
  'about',
  'service-list',
  'blog-list',
  'project-detail',
  'contact',
];

/** Extra app routes when no dedicated CMS page exists in the list. */
const EXTRA_FOOTER_NAV: { slug: string; href: string; defaultName: string }[] = [
  { slug: 'testimonials', href: TESTIMONIALS_ROUTE, defaultName: 'Testimonials' },
  { slug: 'gallery', href: '/gallery', defaultName: 'Gallery' },
];

/** All published pages for footer Explore — same on every route (ignores per-page footer link overrides). */
export function getPublishedPageNavLinks(pages?: Page[]): FooterNavLink[] {
  const published = pages?.filter((p) => p.status === 'published' && p.name?.trim()) ?? [];
  const orderedPages: Page[] = [];
  const seenIds = new Set<string>();

  for (const type of FOOTER_PAGE_TYPE_ORDER) {
    const page = published.find((p) => p.pageType === type);
    if (page && !seenIds.has(page._id)) {
      orderedPages.push(page);
      seenIds.add(page._id);
    }
  }

  const sortedRest = [...published].sort(
    (a, b) =>
      ((a as Page & { order?: number }).order ?? 0) -
      ((b as Page & { order?: number }).order ?? 0)
  );

  for (const page of sortedRest) {
    if (!seenIds.has(page._id)) {
      orderedPages.push(page);
      seenIds.add(page._id);
    }
  }

  const seenHrefs = new Set<string>();
  const links: FooterNavLink[] = [];

  for (const page of orderedPages) {
    const href = getPageHref(page);
    if (seenHrefs.has(href)) continue;
    seenHrefs.add(href);
    links.push({ id: page._id, label: page.name.trim(), href });
  }

  return links;
}

/** All published pages for footer Explore — same on every route (ignores per-page footer link overrides). */
export function getFooterNavLinks(pages?: Page[]): FooterNavLink[] {
  const links = getPublishedPageNavLinks(pages);
  const seenHrefs = new Set(links.map((l) => l.href));
  const published = pages?.filter((p) => p.status === 'published' && p.name?.trim()) ?? [];

  for (const extra of EXTRA_FOOTER_NAV) {
    if (seenHrefs.has(extra.href)) continue;
    const cmsPage = published.find((p) => normalizePageSlug(p.slug) === extra.slug);
    // Only add extras when a real CMS page exists — never hardcode empty routes.
    if (!cmsPage) continue;
    links.push({
      id: cmsPage._id,
      label: cmsPage.name.trim(),
      href: getPageHref(cmsPage),
    });
    seenHrefs.add(extra.href);
  }

  return links;
}

/** Header nav: published CMS pages, ensuring testimonials uses its CMS slug. */
export function getHeaderNavLinks(pages?: Page[]): FooterNavLink[] {
  const links = getPublishedPageNavLinks(pages);

  // Fix any existing testimonials entry to use the CMS slug
  for (let i = 0; i < links.length; i++) {
    const page = pages?.find((p) => p._id === links[i].id);
    if (page && isTestimonialsPage(page)) {
      links[i] = {
        ...links[i],
        label: page.name?.trim() || links[i].label,
        href: getTestimonialsPageHref(page),
      };
      return links;
    }
  }

  const alreadyHasTestimonials = links.some((l) => {
    if (l.href === TESTIMONIALS_ROUTE || l.href.replace(/^\/+|\/+$/g, '').toLowerCase().includes('testimonial')) {
      return true;
    }
    return l.label.trim().toLowerCase().includes('testimonial');
  });

  if (alreadyHasTestimonials) return links;

  const testimonialsPage = findTestimonialsPage(pages);
  const homePage = pages?.find((p) => p.pageType === 'home');
  const hasTestimonialsPage = testimonialsPage?.status === 'published';
  const hasHomeTestimonials =
    homePage?.status === 'published' &&
    isHomeSectionEnabled(homePage.testimonialsSection?.enabled);

  if (!hasTestimonialsPage && !hasHomeTestimonials) return links;

  const nav = getTestimonialsNavItem(pages);
  const item: FooterNavLink = { id: nav.id, label: nav.name, href: nav.href };
  const contactIdx = links.findIndex((l) => {
    const page = pages?.find((p) => p._id === l.id);
    return page?.pageType === 'contact';
  });
  if (contactIdx >= 0) links.splice(contactIdx, 0, item);
  else links.push(item);

  return links;
}

/** Page-based header entries with optional services dropdown and nested areas menu. */
export function buildHeaderNavEntries(
  pages?: Page[],
  options?: { includeServingAreas?: boolean; includeServicesDropdown?: boolean }
): HomeHeaderNavEntry[] {
  const entries: HomeHeaderNavEntry[] = getHeaderNavLinks(pages).map((link) => ({
    kind: 'anchor',
    id: link.id,
    name: link.label,
    href: link.href,
  }));

  const servicePage = pages?.find((p) => p.pageType === 'service-list' && p.status === 'published');
  if (!servicePage) return entries;

  const servicesIdx = entries.findIndex((e) => e.kind === 'anchor' && e.id === servicePage._id);
  if (servicesIdx < 0) return entries;

  let insertAfterIdx = servicesIdx;

  if (options?.includeServicesDropdown) {
    const anchor = entries[servicesIdx] as Extract<HomeHeaderNavEntry, { kind: 'anchor' }>;
    entries[servicesIdx] = {
      kind: 'services-dropdown',
      id: anchor.id,
      name: anchor.name,
      href: anchor.href,
    };
    insertAfterIdx = servicesIdx;
  }

  if (options?.includeServingAreas) {
    entries.splice(insertAfterIdx + 1, 0, { kind: 'serving-areas' });
  }

  return entries;
}

export function getCopyrightText(site?: Site | null): string {
  const footerCopyright = tiptapToText(site?.footer?.copyright);
  if (footerCopyright) return footerCopyright;
  return `©${new Date().getFullYear()}`;
}

export function getPrimaryHeroImageFromPages(pages?: Page[]): string {
  const home = pages?.find((p) => p.pageType === 'home');
  return getPrimaryHeroImageFromHero(home?.hero);
}

export function getPrimaryHeroImageFromHero(hero?: Page['hero']): string {
  if (!hero) return '';
  const h = hero as Page['hero'] & { images?: unknown[] };
  const raw = h.mediaItems?.[0] || h.images?.[0] || hero.media;
  if (!raw) return '';
  if (typeof raw === 'string') return getImageSrc(raw);
  const o = raw as { url?: string; image?: { url?: string } };
  const url = o.url || o.image?.url;
  return url ? getImageSrc(url) : '';
}
