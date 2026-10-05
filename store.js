// Shared helpers: DOM, formatting, cart (LocalStorage), header, toast.
export const $ = (s, r = document) => r.querySelector(s);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
export const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
export const same = (a, b) => String(a) === String(b);
export const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#eceef6"/><path d="M60 130l30-36 24 28 16-18 20 26z" fill="#c3c8e0"/><circle cx="76" cy="76" r="12" fill="#c3c8e0"/></svg>');

const KEY = 'cart';
export const getCart = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const save = (c) => { localStorage.setItem(KEY, JSON.stringify(c)); badge(); };
export function addToCart(p, qty = 1) {
  const c = getCart(), hit = c.find(i => same(i.id, p.id));
  hit ? hit.qty += qty : c.push({ id: p.id, title: p.title, price: p.price, image: p.image, category: p.category, qty });
  save(c);
}
export const setQty = (id, q) => save(q <= 0 ? getCart().filter(i => !same(i.id, id)) : getCart().map(i => same(i.id, id) ? { ...i, qty: q } : i));
export const cartCount = () => getCart().reduce((s, i) => s + i.qty, 0);
export const cartTotal = () => getCart().reduce((s, i) => s + i.qty * i.price, 0);
export function badge() { const b = $('#cartBadge'); if (b) { const n = cartCount(); b.textContent = n; b.hidden = !n; } }

export function toast(msg, bad = false) {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : '');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200);
}
export const show = (sel, on) => { const el = $(sel); if (el) el.style.display = on ? 'flex' : 'none'; };

$('#top').innerHTML = `<div class="wrap in"><a class="brand" href="index.html">Bazaarly</a>
${document.body.dataset.search === '1' ? '<input id="search" type="search" placeholder="Search products" aria-label="Search products">' : '<span></span>'}
<a class="cartbtn" href="cart.html">Cart <b id="cartBadge" hidden>0</b></a></div>`;
badge();
