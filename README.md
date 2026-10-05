# Adah website

Static site for Adah (adahhabits.com). No build step, plain HTML, CSS and JavaScript.

## Files
- index.html - the page
- style.css - brand colours, type and layout
- script.js - prayer-day arc, reframe section, Islamic Dopamine Check, newsletter form
- logo.svg - vector logo (the page itself uses an inline copy)
- favicon.svg - browser tab icon

## Publish on GitHub Pages
1. Create a new repository on GitHub (for example `adah-website`).
2. Upload everything in this folder to the repository root.
3. Go to Settings > Pages. Under "Build and deployment", choose "Deploy from a branch", branch `main`, folder `/ (root)`. Save.
4. After a minute the site is live at `https://<your-username>.github.io/adah-website/`.

## Use your own domain (adahhabits.com)
1. In Settings > Pages, enter `adahhabits.com` under "Custom domain" and save.
2. At your domain registrar, add DNS records:
   - A records for `@` pointing to 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - CNAME record for `www` pointing to `<your-username>.github.io`
3. Back in Settings > Pages, tick "Enforce HTTPS" once it becomes available.

## Things to connect
- Newsletter: the form in `script.js` (bottom) only shows a message. Connect Mailchimp, ConvertKit, Beehiiv or Formspree there.
- Read section: article links in `index.html` point to `#`. Replace them with real post URLs.
- Social links in the footer: replace with the real Instagram and Facebook profile URLs.
- Quiz: runs fully in the browser. To collect results or emails, add a step after the result.
