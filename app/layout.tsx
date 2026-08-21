import type { Metadata } from 'next';
import './globals.css';
import { WebBuilderProvider } from '@/app/providers/WebBuilderProvider';
import { ErrorBoundary } from '@/app/components/ui/ErrorBoundary';
import { ThemeFontWrapper } from './components/ui/ThemeFontWrapper';
import { LanguageProvider } from '@/app/i18n/LanguageProvider';
import { LenisProvider } from '@/app/components/cinematic/LenisProvider';
import { AmbientFoundation } from '@/app/components/cinematic/AmbientFoundation';
import { HeroIntroProvider } from '@/app/providers/HeroIntroProvider';
import { Header } from '@/app/components/layout/Header';
import { fetchSiteBootstrap } from '@/app/lib/siteBootstrap';
import { buildFaviconMetadata, getSiteFaviconUrl, getFaviconMimeType } from '@/app/lib/metadata';
import { extractGoogleVerificationToken, getGtmNoscriptInnerHtml } from '@/app/lib/integrations';
import { GtmNoscript, SiteHeadIntegrations } from '@/app/components/SiteIntegrations';
import { JsonLd } from '@/app/components/JsonLd';

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchSiteBootstrap();
  const site = data.site;
  const title = site?.seo?.title || site?.business?.name || site?.name || 'Web Builder Site';
  const description =
    site?.seo?.description || site?.business?.description || 'Generated site using Web Builder';
  const googleToken = extractGoogleVerificationToken(site?.integrations?.searchConsoleVerification);

  return {
    title,
    description,
    icons: buildFaviconMetadata(site),
    verification: googleToken ? { google: googleToken } : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialData = await fetchSiteBootstrap();
  const faviconUrl = getSiteFaviconUrl(initialData.site);
  const faviconType = getFaviconMimeType(faviconUrl);
  const gtmNoscriptInnerHtml = getGtmNoscriptInnerHtml(initialData.site);

  return (
    <html lang="en">
      <head>
        <SiteHeadIntegrations site={initialData.site} />
        <JsonLd site={initialData.site} />
        {faviconUrl ? (
          <>
            <link rel="icon" href="/api/favicon" type={faviconType} sizes="any" />
            <link rel="shortcut icon" href="/favicon.ico" />
            <link rel="apple-touch-icon" href="/api/favicon" />
          </>
        ) : null}
      </head>
      <body suppressHydrationWarning className="antialiased">
        <GtmNoscript html={gtmNoscriptInnerHtml} />
        <ErrorBoundary>
          <WebBuilderProvider initialData={initialData}>
            <LanguageProvider>
              <LenisProvider>
                <AmbientFoundation />
                <HeroIntroProvider>
                  <ThemeFontWrapper>
                    <Header />
                    <main className="relative z-10 min-h-screen pt-[6.5rem]">{children}</main>
                  </ThemeFontWrapper>
                </HeroIntroProvider>
              </LenisProvider>
            </LanguageProvider>
          </WebBuilderProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
