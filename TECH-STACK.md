# Eco Mosaics — Tech Stack

## Site
- **Type:** Static HTML/CSS — no framework, no build step
- **Stylesheet:** Single file (`styles.css`)
- **Fonts:** Playfair Display, Lora, DM Mono (Google Fonts)
- **Domain:** ecomosaicsrestoration.com

## Hosting & Deployment
- **Site hosting:** GitHub Pages (repo: `travbetravelin/eco-mosaics`)
- **Deployment:** Pushes to `main` branch go live automatically via GitHub Pages

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
| Railway | Umami app hosting | Free tier |
| Supabase | Umami database | Free tier |
| Umami | Privacy-first analytics | Self-hosted |
