// api.js — the ONLY file that talks to the network. UI code calls these functions.
// Order: FakeStoreAPI -> DummyJSON -> bundled data/products.json (offline demo, changes are not saved).
// For persistent CRUD, set PRIMARY to 'http://localhost:3000' and run JSON Server (see README).
const PRIMARY = 'https://fakestoreapi.com';
const BACKUP = 'https://dummyjson.com';
let source = 'primary';
export const getSource = () => ({ primary: PRIMARY, backup: BACKUP, local: 'local sample data (APIs unreachable)' }[source]).replace('https://', '');
const LOCAL = 'data/products.json';

async function request(url, options) {
  let res;
  try { res = await fetch(url, options); }
  catch { const e = new Error('Network error. The server could not be reached.'); e.network = true; throw e; }
  if (!res.ok) throw new Error(`The server responded with ${res.status}.`);
  const text = await res.text();              // some DELETE responses have an empty body
  return text ? JSON.parse(text) : null;
}
const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// DummyJSON uses a different shape; convert it to the FakeStoreAPI shape the UI expects.
const adapt = (p) => ({ id: p.id, title: p.title, price: p.price, description: p.description,
  category: String(p.category).replace(/-/g, ' '), image: p.thumbnail || p.images?.[0],
  rating: { rate: p.rating || 0, count: p.reviews?.length ?? 0 } });

export async function fetchProducts() {
  try { source = 'primary'; return await request(`${PRIMARY}/products`); }
  catch (err) {
    if (!err.network) throw err;
    console.warn('Primary API unreachable, trying backup…');
    try { source = 'backup'; const data = await request(`${BACKUP}/products?limit=24`); return data.products.map(adapt); }
    catch (e2) { if (!e2.network) throw e2; source = 'local'; return request(LOCAL); }
  }
}
export async function fetchProduct(id) {
  if (source === 'primary') return request(`${PRIMARY}/products/${id}`);
  if (source === 'local') return (await request(LOCAL)).find(p => String(p.id) === String(id)) || null;
  return adapt(await request(`${BACKUP}/products/${id}`));
}
export const addProduct = async (product) => source === 'local' ? { id: Date.now(), ...product } : source === 'primary'
  ? request(`${PRIMARY}/products`, json('POST', product))
  : request(`${BACKUP}/products/add`, json('POST', product));
export const deleteProduct = async (id) => source === 'local' ? null : request(`${source === 'primary' ? PRIMARY : BACKUP}/products/${id}`, { method: 'DELETE' });
