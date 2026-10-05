import { $, esc, money, getCart, setQty, cartTotal, cartCount, same, PLACEHOLDER } from './store.js';

function render() {
  const cart = getCart(), root = $('#cartRoot');
  if (!cart.length) { root.innerHTML = '<div class="empty"><h2>Your cart is empty</h2><p>Pick something from the shelf and it will show up here.</p><a class="btn dark" href="index.html">Browse products</a></div>'; return; }
  const sub = cartTotal(), ship = sub >= 50 ? 0 : 4.99;
  root.innerHTML = `<div class="cartgrid"><div>${cart.map(i => `<div class="line"><img src="${esc(i.image || PLACEHOLDER)}" alt="" onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
<div><span class="cat">${esc(i.category)}</span><h3>${esc(i.title)}</h3><small>${money(i.price)} each</small></div>
<div class="step"><button data-a="-" data-id="${esc(i.id)}" aria-label="Less">−</button><span>${i.qty}</span><button data-a="+" data-id="${esc(i.id)}" aria-label="More">+</button></div>
<b>${money(i.price * i.qty)}</b><button class="btn ghost" data-a="x" data-id="${esc(i.id)}">Remove</button></div>`).join('')}</div>
<aside class="sum"><h2>Order summary</h2><p><span>Items (${cartCount()})</span><span>${money(sub)}</span></p><p><span>Shipping</span><span>${ship ? money(ship) : 'Free'}</span></p>
<p class="tot"><span>Total</span><span>${money(sub + ship)}</span></p><button class="btn dark" id="co">Checkout</button><small>Free shipping on orders of $50 or more.</small></aside></div>`;
}
$('#cartRoot').addEventListener('click', e => {
  if (e.target.id === 'co') return alert('This is a demo checkout. No payment is taken.');
  const b = e.target.closest('[data-a]'); if (!b) return;
  const it = getCart().find(i => same(i.id, b.dataset.id));
  setQty(b.dataset.id, b.dataset.a === 'x' ? 0 : it.qty + (b.dataset.a === '+' ? 1 : -1)); render();
});
render();
