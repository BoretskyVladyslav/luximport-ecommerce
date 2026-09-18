# Catalog header aliases

`offset` is columns to the **right** of the header cell (merged 1C/Excel labels). Canonical maps: `HEADER_ALIASES` in `src/lib/product-import.ts` and `COLUMNS` in `scripts/update-from-excel.mjs`.

## HTTP parser (`product-import.ts`)

- sku `0`: Артикул, sku, article, article number
- title `0`: Повне найменування, Назва товару, назва, title, name, product name
- price `1`: Сайт
- price `0`: Ціна, price, retail price
- wholesalePrice `1`: оптова
- wholesalePrice `0`: wholesale, wholesaleprice
- barcode `0`: Штрихкод, barcode
- stock `0`: Залишок, Залишок на складі, stock, quantity, qty
- description `0`: Опис, description
- category `0`: головна група, категорія, category
- subcategory `0`: під група, підкатегорія, subcategory
- imageUrl `0`: Фото, зображення, image, images, imageurl, image url
- brand `0`: Бренд, brand
- origin `0`: Країна, origin
- weight `0`: грамаж, weight
- piecesPerBox `0`: шт в ящиу, шт в ящику, piecesperbox

## CLI updater (`update-from-excel.mjs`)

- sku `0`: Артикул
- barcode `0`: Штрихкод
- title `0`: Повне найменування
- mainGroup `0`: головна ГРУПА, Головна ГРУПА, ГОЛОВНА ГРУПА
- subGroup `0`: ПІД ГРУПА, під група, ПІД ГРУПП
- weight `0`: грамаж, Грамаж
- piecesPerBox `0`: шт в ящиу, шт в ящику
- price `1`: Сайт
- wholesalePrice `1`: оптова, Оптова
- stock `0`: Залишок, Залишок на складі, stock
