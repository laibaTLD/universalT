import { getJsonLdGraph } from '@/app/lib/legal';
import type { Site } from '@/app/lib/types';

export function JsonLd({ site }: { site?: Site | null }) {
  const graph = getJsonLdGraph(site);
  if (!graph.length) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
