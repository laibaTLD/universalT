import { Site, Page, Service, BlogPost, Project } from './types';
import api from './fetch-api';
import { getImageSrc } from './utils';

type ApiGetOptions = { silent?: boolean };

// Site API
export const siteApi = {
  getSiteBySlug: async (slug: string, options?: ApiGetOptions): Promise<Site> => {
    const response = await api.get(`/public/sites/${slug}`, options);
    return response.data?.data ?? response.data;
  },
  
  getSites: async (): Promise<Site[]> => {
    const response = await api.get('/sites');
    return response.data?.data ?? response.data;
  },
};

// Page API
export const pageApi = {
  getPagesBySite: async (siteSlug: string, options?: ApiGetOptions): Promise<Page[]> => {
    const response = await api.get(`/public/sites/${siteSlug}/pages`, options);
    return response.data?.data ?? response.data;
  },
  
  getPageBySlug: async (siteSlug: string, pageSlug: string): Promise<Page> => {
    const response = await api.get(`/public/sites/${siteSlug}/pages/${pageSlug}`);
    return response.data?.data ?? response.data;
  },
  
  getPage: async (pageId: string): Promise<Page> => {
    const response = await api.get(`/pages/${pageId}`);
    return response.data;
  },
};

// Service API
export const serviceApi = {
  getServicesBySite: async (siteSlug: string, options?: ApiGetOptions): Promise<Service[]> => {
    const response = await api.get(`/public/sites/${siteSlug}/services`, options);
    return response.data?.data ?? response.data;
  },
  
  getServiceBySlug: async (siteSlug: string, serviceSlug: string): Promise<Service> => {
    const response = await api.get(`/public/sites/${siteSlug}/services/${serviceSlug}`);
    return response.data?.data ?? response.data;
  },
  
  getServices: async (serviceIds: string[]): Promise<Service[]> => {
    const response = await api.post('/public/services/batch', { serviceIds });
    return response.data?.data ?? response.data;
  },
};

// Blog API
export const blogApi = {
  getPostsBySite: async (siteSlug: string, limit?: number): Promise<BlogPost[]> => {
    const url = limit ? `/public/sites/${siteSlug}/blog?limit=${limit}` : `/public/sites/${siteSlug}/blog`;
    const response = await api.get(url);
    return response.data?.data ?? response.data;
  },
  
  getPostBySlug: async (siteSlug: string, postSlug: string): Promise<BlogPost> => {
    const response = await api.get(`/public/sites/${siteSlug}/blog/${postSlug}`);
    return response.data?.data ?? response.data;
  },
};

// Projects API
export const projectApi = {
  getProjectsBySite: async (siteSlug: string, limit?: number, options?: ApiGetOptions): Promise<Project[]> => {
    const url = limit ? `/public/sites/${siteSlug}/projects?limit=${limit}` : `/public/sites/${siteSlug}/projects`;
    const response = await api.get(url, options);
    return response.data?.data ?? response.data;
  },

  getProjectBySlug: async (siteSlug: string, projectSlug: string): Promise<Project> => {
    const response = await api.get(`/public/sites/${siteSlug}/projects/${projectSlug}`);
    return response.data?.data ?? response.data;
  },
};

// Testimonials API
export const testimonialApi = {
  getTestimonialsBySite: async (siteSlug: string): Promise<{ title?: string; description?: string; testimonials: any[] }> => {
    const response = await api.get(`/testimonials?siteSlug=${siteSlug}`);
    const data = response.data?.data ?? response.data ?? { testimonials: [] };
    return data;
  },
};

// Service Area Pages API
export const serviceAreaApi = {
  getServiceAreaPagesBySite: async (siteSlug: string, options?: ApiGetOptions): Promise<any[]> => {
    try {
      const response = await api.get(`/public/sites/${siteSlug}/service-area-pages`, options);
      const nested = response?.data?.data;
      if (Array.isArray(nested)) return nested;
      if (Array.isArray(response?.data)) return response.data;
      if (Array.isArray(response)) return response;
      return [];
    } catch (err) {
      if (!options?.silent) {
        console.warn('Service area pages endpoint not available');
      }
      return [];
    }
  },
};

// Media API for public access
export const mediaApi = {
  /** Public uploads URL: `{API}/api/uploads/{filename}` (see IMAGE_URL_GUIDE). */
  getMediaUrl: (path: string): string => getImageSrc(path),
};

export default api;
