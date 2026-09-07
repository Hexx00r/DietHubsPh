# Diet Hub Ph — Official Website

A fast, mobile-friendly multi-page website for **Diet Hub Ph**, a healthy meal prep business in Maasin, Southern Leyte, Philippines.

Built with plain HTML, CSS, and vanilla JavaScript — no build step, no dependencies. Serve the `diethub-website/` folder with any static host and it just works.

## Project structure

```
diethub-website/
├── index.html        # Home — hero, featured items, promo banners, meal plans
├── menu.html         # Menu — item grid with photos, PHP prices, Add to Order
├── order.html        # Order — cart summary, customer form, checkout
├── contact.html      # Contact — location, hours, Messenger/Facebook links
├── css/
│   ├── style.css     # Base design system (source)
│   ├── pages.css     # Page components: menu cards, cart, promos (source)
│   └── style.min.css # Minified bundle served to browsers
├── js/
│   ├── main.js       # Source: navbar, cart, checkout, webhook (source)
│   └── main.min.js   # Minified bundle served to browsers
├── fonts/            # Self-hosted Inter + Playfair Display (woff2)
└── images/           # Logo and WebP food photos (images/food/)
```

## How ordering works

1. Customers add items to a cart (stored in the browser via localStorage).
2. The Order page collects name, phone, delivery/pickup details, and notes, with live totals (including delivery area fees).
3. **Place Order** POSTs structured JSON (customer, itemized order, total in PHP, timestamp) to a webhook that feeds the GoHighLevel CRM automation.
4. If the webhook is unreachable, the order is saved locally as a JSON file download and queued on the device (flagged for follow-up).

## Updating the site

- **Menu items:** edit the `<article class="menu-item">` blocks in `menu.html` (image, name, description, price, and the `data-id` / `data-name` / `data-price` attributes on the Add button). Use a matching image filename in `images/food/`.
- **Prices/delivery fees:** delivery area fees live in the `AREA_FEES` object at the top of `js/main.js`; visible prices are set in the HTML.
- **Webhook URL:** the `WEBHOOK_URL` constant at the top of `js/main.js`.
- **After editing CSS/JS:** rebuild the minified bundles with:
  ```bash
  cd diethub-website
  cat css/style.css css/pages.css > css/_bundle.tmp.css
  npx esbuild css/_bundle.tmp.css --minify --outfile=css/style.min.css
  rm css/_bundle.tmp.css
  npx esbuild js/main.js --minify --outfile=js/main.min.js
  ```

## Deploy

Any static host works (GitHub Pages, Netlify, Vercel, Cloudflare Pages). Point it at the `diethub-website/` folder — no build command needed.

---

© 2026 Diet Hub Ph · Maasin, Southern Leyte
