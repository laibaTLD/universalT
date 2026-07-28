import { Metadata } from 'next'
import { generateMetadata as generatePageMetadata, getPageSeoData } from '@/app/lib/metadata'
import type { Site, ServiceAreaPage } from '@/app/lib/types'
import api from '@/app/lib/fetch-api'
import { findServiceAreaPage } from '@/app/lib/serviceAreaSlugs'
import { extractServiceAreaPagesList } from '@/app/lib/serviceAreaPageData'
import ServiceAreaClient from './ServiceAreaClient'

interface ServiceAreaPageProps {
  params: Promise<{ serviceSlug: string; areaSlug: string }>
}

export async function generateMetadata({ params }: ServiceAreaPageProps): Promise<Metadata> {
  const { serviceSlug, areaSlug } = await params
  
  try {
    // Fetch default site first
    const defaultSiteResponse = await api.get('/public/sites/default')
    
    if (defaultSiteResponse.success && defaultSiteResponse.data) {
      const site: Site = defaultSiteResponse.data
      
      // Try to fetch service area page by service and area
      const pagesResponse = await api.get(`/public/sites/${site.slug}/service-area-pages`, {
        silent: true,
      })
      const pages = extractServiceAreaPagesList(pagesResponse)
      const serviceAreaPage = findServiceAreaPage(pages, serviceSlug, areaSlug)
      
      if (serviceAreaPage) {
        return generatePageMetadata(getPageSeoData(serviceAreaPage as unknown as ServiceAreaPage), site)
      }
    }
  } catch (error) {
    console.log('Service area page not found in API, using fallback metadata')
  }
  
  // Fallback metadata for the area
  const areaName = areaSlug ? areaSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Service Area';
  return {
    title: `${areaName} - Construction Services`,
    description: `Professional construction and renovation services in ${areaName}. Contact us for all your building needs.`,
  }
}

export default async function ServiceAreaPage({ params }: ServiceAreaPageProps) {
  const { serviceSlug, areaSlug } = await params
  return <ServiceAreaClient serviceSlug={serviceSlug} areaSlug={areaSlug} />
}
