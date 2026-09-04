# Diet Hub — Official Website

A fast, single-page website for **Diet Hub**, a healthy meal prep business in Maasin, Southern Leyte, Philippines.

Built with plain HTML, CSS, and vanilla JavaScript — no build step, no dependencies. Open `app/index.html` and it just works.

## Project structure

```
app/
├── index.html    # The whole site (markup, styles, and scripts inline)
└── assets/       # Photos, posters, and logo
```

## What's on the site

- Hero slideshow with crossfade
- Weekly menu board (Mon–Sat, two options per day)
- Food gallery (masonry grid)
- Whole wheat banana bread section with pricing
- Best sellers & limited specials
- Order form modal — posts to a Make.com webhook, which pushes orders into the business CRM

## Updating the site

- **Photos:** drop new images into `app/assets/` and update the matching `src` / captions in `app/index.html`. Keep original uploads in `assets/` — never delete them.
- **Menu:** edit the `.day` blocks inside the menu board section of `index.html`.
- **Prices:** update both the visible price text and the `PLAN_PRICES` object in the script at the bottom of `index.html`.

## Deploy

Any static host works (GitHub Pages, Netlify, Vercel, Cloudflare Pages). Point it at the `app/` folder — no build command needed.

---

© 2026 Diet Hub · Maasin, Southern Leyte
