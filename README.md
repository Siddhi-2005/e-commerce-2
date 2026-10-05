# Bazaarly — Task 6 (Product Catalog + Live API)

## Run
The app uses ES modules, so it must be served over http (not opened by double-click).
VS Code: right-click `index.html` → **Open with Live Server**.  Or: `npx serve .`

## Use FakeStoreAPI (default)
Nothing to set up. Note: FakeStoreAPI accepts POST/DELETE but does **not** save them, so a page refresh brings the 20 original products back. That is normal.

## Use JSON Server (changes persist — full CRUD)
1. `npm run seed`   (downloads the 20 products into db.json)
2. `npm run api`    (API on http://localhost:3000)
3. In `js/api.js` set `BASE_URL = 'http://localhost:3000'`

## Files
- `js/api.js` — all fetch calls (service layer)
- `js/catalog.js` — shop page: loading, error + retry, search (300ms debounce), category, sort, pagination, add, optimistic delete
- `js/product.js`, `js/cart.js`, `js/store.js` — detail page, cart page (LocalStorage), shared helpers
