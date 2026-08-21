import type { BlogPost, Page, Project, Service, Site } from '@/app/lib/types';
import { cache } from 'react';
import {
  blogApi,
  pageApi,
  projectApi,
  serviceApi,
  serviceAreaApi,
  siteApi,
  testimonialApi,
} from '@/app/lib/api';

export type SiteBootstrapData = {
  site: Site | null;
  pages: Page[];
  services: Service[];
  blogPosts: BlogPost[];
  projects: Project[];
  testimonials: { title?: string; description?: string; testimonials: unknown[] } | null;
  serviceAreaPages: unknown[];
};

/** Server-side bootstrap so first paint has real content (no blank reload flash). */
export const fetchSiteBootstrap = cache(async (): Promise<SiteBootstrapData> => {
  const empty: SiteBootstrapData = {
    site: null,
    pages: [],
    services: [],
    blogPosts: [],
    projects: [],
    testimonials: null,
    serviceAreaPages: [],
  };

  const siteSlug = process.env.NEXT_PUBLIC_WEBBUILDER_SITE_SLUG;
  if (!siteSlug) return empty;

  try {
    const site = await siteApi.getSiteBySlug(siteSlug, { silent: true });
    if (!site?.slug) return empty;

    const [pages, services, blogPosts, projects, testimonials, serviceAreaPages] =
      await Promise.all([
        pageApi.getPagesBySite(site.slug, { silent: true }).catch(() => [] as Page[]),
        serviceApi.getServicesBySite(site.slug, { silent: true }).catch(() => [] as Service[]),
        blogApi.getPostsBySite(site.slug).catch(() => [] as BlogPost[]),
        projectApi.getProjectsBySite(site.slug, undefined, { silent: true }).catch(() => [] as Project[]),
        testimonialApi.getTestimonialsBySite(site.slug).catch(() => null),
        serviceAreaApi.getServiceAreaPagesBySite(site.slug, { silent: true }).catch(() => []),
      ]);

    return {
      site,
      pages: Array.isArray(pages) ? pages : [],
      services: Array.isArray(services) ? services : [],
      blogPosts: Array.isArray(blogPosts) ? blogPosts : [],
      projects: Array.isArray(projects) ? projects : [],
      testimonials,
      serviceAreaPages: Array.isArray(serviceAreaPages) ? serviceAreaPages : [],
    };
  } catch {
    return empty;
  }
});
