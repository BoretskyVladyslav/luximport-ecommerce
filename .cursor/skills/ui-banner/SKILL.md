---
name: ui-banner
description: Generates, optimizes, and wires promotional banner carousels (Dr. Gerard, Juice) into existing sliders. Use when working on hero slider, success slider, promotional banners, or brand carousels.
---

# UI banners

Reuse existing sliders. Do not invent a Sanity `banner` schema (desk lists the type; no schema file exists).

## Surfaces

- Home hero: `src/components/ui/hero-slider.tsx` (Dr. Gerard slide already present)
- Checkout success: `src/app/(storefront)/checkout/success/success-slider.tsx` (Juice is a **placeholder**)
- Success styles: `src/app/(storefront)/checkout/success/success-slider.module.scss`

## Workflow

1. Add/edit slide **data** (id, title, href, desktop/mobile image paths).
2. Put assets in `public/images/` as desktop + mobile variants. Use `next/image`.
3. Keep `framer-motion` easing/interval already on the component.
4. Restyle by editing the colocated module or existing Tailwind on the hero — **do not paste styling boilerplate into chat**.

Juice: keep the success-slider placeholder until real creative exists. Do not fake a finished Juice campaign.
