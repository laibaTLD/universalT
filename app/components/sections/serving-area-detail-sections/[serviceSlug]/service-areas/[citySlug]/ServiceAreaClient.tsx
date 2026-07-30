'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useWebBuilder } from '@/app/providers/WebBuilderProvider';
import { Footer } from '@/app/components/layout/Footer';
import { ServingAreasdetailSection } from '@/app/components/sections/ServingAreasdetailSection';
import api from '@/app/lib/fetch-api';

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

  const { site } = useWebBuilder();
  const [serviceAreaPage, setServiceAreaPage] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceAreaPage = async () => {
      if (!site) return;

      try {
        setLoading(true);
        setError(null);

        const response = await api.get(
          `/public/sites/${site.slug}/service-areas/by-service/${serviceSlug}/${citySlug}`
        );

        if (response.success) {
          setServiceAreaPage(response.data);
        } else {
          setError('Service area page not found');
        }
      } catch {
        setError('Failed to load service area page');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceAreaPage();
  }, [site, serviceSlug, citySlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading service area page...</p>
        </div>
      </div>
    );
  }

  if (error || !serviceAreaPage) {
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
        <ServingAreasdetailSection
          data={{
            hero: serviceAreaPage.hero,
            highlights: serviceAreaPage.highlights,
            about: serviceAreaPage.about,
            ourServices: serviceAreaPage.ourServices,
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
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
