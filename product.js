import { fetchProduct } from './api.js';
import { $, esc, money, same, toast, addToCart, show, PLACEHOLDER } from './store.js';

const id = new URLSearchParams(location.search).get('id');
const fail = (m) => { const e = $('#error-msg'); e.innerHTML = `<p>${m}</p><a class="btn" href="index.html">Back to shop</a>`; e.hidden = false; };

async function init() {
  show('#spinner', true);
  try {
    const cached = JSON.parse(sessionStorage.getItem('catalog') || '[]').find(p => same(p.id, id));
    const p = cached || await fetchProduct(id);
    if (!p || !p.title) return fail("That product doesn't exist anymore.");
    document.title = `${p.title} | Bazaarly`;
    let qty = 1;
    $('#detail').className = 'detail';
    $('#detail').innerHTML = `<div class="pic"><img src="${esc(p.image || PLACEHOLDER)}" alt="${esc(p.title)}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'"></div>
<div><span class="cat">${esc(p.category)}</span><h1>${esc(p.title)}</h1>
<div class="meta">${p.rating ? `<span class="star">★ ${p.rating.rate.toFixed(1)}</span> (${p.rating.count} reviews)` : '<span class="new">New</span>'}</div>
<p class="price">${money(p.price)}</p><p class="desc">${esc(p.description || 'No description yet.')}</p>
<div class="row l"><div class="step"><button id="m" aria-label="Less">−</button><span id="q">1</span><button id="pl" aria-label="More">+</button></div><button class="btn dark" id="add">Add to cart</button></div></div>`;
    $('#m').onclick = () => { qty = Math.max(1, qty - 1); $('#q').textContent = qty; };
    $('#pl').onclick = () => { qty++; $('#q').textContent = qty; };
    $('#add').onclick = () => { addToCart(p, qty); toast(`${qty} × ${p.title} added to cart`); };
  } catch (err) { fail(`We couldn't load this product. ${err.message}`); console.error(err); }
  finally { show('#spinner', false); }
}
init();
