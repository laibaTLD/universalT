'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';
import { useThemeColors, useThemeFonts } from '@/app/hooks/useTheme';
import { CTASection } from './CTASection';
import { ServiceBanner } from './ServiceBanner';
import { ServiceDetailsSection } from './ServiceDetailsSection';
import { OtherServicesCard, QuickContactCard } from './ServiceSidebarCards';
import { ServiceFAQSection } from './ServiceFAQSection';
import { ServiceServingAreasSection } from './ServiceServingAreasSection';
import { ServiceContactFormSection } from './ServiceContactFormSection';

interface ServiceDetailProps {
    service: any;
    allServices?: any[];
    className?: string;
}

export const ServiceDetail: React.FC<ServiceDetailProps> = ({ 
    service, 
    allServices = [],
    className 
}) => {
    const themeColors = useThemeColors();
    const themeFonts = useThemeFonts();

    // Data Filtering - show all other services, no limit
    const otherServices = allServices.filter(s => s._id !== service._id && s.slug !== service.slug);
    const galleryImages = service.galleryImages || [];

    // CTA Logic (Matching Home Page Pattern)
    const cta = service.cta;
    const isCtaEnabled = cta?.enabled ?? true;
    
    // Constructing the CTA object to match your exact CTASection requirements
    const ctaSectionFromService: any = {
        enabled: isCtaEnabled,
        title: cta?.title || `Excellence in ${service.name}`,
        description: cta?.description || 'Experience the gold standard in home services. Our team is ready to assist you today.',
        primaryButton: {
            label: cta?.buttonText || 'Schedule Now',
            href: cta?.buttonUrl || '/contact',
        },
        image: cta?.image?.url ? { url: cta.image.url } : undefined,
        // Passing theme colors to ensure consistency
        backgroundColor: themeColors.sectionBackgroundDark,
    };

    return (
        <div 
            className={cn('min-h-screen', className)} 
            style={{ 
                backgroundColor: themeColors.pageBackground,
                fontFamily: themeFonts.body,
            }}
        >
            {/* Elegant Top Banner */}
            <ServiceBanner service={service} />

            {/* Main Content Architecture */}
            <main className="relative py-20 lg:py-32">
                <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
                    <div className="grid lg:grid-cols-12 gap-16 xl:gap-24">
                        
                        {/* Left Side: Editorial Content */}
                        <div className="lg:col-span-8 space-y-20">
                            <ServiceDetailsSection 
                                service={service} 
                                galleryImages={galleryImages} 
                            />
                        </div>

                        {/* Right Side: Sticky Sidebar */}
                        <aside className="lg:col-span-4 relative">
                            <div className="lg:sticky lg:top-32 space-y-12">
                                <OtherServicesCard otherServices={otherServices} />
                                <QuickContactCard service={service} />
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            {isCtaEnabled && (
                <CTASection ctaSection={ctaSectionFromService} />
            )}

            {/* Support Information Sections */}
            <div className="space-y-0">
                <ServiceFAQSection service={service} />
                
                <ServiceServingAreasSection service={service} />

                <ServiceContactFormSection service={service} />
            </div>
        </div>
    );
};

export default ServiceDetail;