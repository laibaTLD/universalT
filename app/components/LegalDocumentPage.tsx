import { TiptapRenderer } from '@/app/components/ui/TiptapRenderer';
import { parseTiptapContent } from '@/app/lib/legal';

type LegalDocumentPageProps = {
  heading: string;
  description?: string;
  content: unknown;
};

export function LegalDocumentPage({ heading, description, content }: LegalDocumentPageProps) {
  const intro = description?.trim();

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--wb-page-bg)' }}>
      <article className="mx-auto max-w-4xl">
        <div
          className="overflow-hidden rounded-xl shadow-xl"
          style={{ backgroundColor: 'var(--wb-card-bg-light)' }}
        >
          <header
            className="border-b px-8 py-12"
            style={{
              borderColor: 'var(--color-gray-300)',
              backgroundColor: 'var(--wb-section-bg-light)',
            }}
          >
            <h1
              className="mb-6 text-4xl font-bold leading-tight sm:text-5xl"
              style={{
                color: 'var(--wb-text-main)',
                fontFamily: 'var(--wb-heading-font, inherit)',
              }}
            >
              {heading}
            </h1>
            {intro ? (
              <p
                className="max-w-3xl text-lg leading-relaxed"
                style={{
                  color: 'var(--wb-text-secondary)',
                  fontFamily: 'var(--wb-body-font, inherit)',
                }}
              >
                {intro}
              </p>
            ) : null}
          </header>

          <div className="px-8 py-12">
            <div
              className="prose prose-lg max-w-none"
              style={{
                color: 'var(--wb-text-main)',
                fontFamily: 'var(--wb-body-font, inherit)',
              }}
            >
              <TiptapRenderer content={parseTiptapContent(content)} />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
