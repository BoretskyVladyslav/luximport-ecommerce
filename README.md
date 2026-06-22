# Luximport — Premium E-Commerce Platform

> Live: [luximport.org](https://luximport.org/)

<img width="1913" height="1088" alt="Знімок екрана 2026-06-22 115017" src="https://github.com/user-attachments/assets/19f96cf0-d826-4a78-a78d-301df912aa68" />


## What it does
A high-load premium e-commerce platform for imported European gastronomy. Features complex product catalogs, persistent cart state management, and seamless logistics integration.

## Tech Stack
Next.js (App Router) · TypeScript · Sanity.io (Headless CMS) · Zustand · Tailwind CSS · Nova Poshta API

## Key Engineering Decisions
- **Decoupled Architecture:** Integrated Sanity.io (Headless CMS) with Next.js ISR (Incremental Static Regeneration). This allows the client to update catalogs instantly without triggering full site rebuilds or requiring developer intervention.
- **State Management:** Chosen Zustand over Redux for cart state management to ensure a lightweight, boilerplate-free checkout experience without unnecessary re-renders.
- **Performance Optimization:** Leveraged Next.js App Router and `next/image` to maintain lightning-fast page loads (Core Web Vitals), which is critical for e-commerce conversion rates.

## Getting Started
```bash
npm install
npm run dev
