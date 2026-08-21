import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Footer } from '@/app/components/layout/Footer';
import { LegalDocumentPage } from '@/app/components/LegalDocumentPage';
import { hasLegalBody } from '@/app/lib/legal';
import { generateMetadata as buildMetadata } from '@/app/lib/metadata';
import { fetchSiteBootstrap } from '@/app/lib/siteBootstrap';

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await fetchSiteBootstrap();
  const doc = site?.legal?.termsOfService;
  const heading = doc?.heading?.trim() || 'Terms of Service';
  const description = doc?.description?.trim();

  return {
    ...buildMetadata(
      {
        title: heading,
        description: description || 'Terms of Service for this website.',
        noIndex: false,
      },
      site ?? undefined
    ),
    robots: { index: true, follow: true },
  };
}

export default async function TermsOfServicePage() {
  const { site } = await fetchSiteBootstrap();
  const doc = site?.legal?.termsOfService;
  if (!doc || !hasLegalBody(doc)) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <LegalDocumentPage
          heading={doc.heading?.trim() || 'Terms of Service'}
          description={doc.description}
          content={doc.content}
        />
      </main>
      <Footer />
    </div>
  );
}
