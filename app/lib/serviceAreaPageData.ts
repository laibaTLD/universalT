import type { ServingAreasdetailSectionData } from '@/app/components/sections/ServingAreasdetailSection';
import { findServiceAreaPage } from '@/app/lib/serviceAreaSlugs';

export function resolvePublishedServiceAreaPage(
  serviceAreaPages: unknown[] | undefined,
  serviceSlug: string,
  citySlug: string
): Record<string, unknown> | null {
  const page = findServiceAreaPage(serviceAreaPages, serviceSlug, citySlug);
  if (!page) return null;

  const status = (page as { status?: string }).status;
  if (status && status !== 'published') return null;

  return page;
}

export function mapServiceAreaPageToSectionData(
  serviceAreaPage: Record<string, unknown>
): ServingAreasdetailSectionData {
  return {
    hero: serviceAreaPage.hero,
    highlights: serviceAreaPage.highlights,
    about: serviceAreaPage.about,
    ourServices: serviceAreaPage.ourServices ?? serviceAreaPage.services,
    pageServiceId:
      typeof serviceAreaPage.serviceId === 'string'
        ? serviceAreaPage.serviceId
        : (serviceAreaPage.serviceId as { _id?: string })?._id,
    cta: serviceAreaPage.cta,
    serviceDetails: serviceAreaPage.serviceDetails,
    serviceOverview: serviceAreaPage.serviceOverview,
    whyChooseUs: serviceAreaPage.whyChooseUs,
    faqs: serviceAreaPage.faqs,
    servingAreas: serviceAreaPage.servingAreas,
  };
}

export function extractServiceAreaPagesList(response: unknown): unknown[] {
  if (!response || typeof response !== 'object') return [];

  const record = response as { data?: unknown };
  const data = record.data;

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const nested = (data as { data?: unknown }).data;
    if (Array.isArray(nested)) return nested;
  }

  return [];
}
