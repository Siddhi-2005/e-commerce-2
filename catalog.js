import { fetchProducts, addProduct, deleteProduct, getSource } from './api.js';
import { $, esc, money, same, toast, addToCart, show, PLACEHOLDER } from './store.js';

const PAGE = 8;
let products = [];
const st = { q: '', cat: 'all', sort: 'default', page: 1 };

const cache = () => sessionStorage.setItem('catalog', JSON.stringify(products));
const rate = (p) => p.rating?.rate ?? 0;
const skeletons = () => Array(8).fill('<div class="card sk"><div class="img"></div><i></i><i></i><i class="s"></i></div>').join('');

async function load() {
  show('#spinner', true); $('#error-msg').hidden = true; $('#grid').innerHTML = skeletons();
  try {
    products = await fetchProducts(); cache();
    $('#status').textContent = `${products.length} products, loaded live from ${getSource()}`;
    render();
  } catch (err) {
    $('#grid').innerHTML = ''; $('#pager').innerHTML = ''; $('#chips').innerHTML = '';
    $('#error-text').textContent = `We couldn't load products. ${err.message} Check that you can open https://fakestoreapi.com/products in a new tab, then try again.`;
    $('#error-msg').hidden = false; $('#status').textContent = 'Store unavailable';
    console.error(err);
  } finally { show('#spinner', false); }
}

function filtered() {
  const r = products.filter(p => (st.cat === 'all' || p.category === st.cat) && p.title.toLowerCase().includes(st.q));
  const by = { 'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price,
    'name-asc': (a, b) => a.title.localeCompare(b.title), 'rating-desc': (a, b) => rate(b) - rate(a) }[st.sort];
  return by ? r.sort(by) : r;
}

function render() {
  const cats = ['all', ...new Set(products.map(p => p.category))];
  $('#chips').innerHTML = cats.map(c => `<button class="chip ${c === st.cat ? 'on' : ''}" data-c="${esc(c)}">${c === 'all' ? 'All' : esc(c)}</button>`).join('');
  $('#cats').innerHTML = cats.slice(1).map(c => `<option value="${esc(c)}">`).join('');
  const all = filtered(), pages = Math.max(1, Math.ceil(all.length / PAGE));
  st.page = Math.min(st.page, pages);
  const items = all.slice((st.page - 1) * PAGE, st.page * PAGE);
  $('#grid').innerHTML = items.length ? items.map(card).join('') :
    `<div class="empty"><h2>${products.length ? 'Nothing matches that' : 'The shelf is empty'}</h2><p>${products.length ? 'Try another search or pick a different category.' : 'Add the first product with the button above.'}</p></div>`;
  $('#pager').innerHTML = pages < 2 ? '' :
    `<button data-p="${st.page - 1}" ${st.page === 1 ? 'disabled' : ''}>Prev</button>` +
    Array.from({ length: pages }, (_, i) => `<button data-p="${i + 1}" class="${i + 1 === st.page ? 'on' : ''}">${i + 1}</button>`).join('') +
    `<button data-p="${st.page + 1}" ${st.page === pages ? 'disabled' : ''}>Next</button>`;
}

function card(p) {
  const r = rate(p);
  return `<article class="card"><a class="img" href="product.html?id=${esc(p.id)}"><img src="${esc(p.image || PLACEHOLDER)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER}'"><span class="tag">${money(p.price)}</span></a>
<button class="del" data-del="${esc(p.id)}" aria-label="Delete ${esc(p.title)}" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
<div class="body"><span class="cat">${esc(p.category)}</span><h3><a href="product.html?id=${esc(p.id)}">${esc(p.title)}</a></h3>
<div class="meta">${r ? `<span class="star">★ ${r.toFixed(1)}</span> (${p.rating.count})` : '<span class="new">New</span>'}</div>
<button class="btn" data-add="${esc(p.id)}">Add to cart</button></div></article>`;
}

// ---- events ----
const go = () => { st.page = 1; render(); };
let deb;
$('#search').addEventListener('input', e => { clearTimeout(deb); deb = setTimeout(() => { st.q = e.target.value.trim().toLowerCase(); go(); }, 300); });
$('#sort').addEventListener('change', e => { st.sort = e.target.value; go(); });
$('#retry').addEventListener('click', load);
$('#chips').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { st.cat = b.dataset.c; go(); } });
$('#pager').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b && !b.disabled) { st.page = +b.dataset.p; render(); scrollTo({ top: 0, behavior: 'smooth' }); } });
$('#grid').addEventListener('click', e => {
  const add = e.target.closest('[data-add]'), del = e.target.closest('[data-del]');
  if (add) { const p = products.find(x => same(x.id, add.dataset.add)); addToCart(p); toast(`${p.title} added to cart`); }
  if (del) askDelete(products.find(x => same(x.id, del.dataset.del)));
});

function askDelete(p) {
  const d = $('#confirm'); $('#confirmText').textContent = p.title; d.showModal();
  $('#no').onclick = () => d.close();
  $('#yes').onclick = async () => {
    d.close();
    const before = products;
    products = products.filter(x => x !== p); cache(); render();       // optimistic: remove right away
    try { await deleteProduct(p.id); toast('Product deleted'); }
    catch (err) {                                                       // revert if the server refuses
      products = before; cache(); render(); toast("Couldn't delete. The product was restored.", true); console.error(err);
    }
  };
}

const dlg = $('#addDialog');
$('#openAdd').onclick = () => dlg.showModal();
$('#cancelAdd').onclick = () => dlg.close();
$('#add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#saveAdd'); btn.disabled = true; btn.textContent = 'Adding…';
  const body = { title: $('#title').value.trim(), price: parseFloat($('#price').value), category: $('#category').value.trim().toLowerCase(),
    description: $('#description').value.trim(), image: $('#image').value.trim() || PLACEHOLDER };
  try {
    const created = await addProduct(body);
    // FakeStoreAPI doesn't persist and always answers id 21, so make sure the id is unique locally.
    const id = created?.id == null || products.some(p => same(p.id, created.id))
      ? Math.max(0, ...products.map(p => +p.id || 0)) + 1 : created.id;
    products.unshift({ ...body, ...created, id }); cache();
    st.cat = 'all'; st.q = ''; $('#search').value = ''; go();
    e.target.reset(); dlg.close(); toast('Product added');
  } catch (err) { toast("Couldn't add the product. Check your connection and try again.", true); console.error(err); }
  finally { btn.disabled = false; btn.textContent = 'Add product'; }
});

load();
