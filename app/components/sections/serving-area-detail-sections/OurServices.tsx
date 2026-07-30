'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { OptimizedImage, IMAGE_QUALITY_HIGH, IMAGE_SIZES } from '@/app/components/ui/OptimizedImage';
import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import type { Service } from '@/app/lib/types';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { useSectionTheme } from '@/app/hooks/useSectionTheme';
import { cn, getImageSrc } from '@/app/lib/utils';
import { tiptapToText } from '@/app/lib/seo';
import { normalizeSlug, resolveServiceSlug } from '@/app/lib/serviceAreaSlugs';

interface OurServicesProps {
  /** CMS `ourServices` — SEO copy + optional linked services / card items */
  services?: unknown;
  /** Parent service for this area page — included in sticky cards */
  pageServiceId?: string;
  className?: string;
}

type ContentBlock = {
  title?: unknown;
  description?: unknown;
  titleText: string;
  descriptionText: string;
};

type DisplayService = {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
};

type SectionData = {
  title?: unknown;
  description?: unknown;
  label?: string;
  imageUrl?: string;
  imageAlt?: string;
  blocks: ContentBlock[];
  serviceIds: string[];
  staticCards: DisplayService[];
};

const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/6195895/pexels-photo-6195895.jpeg';

function normalizeImage(raw: unknown): { url: string; altText?: string } | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string' && raw.trim()) return { url: raw.trim() };
  if (typeof raw === 'object' && raw !== null && 'url' in raw) {
    const record = raw as { url?: string; altText?: string };
    if (record.url?.trim()) return { url: record.url.trim(), altText: record.altText };
  }
  return undefined;
}

function normalizeHref(href: string): string {
  const t = href.trim();
  if (t.startsWith('http') || t.startsWith('mailto:') || t.startsWith('tel:')) return t;
  return t.startsWith('/') ? t : `/${t}`;
}

function hasRichContent(content: unknown): boolean {
  if (content == null || content === '') return false;
  if (typeof content === 'object') return Boolean(tiptapToText(content));
  return Boolean(String(content).trim());
}

function isVisibleService(service: Service): boolean {
  return service.status !== 'draft' && service.status !== 'archived';
}

function formatServicePrice(service: Service): string {
  if (service.price?.trim()) return service.price.trim();
  if (service.priceType === 'quote') return 'Quote';
  if (service.priceType === 'range') return 'Custom';
  return '';
}

function mapLiveService(service: Service): DisplayService {
  const imageUrl = service.thumbnailImage?.url
    ? getImageSrc(service.thumbnailImage.url)
    : service.galleryImages?.[0]?.url
      ? getImageSrc(service.galleryImages[0].url)
      : FALLBACK_IMAGE;

  return {
    id: service._id,
    name: service.name,
    description: tiptapToText(service.shortDescription) || '',
    price: formatServicePrice(service),
    imageUrl,
    imageAlt:
      service.thumbnailImage?.altText ||
      service.galleryImages?.[0]?.altText ||
      service.name,
    href: `/service/${resolveServiceSlug(service)}`,
  };
}

function mapStaticCard(raw: unknown, index: number): DisplayService | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const name = tiptapToText(item.title ?? item.name ?? item.label);
  if (!name) return null;

  const image = normalizeImage(item.image ?? item.thumbnail ?? item.media);
  const cta = item.ctaButton as { text?: string; url?: string; label?: string; href?: string } | undefined;
  const href = normalizeHref(
    (typeof item.href === 'string' && item.href) ||
      (typeof item.url === 'string' && item.url) ||
      cta?.url ||
      cta?.href ||
      '/contact-us'
  );

  return {
    id: (typeof item._id === 'string' && item._id) || (typeof item.id === 'string' && item.id) || `static-${index}`,
    name,
    description: tiptapToText(item.description ?? item.shortDescription),
    price: typeof item.price === 'string' ? item.price : '',
    imageUrl: image?.url ? getImageSrc(image.url) : FALLBACK_IMAGE,
    imageAlt: image?.altText?.trim() || name,
    href,
  };
}

function itemLooksLikeCard(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const item = raw as Record<string, unknown>;
  return Boolean(
    item.image ||
      item.thumbnail ||
      item.ctaButton ||
      item.features ||
      item.price ||
      item.href ||
      item.url
  );
}

function normalizeBlock(raw: unknown): ContentBlock | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const title = item.title ?? item.heading ?? item.label;
  const description = item.description ?? item.content ?? item.body ?? item.text;
  const titleText = tiptapToText(title);
  const descriptionText = tiptapToText(description);
  if (!titleText && !descriptionText) return null;
  return { title, description, titleText, descriptionText };
}

function extractLinkedServiceIds(services: unknown): string[] {
  if (!services || typeof services !== 'object') return [];
  const data = services as Record<string, unknown>;
  if (!Array.isArray(data.serviceIds)) return [];
  return data.serviceIds.filter((id): id is string => typeof id === 'string' && Boolean(id));
}

function buildDisplayServices(
  liveServices: Service[],
  linkedServiceIds: string[],
  pageServiceId?: string,
  serviceSlugFromUrl?: string
): DisplayService[] {
  const byId = new Map(liveServices.filter(isVisibleService).map((s) => [s._id, s]));
  const selected: Service[] = [];
  const seen = new Set<string>();

  const push = (service: Service | undefined) => {
    if (!service || seen.has(service._id) || !isVisibleService(service)) return;
    seen.add(service._id);
    selected.push(service);
  };

  for (const id of linkedServiceIds) push(byId.get(id));
  if (pageServiceId) push(byId.get(pageServiceId));
  if (serviceSlugFromUrl) {
    const normSlug = normalizeSlug(serviceSlugFromUrl);
    push(liveServices.find((s) => resolveServiceSlug(s) === normSlug));
  }

  // Keep parent service first when present
  if (pageServiceId || serviceSlugFromUrl) {
    const normSlug = serviceSlugFromUrl ? normalizeSlug(serviceSlugFromUrl) : '';
    const primary =
      (pageServiceId && selected.find((s) => s._id === pageServiceId)) ||
      (normSlug && selected.find((s) => resolveServiceSlug(s) === normSlug));
    if (primary) {
      return [primary, ...selected.filter((s) => s._id !== primary._id)].map(mapLiveService);
    }
  }

  return selected.map(mapLiveService);
}

function normalizeSection(services: unknown): SectionData | null {
  if (!services || typeof services !== 'object') return null;

  const data = services as Record<string, unknown>;
  if (data.enabled === false) return null;

  const serviceIds = extractLinkedServiceIds(services);
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const rawBlocks = (data.blocks ?? data.sections ?? data.contentBlocks) as unknown[] | undefined;

  const staticCards = rawItems
    .map((item, i) => (itemLooksLikeCard(item) ? mapStaticCard(item, i) : null))
    .filter((c): c is DisplayService => Boolean(c));

  const blocksFromDedicated =
    rawBlocks?.map(normalizeBlock).filter((b): b is ContentBlock => Boolean(b)) ?? [];

  // Items that aren't card-shaped become SEO content blocks
  const blocksFromItems = rawItems
    .filter((item) => !itemLooksLikeCard(item))
    .map(normalizeBlock)
    .filter((b): b is ContentBlock => Boolean(b));

  const blocks = [...blocksFromDedicated, ...blocksFromItems];

  let image = normalizeImage(data.image ?? data.backgroundImage ?? data.media);
  if (!image) {
    for (const raw of [...(rawBlocks ?? []), ...rawItems]) {
      if (!raw || typeof raw !== 'object') continue;
      const found = normalizeImage((raw as Record<string, unknown>).image);
      if (found && !itemLooksLikeCard(raw)) {
        image = found;
        break;
      }
    }
  }

  const title = data.title;
  const description = data.description ?? data.subtitle;
  const label = typeof data.label === 'string' ? data.label : undefined;

  if (
    !title &&
    !description &&
    !image &&
    blocks.length === 0 &&
    serviceIds.length === 0 &&
    staticCards.length === 0
  ) {
    return null;
  }

  return {
    title,
    description,
    label,
    imageUrl: image?.url ? getImageSrc(image.url) : undefined,
    imageAlt: image?.altText?.trim() || undefined,
    blocks,
    serviceIds,
    staticCards,
  };
}

function ContentBlockView({
  block,
  fonts,
  colors,
}: {
  block: ContentBlock;
  fonts: { heading: string; body: string };
  colors: { mainText: string; secondaryText: string };
}) {
  const showTitle = Boolean(block.titleText) || hasRichContent(block.title);
  const showBody = Boolean(block.descriptionText) || hasRichContent(block.description);

  return (
    <div className="space-y-4">
      {showTitle && (
        <h3
          className="text-[clamp(1.05rem,1.6vw,1.25rem)] font-semibold leading-snug tracking-tight"
          style={{ fontFamily: fonts.body, color: colors.mainText }}
        >
          {hasRichContent(block.title) ? (
            <TiptapRenderer content={block.title} as="inline" />
          ) : (
            block.titleText
          )}
        </h3>
      )}
      {showBody && hasRichContent(block.description) && (
        <div
          className="space-y-4 text-base font-normal leading-[1.75] sm:text-[1.0625rem] [&_strong]:font-semibold"
          style={{ color: colors.secondaryText, fontFamily: fonts.body }}
        >
          <TiptapRenderer content={block.description} className="text-inherit" />
        </div>
      )}
      {showBody && !hasRichContent(block.description) && block.descriptionText && (
        <p
          className="text-base font-normal leading-[1.75] sm:text-[1.0625rem]"
          style={{ color: colors.secondaryText, fontFamily: fonts.body }}
        >
          {block.descriptionText}
        </p>
      )}
    </div>
  );
}

function ServiceCard({
  service,
  index,
  borderColor,
  colors,
  fonts,
}: {
  service: DisplayService;
  index: number;
  borderColor: string;
  colors: { mainText: string; secondaryText: string; pageBackground: string };
  fonts: { heading: string; body: string };
}) {
  const number = String(index + 1).padStart(2, '0');
  const isExternal =
    service.href.startsWith('http') ||
    service.href.startsWith('mailto:') ||
    service.href.startsWith('tel:');

  const card = (
    <article
      className="flex flex-col overflow-hidden border bg-white transition-shadow duration-300 hover:shadow-md"
      style={{ borderColor }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <OptimizedImage
          src={service.imageUrl}
          alt={service.imageAlt}
          fill
          sizes={IMAGE_SIZES.card}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {service.price && (
          <span
            className="absolute top-3 right-3 px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: colors.pageBackground,
              color: colors.mainText,
              fontFamily: fonts.body,
            }}
          >
            {service.price}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <span
          className="mb-1.5 text-xs tabular-nums"
          style={{ color: colors.secondaryText, opacity: 0.55 }}
        >
          {number}
        </span>
        <h3
          className="text-base leading-snug sm:text-lg"
          style={{ fontFamily: fonts.heading, color: colors.mainText }}
        >
          {service.name}
        </h3>
        {service.description && (
          <p
            className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed"
            style={{ color: colors.secondaryText }}
          >
            {service.description}
          </p>
        )}
        <span
          className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.15em]"
          style={{ color: colors.mainText }}
        >
          View service
          <span aria-hidden>→</span>
        </span>
      </div>
    </article>
  );

  return (
    <li className="group">
      {isExternal ? (
        <a href={service.href} className="block">
          {card}
        </a>
      ) : (
        <Link href={service.href} className="block">
          {card}
        </Link>
      )}
    </li>
  );
}

/** Sticky service cards (left) + SEO article content (right). */
export const OurServices: React.FC<OurServicesProps> = ({
  services,
  pageServiceId,
  className,
}) => {
  const theme = useSectionTheme();
  const { colors, fonts } = theme;
  const { services: liveServices } = useWebBuilder();
  const params = useParams();
  const serviceSlugFromUrl =
    typeof params?.serviceSlug === 'string' ? params.serviceSlug : '';

  const section = useMemo(() => normalizeSection(services), [services]);

  const displayServices = useMemo(() => {
    if (!section) return [];
    const fromLive = buildDisplayServices(
      liveServices,
      section.serviceIds,
      pageServiceId,
      serviceSlugFromUrl
    );
    if (fromLive.length > 0) return fromLive;
    return section.staticCards;
  }, [section, liveServices, pageServiceId, serviceSlugFromUrl]);

  const titleText = useMemo(() => tiptapToText(section?.title), [section?.title]);
  const descriptionText = useMemo(
    () => tiptapToText(section?.description),
    [section?.description]
  );

  if (!section) return null;

  const showTitle = hasRichContent(section.title) || Boolean(titleText);
  const showDescription = hasRichContent(section.description) || Boolean(descriptionText);
  const hasArticle =
    showTitle || showDescription || Boolean(section.imageUrl) || section.blocks.length > 0;
  const hasCards = displayServices.length > 0;

  if (!hasArticle && !hasCards) return null;

  const borderColor = `color-mix(in srgb, ${colors.mainText} 12%, transparent)`;
  const eyebrow = section.label?.trim() || 'Services';
  const splitAt =
    section.blocks.length <= 1 ? section.blocks.length : Math.ceil(section.blocks.length / 2);
  const blocksBefore = section.blocks.slice(0, splitAt);
  const blocksAfter = section.blocks.slice(splitAt);
  const imageAlt = section.imageAlt || titleText || 'Our services';

  return (
    <section
      className={cn('relative overflow-visible border-t', className)}
      style={{
        backgroundColor: colors.pageBackground,
        borderColor,
        fontFamily: fonts.body,
      }}
    >
      <div className="mx-auto w-full max-w-[90rem] px-6 py-16 sm:py-20 md:px-12 lg:px-16 lg:py-24 xl:px-20">
        <div
          className={cn(
            'grid grid-cols-1 gap-10 lg:gap-12 xl:gap-16',
            hasCards && hasArticle && 'lg:grid-cols-12'
          )}
        >
          {/* Sticky cards — left */}
          {hasCards && (
            <aside
              className={cn(
                'min-w-0',
                hasArticle ? 'lg:col-span-5 xl:col-span-4' : 'mx-auto w-full max-w-md'
              )}
            >
              <div className="lg:sticky lg:top-28 lg:z-10">
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                  {displayServices.map((service, index) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      index={index}
                      borderColor={borderColor}
                      colors={colors}
                      fonts={fonts}
                    />
                  ))}
                </ul>
              </div>
            </aside>
          )}

          {/* SEO article — right */}
          {hasArticle && (
            <article
              className={cn(
                'min-w-0 text-left',
                hasCards ? 'lg:col-span-7 xl:col-span-8' : 'mx-auto max-w-3xl'
              )}
            >
              <header>
                <p
                  className="mb-5 text-[11px] font-medium uppercase tracking-[0.28em] sm:mb-6"
                  style={{ fontFamily: fonts.body }}
                >
                  <span style={{ color: colors.secondaryText }}>[ </span>
                  <span style={{ color: colors.mainText }}>{eyebrow}</span>
                  <span style={{ color: colors.secondaryText }}> ]</span>
                </p>

                {showTitle && (
                  <h2
                    className="text-[clamp(1.5rem,2.6vw,2.15rem)] font-normal leading-[1.15] tracking-tight"
                    style={{ fontFamily: fonts.heading, color: colors.mainText }}
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
                      'mt-5 space-y-4 text-base font-normal leading-[1.75] sm:mt-6 sm:text-[1.0625rem] [&_strong]:font-semibold',
                      !showTitle && 'mt-0'
                    )}
                    style={{ color: colors.secondaryText }}
                  >
                    <TiptapRenderer content={section.description} className="text-inherit" />
                  </div>
                )}

                {showDescription && !hasRichContent(section.description) && descriptionText && (
                  <p
                    className={cn(
                      'mt-5 text-base font-normal leading-[1.75] sm:mt-6 sm:text-[1.0625rem]',
                      !showTitle && 'mt-0'
                    )}
                    style={{ color: colors.secondaryText }}
                  >
                    {descriptionText}
                  </p>
                )}
              </header>

              {blocksBefore.length > 0 && (
                <div className="mt-10 space-y-10 sm:mt-12 sm:space-y-12">
                  {blocksBefore.map((block, index) => (
                    <ContentBlockView
                      key={`before-${block.titleText}-${index}`}
                      block={block}
                      fonts={fonts}
                      colors={colors}
                    />
                  ))}
                </div>
              )}

              {section.imageUrl && (
                <div
                  className={cn(
                    'relative aspect-[16/10] w-full overflow-hidden rounded-xl sm:aspect-[2/1]',
                    showTitle || showDescription || blocksBefore.length > 0
                      ? 'mt-10 sm:mt-12'
                      : 'mt-0'
                  )}
                >
                  <OptimizedImage
                    src={section.imageUrl}
                    alt={imageAlt}
                    fill
                    sizes={IMAGE_SIZES.sectionWide}
                    quality={IMAGE_QUALITY_HIGH}
                    className="object-cover object-center"
                  />
                </div>
              )}

              {blocksAfter.length > 0 && (
                <div className="mt-10 space-y-10 sm:mt-12 sm:space-y-12">
                  {blocksAfter.map((block, index) => (
                    <ContentBlockView
                      key={`after-${block.titleText}-${index}`}
                      block={block}
                      fonts={fonts}
                      colors={colors}
                    />
                  ))}
                </div>
              )}
            </article>
          )}
        </div>
      </div>
    </section>
  );
};

export default OurServices;
