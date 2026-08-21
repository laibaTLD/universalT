import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Footer } from '@/app/components/layout/Footer';
import { LegalDocumentPage } from '@/app/components/LegalDocumentPage';
import { hasLegalBody } from '@/app/lib/legal';
import { generateMetadata as buildMetadata } from '@/app/lib/metadata';
import { fetchSiteBootstrap } from '@/app/lib/siteBootstrap';

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await fetchSiteBootstrap();
  const doc = site?.legal?.privacyPolicy;
  const heading = doc?.heading?.trim() || 'Privacy Policy';
  const description = doc?.description?.trim();

  return {
    ...buildMetadata(
      {
        title: heading,
        description: description || 'Privacy Policy for this website.',
        noIndex: false,
      },
      site ?? undefined
    ),
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPolicyPage() {
  const { site } = await fetchSiteBootstrap();
  const doc = site?.legal?.privacyPolicy;
  if (!doc || !hasLegalBody(doc)) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <LegalDocumentPage
          heading={doc.heading?.trim() || 'Privacy Policy'}
          description={doc.description}
          content={doc.content}
        />
      </main>
      <Footer />
    </div>
  );
}
