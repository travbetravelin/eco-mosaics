# Eco Mosaics — Tech Stack

## Site
- **Type:** Static site built with Eleventy (11ty) v2.0.1
- **Templating:** Nunjucks (`.njk`) — shared nav/footer via `src/_includes/base.njk`
- **Stylesheet:** Single file (`styles.css`)
- **Fonts:** Playfair Display, Lora, DM Mono (Google Fonts)
- **Domain:** ecomosaicsrestoration.com
- **Source directory:** `src/` — Eleventy outputs to `_site/`

## Hosting & Deployment
- **Site hosting:** GitHub Pages (repo: `travbetravelin/eco-mosaics`)
- **Deployment:** Push to `main` → GitHub Actions builds Eleventy → deploys `_site/` to GitHub Pages
- **Workflow file:** `.github/workflows/deploy.yml`
- **Note:** GitHub Pages source must be set to "GitHub Actions" (not branch deploy) in repo settings

## Version Control
- **Platform:** GitHub
- **Repo:** `travbetravelin/eco-mosaics`
- **Branching:** Claude uses worktrees for changes; merged to `main` when approved

## Analytics
- **Tool:** Umami (self-hosted, open source)
- **App hosting:** Railway (v2 branch of umami-software/umami fork)
- **Database:** Supabase (PostgreSQL, session mode pooler)
- **Instance URL:** https://umami-production-68ce.up.railway.app
- **Status:** Live

## Services & Integrations
| Service | Purpose | Plan |
|---|---|---|
| GitHub Pages | Site hosting | Free |
| GitHub Actions | CI/CD — build & deploy | Free |
| Eleventy (11ty) | Static site generator | Open source |
| Railway | Umami app hosting | Free tier |
| Supabase | Umami database | Free tier |
| Umami | Privacy-first analytics | Self-hosted |
