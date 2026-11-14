# RigForge – interactive 3D PC builder

Plan a PC in 3D, check that every part fits, understand **why** each part matters, estimate FPS and jump to live prices in German/European shops.
Available in **English, Deutsch and Français**.

Inspired by the best ideas of BuildCores (3D), PCPartPicker (part lists & compatibility), NZXT BLD (guided builds), Pangoly / DropReference (price comparison & FPS estimates), PC-Kombo and BlueprintPC (compatibility-aware choices, bottleneck checks).

## Features

| Area | What it does |
| --- | --- |
| **3D Builder** | Procedural 3D models of every part, sized from real specs (case dimensions, GPU length, cooler height, radiator size). Orbit, camera presets, exploded view, X-ray, labels, glass panel toggle, RGB modes (rainbow / static / breathing / off) with bloom, fan speed, screenshot. Empty slots glow – click them to add a part. Parts "fly in" when added. |
| **Compatibility** | 30+ rules: socket, DDR4/DDR5, RAM slots & max capacity, board form factor vs case, GPU length, cooler height, radiator size, cooler socket & heat capacity, PSU wattage & headroom, 12V-2x6 adapter, SFX/ATX, M.2/SATA/3.5" bays, fan mounts, airflow, VRAM, CPU bottleneck, missing parts. |
| **Part picker** | Search, brand filter, max-price slider, "only compatible" filter with the exact reason for each conflict, sort by performance / value / price, compare checkbox, retailer links per part, and the "specs to check" guide next to the list. |
| **Part guides** | For each of the 9 categories: what it does, an analogy, **risk if missing**, **risk of a weak/cheap one**, **specs to check before buying**, pro tips, common mistakes and typical budget share. |
| **Build Assistant** | Budget slider + use case (esports, 1440p, 4K, streaming, creator, office, local AI) + platform, colour, size, Wi-Fi, RGB → searches every CPU × GPU combination and returns the best compatible build, then spends leftovers on sensible upgrades. |
| **Performance** | Estimated FPS in 10 games at 1080p/1440p/4K (with/without upscaling), CPU/GPU balance meter, build scores (gaming, work, ray tracing, local AI) and a "try another GPU" chart. |
| **Compare** | Up to 4 parts side by side; best value per row highlighted; perf per 100 €. |
| **Builds** | 10 curated, fully compatible presets + your saved builds (stored in the browser). |
| **Sharing** | Shareable URL (`#/builder?c=…&g=…`), Markdown part list for Reddit/Discord, save as… |
| **Prices** | EUR reference prices (dated) + search links to Geizhals, idealo, PCPartPicker DE, Amazon.de, Alternate, Mindfactory, Caseking (+ LDLC / Amazon.fr in French), manufacturer site and video reviews. |
| **Sources** | Methodology and trusted references (TechPowerUp, PCGH, ComputerBase, Tom's Hardware, Gamers Nexus, Cybenetics…). |
| **Accounts** | Sign in with Google (Gmail) or email + password with an **email verification link**, password reset, display name, delete account. Saved builds, owned parts and the current build sync to Firestore once the email is verified. Without Firebase keys it runs in a clearly labelled **demo mode** (accounts in the browser, 6-digit code shown on screen). |
| **Day / night mode** | Light ("aluminium"), dark ("black metal") or follow the system. |
| **Hardware design** | Every part category is shown on its real material – nickel CPU lid, copper heat pipes, green PCB with gold pads, RGB RAM, M.2 with gold contacts, 80 PLUS gold label, tempered glass, ARGB fan – plus brand colours (NVIDIA green, AMD red, Intel blue, MSI red, Corsair yellow …) in lists and on the 3D models. |
| **PC vs PC dashboard** | Compare any two builds (yours, saved, presets or imported): verdict, KPI tiles (price, avg FPS, power, energy cost per year with your tariff, value), strength radar, FPS per game, price per component, part-by-part winners, table view. |
| **Import a PC from the web** | Paste a shop/manufacturer link (via the free Cloudflare worker), paste spec text, or search Geizhals/idealo/Google. A parser recognises current and previous-generation CPUs/GPUs, RAM, storage, PSU, chipset, cooler and the listed price. |
| **Conversational build assistant** | Asks step by step: use case → budget → *which parts do you already own?* → preferences. Owned parts (incl. previous-gen or generic ones) cost €0, are reused when compatible, and are flagged "better replace" when they are too weak or incompatible. |

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · three.js via `@react-three/fiber` + `@react-three/drei` + postprocessing · Zustand (state + localStorage) · Framer Motion · lucide icons · React Router (hash routing, so it works on GitHub Pages without server config).

No backend and no API keys: everything runs in the browser.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
npm run check      # validate presets + build assistant
```

## Set up real accounts (Firebase – free)

1. Go to <https://console.firebase.google.com> → **Add project** (Google Analytics not needed).
2. **Build → Authentication → Get started → Sign-in method**: enable **Google** and **Email/Password**.
3. **Authentication → Settings → Authorised domains**: add `yann27miguel.github.io` (and `localhost` is there already).
4. **Build → Firestore Database → Create database** (production mode, region `europe-west3` Frankfurt), then **Rules** → paste `firestore.rules` from this repo → Publish.
5. **Project settings → Your apps → Web app (</>)** → copy the config into `.env.local` (see `.env.example`):
   ```
   VITE_FIREBASE_API_KEY=…
   VITE_FIREBASE_AUTH_DOMAIN=…firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=…
   VITE_FIREBASE_APP_ID=…
   ```
6. For GitHub Pages, add the same four values as **repository secrets** (Settings → Secrets and variables → Actions); the workflow passes them to the build.

These web keys are not secret – security comes from the Firestore rules and authorised domains. Phone/SMS sign-in is not included because it requires Firebase's paid Blaze plan.

## Set up "import from a link" (Cloudflare Worker – free)

```bash
npm install -g wrangler
cd worker
wrangler login
# edit ALLOWED_ORIGIN in wrangler.toml to your site's URL(s)
wrangler deploy
```
Put the printed URL in `.env.local` (and as the repo secret `VITE_SPECS_WORKER_URL`). The worker only fetches HTTPS pages on its shop/manufacturer allowlist (`worker/specs-worker.js`) and only answers your own site. Some shops (e.g. Amazon) block automated requests – users can then paste the specs instead.

## Deploy to GitHub Pages (free hosting)

Live site: **https://yann27miguel.github.io/RigForge/**

The workflow `.github/workflows/deploy.yml` builds the app on every push to `main` and publishes `dist/` to the `gh-pages` branch, which GitHub Pages serves for free. If the site ever shows a 404, check **Settings → Pages → Build and deployment → Source: Deploy from a branch → `gh-pages` / root**.

`vite.config.ts` uses `base: './'` and the app uses hash routing (`#/builder`), so it works under any repository name without server configuration.

## Project structure

```
src/
  data/          parts catalog, previous-gen parts, generic parts, guides (EN/DE/FR), games, presets, retailers, material & brand colours
  lib/           compatibility rules, power, FPS model, build assistant, spec parser, PC-vs-PC metrics,
                 Firebase loader, demo auth, cloud sync, share/markdown
  store/         Zustand stores (build, settings, auth)
  i18n/          en.ts / de.ts / fr.ts dictionaries
  components/
    three/       3D scene: layout math, part models, materials, hover/explode wrapper
    builder/     part picker, slot list, checks, FPS panel
  pages/         Home, Builder, Wizard, Learn, Compare, Performance, Builds, Sources
worker/          Cloudflare Worker that reads product pages for the importer
firestore.rules  security rules for user data
scripts/validate.ts  sanity checks for presets and the assistant
```

## Updating data

* **Add a part:** add an object to the right array in `src/data/parts.ts`. The type system tells you which specs are required. It immediately appears in the picker, compatibility checks, compare, wizard and 3D (sizes come from the specs).
* **Update prices:** edit `price` (EUR) and bump `PRICE_DATE`. Prices are *reference* values – the UI always tells users to check the live links.
* **Edit guide texts:** `src/data/guide.ts` (one entry per category and language).
* **Add a language:** copy `src/i18n/en.ts`, translate, register it in `src/i18n/index.ts`, and add the language to `guide.ts` and `presets.ts`.

## Honest limitations (v1)

* Prices are dated estimates (Nov 2026, during the DRAM shortage), not live. Live prices need a backend with retailer/affiliate APIs (e.g. Geizhals, Amazon PA-API, Awin) – a natural v2.
* FPS numbers come from a simple model (GPU index × resolution, capped by CPU index, with VRAM/RAM penalties). They are good for comparing builds, not a replacement for benchmarks.
* 3D models are procedural (no brand meshes), sized from real dimensions.

## Ideas for v2

Live price backend + price history charts · user accounts & public build gallery · monitor/peripheral categories · cable-routing & assembly step-by-step animation · more parts (scraped from manufacturer spec sheets) · light theme.
