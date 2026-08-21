# Update existing Next.js template to use Sitify Studio legal pages & files

Copy everything below the line into Cursor (or your AI coding agent) while the Next.js template repo is open.

---

You are updating an already-built, working Next.js website template that fetches site data from **Sitify Studio** (Website Builder) via the public API.

## What Sitify Studio is

Sitify Studio is a headless website builder / CMS. The admin app (React) lets a team configure a published business website: pages, services, service-area pages, blog, projects, testimonials, theme, footer, SEO, integrations, contact SMTP, chatbot, and **Legal Pages & Files**.

The Next.js template is the **public consumer**. It must not include admin UI. It reads published data over unauthenticated public APIs and renders the live site.

A typical deployed template is **single-site**: env vars point at one published site slug. All legal content for that site is authored in Sitify Studio → sidebar **Legal Files** (`/sites/:siteId/legal-files`) and stored on the Site document.

Do **not** redesign the site. Do **not** break existing SEO, routing, footer, or layout. Prefer additive changes. Reuse the template’s existing Tiptap / rich-text renderer if it already has one.

---

## Goal

Wire `site.legal` and `site.files` from the public site payload into the template so:

1. **Terms of Service** renders at `/terms-of-service`
2. **Privacy Policy** renders at `/privacy-policy`
3. **Sitemap XML** is served at `/sitemap.xml` (raw XML from Studio, not a newly invented sitemap)
4. **robots.txt** is served at `/robots.txt` (raw text from Studio)
5. **Schema.org JSON-LD** from `files.schemaJson` is injected site-wide in `<head>`
6. Footer (and any legal nav) links to those two pages when content exists

Empty / missing fields must inject nothing and must not 500.

---

## Public API (source of truth)

Site config is already fetched from:

```
GET ${NEXT_PUBLIC_API_BASE_URL}/public/sites/${NEXT_PUBLIC_WEBBUILDER_SITE_SLUG}
```

(or equivalent helper like `getSiteData(slug)` / `fetchSite(slug)`).

Fallback equivalents (same `legal` + `files` shape):

```
GET ${NEXT_PUBLIC_API_BASE_URL}/public/sites/default
GET ${NEXT_PUBLIC_API_BASE_URL}/public/sites/id/:id
```

There is **no** separate public `/legal` endpoint. Legal pages and files come **on the site object**.

The JSON response includes:

```json
{
  "success": true,
  "data": {
    "_id": "site_id",
    "name": "Acme Plumbing",
    "slug": "acme-plumbing",
    "status": "published",
    "seo": { "title": "...", "description": "...", "gaId": "", "gtmId": "" },
    "theme": { "...": "..." },
    "business": { "name": "...", "phone": "...", "email": "...", "address": {} },
    "socialLinks": [],
    "footer": { "columns": [], "copyright": {}, "showSocialLinks": true },
    "serviceAreas": [],
    "integrations": { "ga4": "", "gtmHead": "", "gtmBody": "", "googleAds": "", "searchConsoleVerification": "", "googleMaps": "" },
    "legal": {
      "termsOfService": {
        "heading": "Terms of Service",
        "description": "Plain-text intro / short summary shown under the heading.",
        "content": {
          "type": "doc",
          "content": [
            {
              "type": "heading",
              "attrs": { "level": 2 },
              "content": [{ "type": "text", "text": "1. Agreement" }]
            },
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "By using this website you agree to these terms." }]
            }
          ]
        }
      },
      "privacyPolicy": {
        "heading": "Privacy Policy",
        "description": "How we collect and use information.",
        "content": { "type": "doc", "content": [] }
      }
    },
    "files": {
      "sitemap": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">...</urlset>",
      "robotsTxt": "User-Agent: *\nAllow: /\nDisallow: /api/\nDisallow: /_next/\nDisallow: /admin/\nDisallow: /private/\nSitemap: https://www.example.com/sitemap.xml",
      "schemaJson": "[\n  {\n    \"@context\": \"https://schema.org\",\n    \"@type\": \"Organization\",\n    \"name\": \"Acme Plumbing\",\n    \"url\": \"https://www.example.com\",\n    \"sameAs\": []\n  }\n]"
    }
  }
}
```

`data` **is** the site (not `data.site`) on public routes.

### Field meanings

| Field | Public URL / placement | Type | Notes |
|---|---|---|---|
| `legal.termsOfService.heading` | `/terms-of-service` page H1 | string | Fallback: `"Terms of Service"` |
| `legal.termsOfService.description` | intro under heading | **plain string** (not Tiptap) | Optional |
| `legal.termsOfService.content` | page body | **Tiptap JSON** (`{ type: "doc", content: [...] }`) | May arrive as a JSON **string** — parse if needed |
| `legal.privacyPolicy.*` | `/privacy-policy` | same shape | Same rules |
| `files.sitemap` | `GET /sitemap.xml` | XML **string** | Serve as-is with `Content-Type: application/xml` |
| `files.robotsTxt` | `GET /robots.txt` | text **string** | Serve as-is with `Content-Type: text/plain` |
| `files.schemaJson` | every page `<head>` | JSON **array as a string** | Embed as `application/ld+json`. Default in Studio is `"[]"` |

Empty strings / empty Tiptap docs / `"[]"` mean “do not inject” (except robots/sitemap: if empty, fall back to a minimal valid file or 404 — see below).

---

## Tiptap `content` (legal body)

Studio’s Legal Files editor is Tiptap with StarterKit plus underline, links, images, text-align, tables, headings, lists, blockquotes, and code.

Normalized shape:

```ts
type TiptapDoc = {
  type: 'doc';
  content?: TiptapNode[];
};

type TiptapNode = {
  type: string; // paragraph | heading | bulletList | orderedList | listItem | blockquote | codeBlock | image | table | tableRow | tableCell | tableHeader | text | hardBreak | horizontalRule
  attrs?: Record<string, unknown>; // heading.level 1–3; image src/alt; link href/target; textAlign
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>; // bold, italic, underline, strike, link, code
  text?: string;
  content?: TiptapNode[];
};
```

**Rendering rules**

- Reuse the template’s existing `RichText` / Tiptap renderer if one exists (blog, page sections, etc.).
- If `content` is a string that starts with `{`, `JSON.parse` it first.
- If `content` is already HTML (legacy), render with `dangerouslySetInnerHTML` only for that case.
- Empty doc (`no content`, or only empty paragraphs) → treat as missing.
- Legal pages should use readable prose styles (`prose` / template typography). Respect heading levels inside the body (do **not** wrap the page H1 as another H1 inside `content`).
- Images in Tiptap use `attrs.src` / `attrs.alt`. Prefix relative `/uploads/...` with `NEXT_PUBLIC_API_BASE_URL` origin if the template already does that for other images (Studio normalizes to `/api/uploads/...`).

---

## Expected public routes (keep these exact paths)

Sitify Studio Legal Files auto-generate assumes this URL map on the live Next.js site:

| Path | Source |
|---|---|
| `/` | Home |
| `/about-us` | About (if the template already uses `/about` or `/about-us`, do not rename other pages — only add the two legal routes below) |
| `/contact-us` | Contact |
| `/testimonials` | Testimonials |
| `/gallery` | Gallery |
| `/serving-areas` | Service areas listing |
| `/privacy-policy` | **Privacy Policy (this task)** |
| `/terms-of-service` | **Terms of Service (this task)** |
| `/service/` | Service listing prefix |
| `/service/{slug}` | Service detail |
| `/service/{slug}/service-areas/{area-slug}` | Service-area page |

**This task only requires adding `/privacy-policy` and `/terms-of-service` plus `/sitemap.xml` and `/robots.txt`.** Do not reshuffle existing marketing routes.

Studio’s sitemap generator writes:

- `{origin}/`
- `{origin}/service/{serviceSlug}`
- `{origin}/service/{serviceSlug}/service-areas/{areaSlug}`

Studio’s robots generator allows those paths plus the static pages listed above, disallows `/api/`, `/_next/`, `/admin/`, `/private/`, and sets `Sitemap: {origin}/sitemap.xml`.

---

## Required implementation

### 1. Types

Extend the existing site type:

```ts
type LegalPage = {
  heading?: string;
  description?: string;
  content?: unknown; // Tiptap JSON object or stringified JSON
};

type SiteLegal = {
  termsOfService?: LegalPage;
  privacyPolicy?: LegalPage;
};

type SiteFiles = {
  sitemap?: string;
  robotsTxt?: string;
  schemaJson?: string;
};

// on Site:
legal?: SiteLegal;
files?: SiteFiles;
```

### 2. Confirm the existing site fetch

Find `getSiteData` / `fetchSite` / layout fetch of:

```
GET ${NEXT_PUBLIC_API_BASE_URL}/public/sites/${NEXT_PUBLIC_WEBBUILDER_SITE_SLUG}
```

Ensure the helper returns `data.legal` and `data.files` (they are already on the payload — do not drop them in a whitelist). Keep `next: { revalidate: … }` consistent with other site fetches (typically 3600s). Use React `cache()` if the template already caches site data.

Env vars used by deployed Sitify templates:

```
NEXT_PUBLIC_API_BASE_URL   # e.g. https://api.example.com/api   (includes /api)
NEXT_PUBLIC_WEBBUILDER_SITE_SLUG
```

Some older templates use `NEXT_PUBLIC_API_URL` — keep whatever the template already uses.

### 3. Legal page UI

Create two App Router pages (adjust if the template is Pages Router):

- `app/terms-of-service/page.tsx`
- `app/privacy-policy/page.tsx`

Shared layout/component is fine, e.g. `components/LegalDocumentPage.tsx`:

```tsx
// Pseudocode — match the template’s Header/Footer/Container
export default async function TermsPage() {
  const site = await getSiteData(slug);
  const doc = site?.legal?.termsOfService;
  if (!hasLegalBody(doc)) notFound();

  return (
    <>
      <h1>{doc.heading?.trim() || 'Terms of Service'}</h1>
      {doc.description?.trim() ? <p>{doc.description}</p> : null}
      <RichText content={parseTiptap(doc.content)} className="prose" />
    </>
  );
}
```

`generateMetadata()`:

- `title`: `doc.heading` or `"Terms of Service"` + site name / `site.seo.title` pattern the template already uses
- `description`: `doc.description` or a short fallback
- `robots`: index, follow (these are public legal pages)

If the body is empty, `notFound()` is correct. Do not render a blank legal page.

Style the page with the template’s existing legal/content/article layout if one exists; otherwise a simple centered article width is enough. Do not invent a new design system.

### 4. Footer / nav links

Find the Footer component (uses `site.footer.columns`, copyright, social links).

- Add **Privacy Policy** → `/privacy-policy` and **Terms of Service** → `/terms-of-service` when those documents have content.
- Prefer appending to an existing “Legal” / “Company” column if present; otherwise a small legal row next to copyright.
- Do **not** duplicate links if `site.footer.columns` already contains the same hrefs.
- Hide a link when that document is empty.

### 5. `robots.txt` — Route Handler, not `app/robots.ts`

Studio stores a **full robots.txt file as a string**. Do not rebuild it from `MetadataRoute.Robots`.

If the template already has `app/robots.ts` / `app/robots.js`, replace it with a route handler that returns Studio’s string:

```ts
// app/robots.txt/route.ts
export async function GET() {
  const site = await getSiteData(process.env.NEXT_PUBLIC_WEBBUILDER_SITE_SLUG!);
  const body = (site?.files?.robotsTxt || '').trim();
  const fallback = `User-Agent: *\nAllow: /\nDisallow: /api/\nDisallow: /_next/\nDisallow: /admin/\nDisallow: /private/\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(body || fallback, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
```

Remove conflicting `app/robots.ts` so Next.js does not generate a second robots file.

### 6. `sitemap.xml` — Route Handler, not `app/sitemap.ts`

Studio stores a **full XML sitemap string**. Do not convert it into `MetadataRoute.Sitemap` unless parsing is already bulletproof. Prefer serving the XML verbatim.

```ts
// app/sitemap.xml/route.ts
export async function GET() {
  const site = await getSiteData(process.env.NEXT_PUBLIC_WEBBUILDER_SITE_SLUG!);
  const xml = (site?.files?.sitemap || '').trim();
  if (!xml) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
```

If `app/sitemap.ts` already exists, **remove or stop using it** so `/sitemap.xml` is the Studio file (Studio robots.txt points crawlers at `{origin}/sitemap.xml`).

Do not serve a stale copy from `/public/sitemap.xml` or `/public/robots.txt` if those files exist from an old GitHub sync — API is the source of truth. You may delete those public files if they would shadow the route handlers.

### 7. JSON-LD schema in root layout

`files.schemaJson` is a **stringified JSON array** of Schema.org objects (Studio default `"[]"`).

In the root layout (same place integrations / metadata live):

```tsx
function JsonLd({ schemaJson }: { schemaJson?: string }) {
  const parsed = parseSchemaArray(schemaJson);
  if (!parsed.length) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(parsed) }}
    />
  );
}
```

`parseSchemaArray`:

- trim; if empty or `"[]"` return `[]`
- `JSON.parse`
- if the result is a single object, wrap as `[obj]`
- if parse fails, return `[]` (never crash the layout)
- do **not** wrap in a `<div>`

Place it in `<head>` via Next.js (layout children / `generateMetadata` is wrong for JSON-LD — a `<script type="application/ld+json">` in the root layout is correct). Do not double-inject if the template already hardcodes Organization schema from `site.business`; if both exist, prefer Studio `files.schemaJson` when it is a non-empty array, otherwise keep the existing hardcoded schema.

### 8. SSR / caching

- Legal pages, robots, sitemap, and JSON-LD must run on the **server**.
- Do not fetch legal content in a client `useEffect`.
- Do not put secrets in `NEXT_PUBLIC_*`.
- These fields are trusted admin content from Sitify Studio.

### 9. Optional static files in `/public`

Some Sitify deploys also sync GitHub files:

- `public/terms-of-service` (JSON dump of the legal page object — **not** HTML)
- `public/privacy-policy`
- `public/sitemap.xml`
- `public/robots.txt`
- `public/schema.json`

**Do not** read those files for rendering. They are a deploy-time dump. Always use the public site API so edits in Studio appear after revalidation without a rebuild.

---

## Related public endpoints (context — do not rewrite these)

Base URL: `${NEXT_PUBLIC_API_BASE_URL}` (already includes `/api`, e.g. `https://host/api`).

Public CORS is `*` (GET). Contact POST is a separate `/api/contact` route.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Health check (`/api/health`) |
| GET | `/public/sites/default` | First published site |
| GET | `/public/sites/:slug` | **Site config including `legal` + `files` + `integrations` + `footer` + `business` + `seo` + `theme`** |
| GET | `/public/sites/id/:id` | Same payload by Mongo id |
| GET | `/public/sites/:slug/pages` | Published pages |
| GET | `/public/sites/:slug/pages/:pageSlug` | One page + sections |
| GET | `/public/sites/:slug/services` | Published services |
| GET | `/public/sites/:slug/blog` | Published posts (`?limit=`) |
| GET | `/public/sites/:slug/blog/:postSlug` | One post |
| GET | `/public/sites/:slug/projects` | Published projects (`?limit=`) |
| GET | `/public/sites/:slug/projects/:projectSlug` | One project |
| GET | `/public/sites/:slug/service-area-pages` | Service-area pages |
| GET | `/public/sites/:slug/service-areas/:pageSlug` | One area page |
| GET | `/public/sites/:slug/service-areas/by-service/:serviceSlug/:citySlug` | Area page by service + city |
| GET | `/public/sites/:slug/testimonials` | Testimonials |
| GET | `/pages` | Legacy pages (`?siteId=`) |
| GET | `/pages/site/:siteId` | Legacy pages by id |
| GET | `/pages/:id` | One page by id |
| GET | `/testimonials` | Legacy testimonials (`?siteId=`) |
| GET | `/testimonials/featured` | Featured |
| POST | `/contact` | Contact form `{ name, email, phone?, subject?, message, siteId? }` — send `siteId: site._id` |
| GET | `/uploads/*` and `/api/uploads/*` | Media |

Success envelope: `{ success: true, data: ... }`. Errors: `{ success: false, error: { code, message } }`. Unpublished sites 404 on public slug routes.

Admin-only (not for the template): `GET/PUT /api/legal-files/:siteId`, `PUT /api/sites/:id/legal-files`. Do not call these from the Next.js site.

---

## Acceptance checklist

- [ ] `site.legal` and `site.files` are typed and read from the existing public site fetch
- [ ] `/terms-of-service` renders heading, description, and Tiptap body
- [ ] `/privacy-policy` renders heading, description, and Tiptap body
- [ ] Empty legal docs 404 (or hide nav links) — no blank crash
- [ ] Tiptap JSON string **or** object both render
- [ ] `/sitemap.xml` returns Studio `files.sitemap` as XML
- [ ] `/robots.txt` returns Studio `files.robotsTxt` as plain text
- [ ] No leftover `app/sitemap.ts` / `app/robots.ts` fighting those URLs
- [ ] `files.schemaJson` JSON-LD appears in view-source when the array is non-empty
- [ ] Invalid `schemaJson` does not crash the layout
- [ ] Footer links to both legal pages when content exists, without duplicates
- [ ] Existing pages, styles, integrations, and routing unchanged
- [ ] Server-rendered (no client-only fetch for legal/SEO files)

## Out of scope

- Do not change Sitify Studio backend
- Do not call authenticated `/api/legal-files` or `/api/sites/:id/legal-files`
- Do not hardcode legal copy in the template
- Do not auto-generate a new sitemap from local routes if Studio already provides XML
- Do not redesign marketing pages

Implement this now in the current template codebase.
