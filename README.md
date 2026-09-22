# flickbean

Browser game. Rub, don't tap. Live: https://flickbean.jonbailey.xyz/

Adults only. Visitors must check "I am 18 or older" before play.

v1.3.0  Daily streak. Consecutive UTC claims add a small bonus, capped at 8 days. js-yaml 4.3.2. brace-expansion 1.1.21 and 5.0.12.
v1.2.1  Hits widget waits for 18+ confirm.
v1.2    18+ confirmation gate.
v1.1    Daily Flick, mute, share cards, OG tweet image.

```bash
npm install
npm run dev
```

Dev server listens on port 8080.

## Deploy

Live host is Cloudflare Pages: https://flickbean.jonbailey.xyz/

```bash
NITRO_PRESET=cloudflare_pages VITE_AUTH_ENABLED=false npm run build
npx wrangler pages deploy dist --project-name=flickbean-jonbailey
```

Windows helper: `deploy.ps1` (rewrites `public/og.jpg`, then the same build).

Vercel: from this root, `vercel deploy` or `vercel --prod`. Set `VITE_AUTH_ENABLED=false`. Do not commit `.vercel`. Point the custom domain at that project if you switch hosts.

Optional job file: `.github/workflows/pages.yml`.

MIT. Issues on this repo only.
