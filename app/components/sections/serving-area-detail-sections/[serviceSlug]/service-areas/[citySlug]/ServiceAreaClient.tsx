'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { Footer } from '@/app/components/layout/Footer';
import { ServingAreasdetailSection } from '@/app/components/sections/ServingAreasdetailSection';
import {
  mapServiceAreaPageToSectionData,
  resolvePublishedServiceAreaPage,
} from '@/app/lib/serviceAreaPageData';

interface ServiceAreaClientProps {
  serviceSlug: string;
  citySlug: string;
}

export default function ServiceAreaClient({
  serviceSlug: serviceSlugProp,
  citySlug: citySlugProp,
}: ServiceAreaClientProps) {
  const params = useParams();
  const serviceSlug = (params.serviceSlug as string) || serviceSlugProp;
  const citySlug = (params.citySlug as string) || citySlugProp;

  const { serviceAreaPages, loading: siteLoading } = useWebBuilder();

  const serviceAreaPage = useMemo(
    () => resolvePublishedServiceAreaPage(serviceAreaPages, serviceSlug, citySlug),
    [serviceAreaPages, serviceSlug, citySlug]
  );

  if (siteLoading) return null;

  if (!serviceAreaPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Area Not Found</h2>
          <p className="text-gray-600 mb-4">The service area page could not be found.</p>
          <a href="/" className="inline-block text-blue-600 hover:underline">
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main>
        <ServingAreasdetailSection data={mapServiceAreaPageToSectionData(serviceAreaPage)} />
      </main>
      <Footer />
    </div>
  );
}
