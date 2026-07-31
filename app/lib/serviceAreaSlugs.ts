/** Shared slug + link helpers for service area pages. */

export function normalizeSlug(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function resolveServiceSlug(service: { slug?: string; name?: string }): string {
  if (typeof service?.slug === 'string' && service.slug.trim()) {
    return normalizeSlug(service.slug);
  }
  return normalizeSlug(service?.name || 'service');
}

export function getAreaCity(area: unknown): string {
  if (typeof area === 'string') return area.trim();
  const city = (area as { city?: string; name?: string })?.city ?? (area as { name?: string })?.name;
  return typeof city === 'string' ? city.trim() : '';
}

export function getAreaRegion(area: unknown): string {
  if (typeof area === 'string') return '';
  const record = area as { region?: string; state?: string };
  const region = record?.region ?? record?.state;
  return typeof region === 'string' ? region.trim() : '';
}

export function getAreaDisplayName(area: unknown): string {
  const city = getAreaCity(area);
  const region = getAreaRegion(area);
  if (!city) return '';
  return region ? `${city}, ${region}` : city;
}

export function buildAreaSlugCandidates(area: unknown): string[] {
  const seen = new Set<string>();
  const add = (value: string) => {
    const slug = normalizeSlug(value);
    if (slug) seen.add(slug);
  };

  if (area && typeof area === 'object') {
    const record = area as { slug?: string };
    if (record.slug) add(record.slug);
  }

  const city = getAreaCity(area);
  const region = getAreaRegion(area);
  if (city) {
    add(city);
    if (region) add(`${city}-${region}`);
  }

  return [...seen];
}

export function getServiceSlugFromAreaPage(page: {
  serviceId?: { slug?: string } | string;
  serviceSlug?: string;
}): string {
  if (typeof page.serviceSlug === 'string' && page.serviceSlug.trim()) {
    return normalizeSlug(page.serviceSlug);
  }
  if (page.serviceId && typeof page.serviceId === 'object' && page.serviceId.slug) {
    return normalizeSlug(page.serviceId.slug);
  }
  return '';
}

export function findServiceAreaPage(
  serviceAreaPages: unknown[] | undefined,
  serviceSlug: string,
  areaOrCitySlug: unknown
): Record<string, unknown> | undefined {
  if (!serviceAreaPages?.length) return undefined;

  const normService = normalizeSlug(serviceSlug);
  const slugCandidates =
    typeof areaOrCitySlug === 'string' && !getAreaCity(areaOrCitySlug)
      ? [normalizeSlug(areaOrCitySlug)]
      : buildAreaSlugCandidates(areaOrCitySlug);

  const cityLower = getAreaCity(areaOrCitySlug).toLowerCase();

  return serviceAreaPages.find((raw) => {
    const page = raw as { slug?: string; city?: string; serviceId?: { slug?: string }; serviceSlug?: string };
    if (getServiceSlugFromAreaPage(page) !== normService) return false;
    const pageSlug = normalizeSlug(page.slug || '');
    if (slugCandidates.some((c) => c === pageSlug)) return true;
    if (cityLower && (page.city || '').trim().toLowerCase() === cityLower) return true;
    return false;
  }) as Record<string, unknown> | undefined;
}

export const SERVICE_AREA_ROUTE_SEGMENT = 'service-areas';

export function getServiceAreaPageHref(
  serviceSlug: string,
  area: unknown,
  serviceAreaPages?: unknown[]
): string {
  const normService = normalizeSlug(serviceSlug);
  const matched = findServiceAreaPage(serviceAreaPages, normService, area);
  const citySlug = matched?.slug
    ? normalizeSlug(String(matched.slug))
    : buildAreaSlugCandidates(area)[0] || 'area';

  return `/service/${normService}/${SERVICE_AREA_ROUTE_SEGMENT}/${citySlug}`;
}
