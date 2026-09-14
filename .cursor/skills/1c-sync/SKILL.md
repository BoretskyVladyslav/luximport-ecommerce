---
name: 1c-sync
description: Parses catalog/1C files (XLSX, CSV, JSON/XML) and upserts Sanity products by SKU. Use when working on catalog import, 1C sync, update-catalog, import-data, admin product import, or CommerceML.
---

# 1C / catalog sync

There is no SQL database. Products live in Sanity. There is no CommerceML parser yet — new 1C JSON/XML must map into `ParsedProductRow` and call `applyProductImport`. Do not fork a second upsert path.

## Canonical paths

- HTTP: `src/app/api/admin/products/import/route.ts` → `src/lib/product-import.ts`
- CLI: `npm run update-catalog` / `npm run update-catalog:dry` → `scripts/update-from-excel.mjs`
- Offline full import: `npm run import-data` → `scripts/importProducts.mjs`

Column aliases and merged-cell offsets: [reference.md](reference.md) (read only when mapping headers).

## Identity and writes

- Match **SKU first**, barcode fallback.
- Skip rows without title + sku. New products require `price > 0`.
- Patch allowlisted fields only. Never unset `price` / `sku` / `title`. Never touch `images` unless the file supplies an image URL.
- Batch Sanity patches. Do not chatter one mutation per row when a batch exists.
- Auth on HTTP import: `Authorization: Bearer` or `x-import-token` vs `SANITY_API_WRITE_TOKEN`.

## Token isolation

1. Dry-run first (`--dry-run` or `?dryRun=1`).
2. Report header sample + row counts only. Never paste workbooks or full logs into chat.
3. Send traces to the `debugger` subagent. Send pass/fail to `verifier`.
