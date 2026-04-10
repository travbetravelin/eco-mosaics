# Eco Mosaics — Project Instructions

## Tech Stack Reference
`TECH-STACK.md` in the project root documents all services, tools, and integrations. Keep it current — whenever a new service, tool, platform, or third-party integration is added to the project ecosystem, update `TECH-STACK.md` to reflect it before closing out the task.

## Spacing Standards
These are locked-in standards. Always apply them — do not use inline styles to override unless explicitly instructed.

| Element | Value | Notes |
|---|---|---|
| Label → Title | **14px** | `margin-bottom: 14px` on `.label-tag` |
| Title → Lead | **16px** | `margin-bottom: 16px` on `.section-title` |
| Stacked paragraphs | **20px** | `.section-lead + .section-lead` in CSS |
| Text → Button | **20px** | `.section-lead + .btn` in CSS |
| Section padding (standard) | **72px** | `.content-section`, `.cta-band` |
| Section padding (emphasis) | **88px** | Feature sections |
| Section padding (hero) | **96px** | `.stub-section`, top-level hero sections |

### Mobile (max-width: 720px)
| Element | Value |
|---|---|
| Section padding (standard) | **48px** |
| Section padding (hero) | **56px** |

## Typography
The minimum font size sitewide is **16px (1rem)**. Never set `font-size` smaller than `1rem` in any HTML or CSS. This applies to inline styles, utility classes, and stylesheet rules — including notes, asides, captions, and any other small text elements.

## Stub Pages & Search Indexing
The following pages are stubs (marked "Page in progress") and are currently excluded from `sitemap.xml`:
- `about.html`, `about/mission.html`, `about/team.html`
- `learn.html`, `learn/blog.html`, `learn/case-studies.html`, `learn/faq.html`, `learn/get-involved.html`
- `services.html`, `services/consulting.html`, `services/invasives.html`, `services/restoration.html`

Whenever any of these pages is updated, remind the user: **"This page is currently excluded from the sitemap. Should it now be added for search indexing?"**
