// ─── API Helpers ──────────────────────────────────────────────
const api = {
  async get(url) {
    const r = await fetch(url); return r.json();
  },
  async post(url, data) {
    const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    return r.json();
  }
};

// ─── State ────────────────────────────────────────────────────
let currentCategory = 'all';
let currentSort     = 'default';
let currentSearch   = '';
let wishlistIds     = [];

// ─── Navigation ───────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');
  const link = document.getElementById('nav-' + name);
  if (link) link.classList.add('active');
  window.scrollTo({ top:0, behavior:'smooth' });

  if (name === 'cart')     renderCart();
  if (name === 'checkout') renderCheckoutSummary();
  if (name === 'wishlist') renderWishlist();
  if (name === 'orders')   renderOrders();
}

// ─── Search ───────────────────────────────────────────────────
let searchTimer;
function handleSearch(val) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentSearch = val.trim();
    if (currentSearch) {
      // Jump to home/shop section
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-home').classList.add('active');
      document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
      document.getElementById('nav-home').classList.add('active');
      document.getElementById('shop-section').scrollIntoView({ behavior:'smooth' });
    }
    loadProducts();
  }, 300);
}

function clearSearch() {
  currentSearch = '';
  document.getElementById('nav-search-input').value = '';
  document.getElementById('search-banner').style.display = 'none';
  loadProducts();
}

// ─── Products ─────────────────────────────────────────────────
async function loadProducts() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '<div class="loading-state"><div class="spinner"></div>Loading products…</div>';
  const url = `/api/products?category=${currentCategory}&sort=${currentSort}&q=${encodeURIComponent(currentSearch)}`;
  const products = await api.get(url);

  // Search banner
  const banner = document.getElementById('search-banner');
  if (currentSearch) {
    banner.style.display = 'flex';
    document.getElementById('search-banner-text').textContent =
      `${products.length} result${products.length !== 1 ? 's' : ''} for "${currentSearch}"`;
  } else {
    banner.style.display = 'none';
  }

  renderProducts(products, grid);
}

function renderProducts(products, grid) {
  if (!products.length) {
    grid.innerHTML = `<div class="loading-state">
      <div style="font-size:2.5rem;margin-bottom:12px">🔍</div>
      No items found${currentSearch ? ` for "<strong>${currentSearch}</strong>"` : ''}.
      ${currentSearch ? '<br><button onclick="clearSearch()" style="margin-top:10px;background:var(--rust);color:white;border:none;padding:8px 18px;border-radius:7px;cursor:pointer;font-family:inherit;">Clear Search</button>' : ''}
    </div>`;
    return;
  }
  grid.innerHTML = products.map(p => {
    const wishlisted = wishlistIds.includes(p.id);
    const condLabel  = p.condition === 'new' ? 'Like New' : p.condition === 'good' ? 'Good' : 'Fair';
    const savings    = Math.round((1 - p.price / p.original) * 100);
    return `
      <div class="product-card" onclick="openProduct(${p.id})">
        <div class="product-img-wrap">
          <img src="${p.image}"alt="${p.name}" loading="lazy"/>
          <span class="condition-badge badge-${p.condition}">${condLabel}</span>
          <button class="wishlist-btn ${wishlisted ? 'wishlisted' : ''}"
            onclick="event.stopPropagation(); toggleWishlist(${p.id}, this)"
            title="${wishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}">
            ${wishlisted ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-cat">${p.category} · Save ${savings}%</div>
          <div class="product-footer">
            <div>
              <span class="product-price">₹${p.price.toLocaleString('en-IN')}</span>
              <span class="original-price">₹${p.original.toLocaleString('en-IN')}</span>
            </div>
            <button class="add-btn" title="Add to Cart"
              onclick="event.stopPropagation(); quickAdd(${p.id}, '${p.name.replace(/'/g,"\\'")}')">+</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function applySortFilter() {
  currentSort = document.getElementById('sort-select').value;
  loadProducts();
}

// ─── Product Detail ───────────────────────────────────────────
async function openProduct(id) {
  const p = await api.get(`/api/product/${id}`);
  const savings    = Math.round((1 - p.price / p.original) * 100);
  const wishlisted = wishlistIds.includes(p.id);
  const stockLow   = p.stock <= 1;

  document.getElementById('detail-content').innerHTML = `
    <div class="detail-img-box">
      <img src="${p.image}" alt="${p.name}"/>
    </div>
    <div class="detail-info">
      <div class="detail-category">${p.category.toUpperCase()} · SIZE ${p.size}</div>
      <h2 class="detail-name">${p.name}</h2>
      <div class="detail-price">₹${p.price.toLocaleString('en-IN')}</div>
      <div class="detail-original">Original: ₹${p.original.toLocaleString('en-IN')}</div>
      <span class="savings-badge">🎉 You save ${savings}% vs retail</span>
      <div class="stock-info">
        <span class="stock-dot ${stockLow ? 'low' : ''}"></span>
        ${stockLow ? `Only ${p.stock} left — grab it fast!` : `${p.stock} in stock`}
      </div>
      <hr class="detail-divider"/>
      <p class="detail-desc">${p.description}</p>
      <div class="detail-tags">${p.tags.map(t => `<span class="detail-tag">${t}</span>`).join('')}</div>
      <div class="detail-actions">
        <button class="detail-add-btn" onclick="addToCart(${p.id}, '${p.name.replace(/'/g,"\\'")}')">
          Add to Cart
        </button>
        <button class="detail-wish-btn ${wishlisted ? 'wishlisted' : ''}"
          id="detail-wish-btn"
          onclick="toggleWishlist(${p.id}, this, true)"
          title="${wishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}">
          ${wishlisted ? '❤️' : '🤍'}
        </button>
      </div>
    </div>`;

  // Related products
  const relSec = document.getElementById('related-section');
  if (p.related && p.related.length) {
    relSec.innerHTML = `
      <div class="related-section">
        <h3 class="related-title">You might also like</h3>
        <div class="related-grid">
          ${p.related.map(r => `
            <div class="product-card" onclick="openProduct(${r.id})">
              <div class="product-img-wrap" style="height:180px">
                <img src="${r.image}" alt="${r.name}" loading="lazy"/>
                <span class="condition-badge badge-${r.condition}">${r.condition === 'new' ? 'Like New' : r.condition === 'good' ? 'Good' : 'Fair'}</span>
              </div>
              <div class="product-info">
                <div class="product-name" style="font-size:.92rem">${r.name}</div>
                <div class="product-footer" style="margin-top:8px">
                  <span class="product-price" style="font-size:1rem">₹${r.price.toLocaleString('en-IN')}</span>
                  <button class="add-btn" onclick="event.stopPropagation(); quickAdd(${r.id}, '${r.name.replace(/'/g,"\\'")}')">+</button>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  } else { relSec.innerHTML = ''; }

  showPage('product');
}

// ─── Wishlist ─────────────────────────────────────────────────
async function loadWishlistIds() {
  const data = await api.get('/api/wishlist');
  wishlistIds = data.ids;
  updateWishlistCount(wishlistIds.length);
}

function updateWishlistCount(n) {
  const badge = document.getElementById('wishlist-count');
  badge.textContent = n;
  badge.style.display = n > 0 ? 'flex' : 'none';
}

async function toggleWishlist(id, btn, isDetailPage = false) {
  const data = await api.post('/api/wishlist/toggle', { id });
  if (data.added) {
    wishlistIds.push(id);
    btn.textContent = '❤️';
    btn.classList.add('wishlisted');
    showToast('❤️ Saved to wishlist');
  } else {
    wishlistIds = wishlistIds.filter(x => x !== id);
    btn.textContent = '🤍';
    btn.classList.remove('wishlisted');
    showToast('Removed from wishlist');
  }
  updateWishlistCount(wishlistIds.length);
  // Sync the grid card heart if on detail page
  if (isDetailPage) loadProducts();
}

async function renderWishlist() {
  const grid = document.getElementById('wishlist-grid');
  grid.innerHTML = '<div class="loading-state"><div class="spinner"></div>Loading…</div>';
  const data = await api.get('/api/wishlist');
  wishlistIds = data.ids;

  if (!data.items.length) {
    grid.innerHTML = `<div class="wishlist-empty">
      <div class="empty-icon">🤍</div>
      <p>Your wishlist is empty.<br>Tap ❤️ on any item to save it here.</p>
      <button class="btn-primary" style="margin-top:20px" onclick="showPage('home')">Browse Shop</button>
    </div>`;
    return;
  }

  grid.innerHTML = data.items.map(p => {
    const condLabel = p.condition === 'new' ? 'Like New' : p.condition === 'good' ? 'Good' : 'Fair';
    return `
      <div class="product-card" onclick="openProduct(${p.id})">
        <div class="product-img-wrap">
          <img src="${p.image}" alt="${p.name}" loading="lazy"/>
          <span class="condition-badge badge-${p.condition}">${condLabel}</span>
          <button class="wishlist-btn wishlisted"
            onclick="event.stopPropagation(); toggleWishlist(${p.id}, this); setTimeout(renderWishlist,300)"
            title="Remove from Wishlist">❤️</button>
        </div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-cat">${p.category}</div>
          <div class="product-footer">
            <span class="product-price">₹${p.price.toLocaleString('en-IN')}</span>
            <button class="add-btn" onclick="event.stopPropagation(); quickAdd(${p.id}, '${p.name.replace(/'/g,"\\'")}')">+</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ─── Cart ─────────────────────────────────────────────────────
async function quickAdd(id, name) {
  const data = await api.post('/api/cart/add', { id });
  if (data.success) { updateCartCount(data.count); showToast(`✦ ${name} added to cart`); }
}
async function addToCart(id, name) {
  const data = await api.post('/api/cart/add', { id });
  if (data.success) { updateCartCount(data.count); showToast(`✦ ${name} added to cart`); }
}
async function changeQty(id, delta) {
  const data = await api.post('/api/cart/update', { id, delta });
  updateCartCount(data.count);
  renderCart();
}
async function removeItem(id) {
  const data = await api.post('/api/cart/remove', { id });
  updateCartCount(data.count);
  renderCart();
  showToast('Item removed', 'neutral');
}
function updateCartCount(n) {
  document.getElementById('cart-count').textContent = n;
}

async function renderCart() {
  const cartData  = await api.get('/api/cart');
  const itemsWrap = document.getElementById('cart-items-wrap');
  const sidebar   = document.getElementById('cart-sidebar');

  if (!cartData.items.length) {
    itemsWrap.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        <p>Your cart is empty.<br>Head back to the shop to find some gems!</p>
        <button class="btn-primary" style="margin-top:20px" onclick="showPage('home')">Browse Shop</button>
      </div>`;
    sidebar.innerHTML = ''; return;
  }

  itemsWrap.innerHTML = cartData.items.map(item => `
    <div class="cart-item">
      <img class="cart-img" src="${item.image}" alt="${item.name}"/>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-cat">${item.category} · Size ${item.size}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
      </div>
      <div class="cart-item-price">₹${(item.price*item.qty).toLocaleString('en-IN')}</div>
      <button class="remove-btn" onclick="removeItem(${item.id})" title="Remove">✕</button>
    </div>`).join('');

  const freeShip = cartData.shipping === 0 && cartData.subtotal > 0;
  const couponHTML = cartData.coupon
    ? `<div class="coupon-tag">🏷 Code <strong>${cartData.coupon}</strong> applied — ${cartData.discount > 0 ? '−₹'+cartData.discount.toLocaleString('en-IN') : ''} off
        <button onclick="removeCoupon()">✕</button></div>`
    : `<div class="coupon-row">
        <input class="coupon-input" id="coupon-input" type="text" placeholder="Enter coupon code…" onkeydown="if(event.key==='Enter') applyCoupon()"/>
        <button class="coupon-apply-btn" onclick="applyCoupon()">Apply</button>
       </div>`;

  sidebar.innerHTML = `
    <div class="cart-summary-box">
      <div class="summary-title">Order Summary</div>
      ${couponHTML}
      <div class="summary-row"><span>Subtotal (${cartData.items.reduce((s,i)=>s+i.qty,0)} items)</span><span>₹${cartData.subtotal.toLocaleString('en-IN')}</span></div>
      ${cartData.discount > 0 ? `<div class="summary-row discount"><span>Coupon Discount</span><span>−₹${cartData.discount.toLocaleString('en-IN')}</span></div>` : ''}
      <div class="summary-row ${freeShip ? 'free' : ''}">
        <span>Shipping</span>
        <span>${freeShip ? '🎉 Free!' : cartData.shipping > 0 ? '₹'+cartData.shipping : '—'}</span>
      </div>
      ${!freeShip && cartData.subtotal > 0 ? `<div class="summary-row" style="font-size:.74rem;">Add ₹${(1500-cartData.subtotal).toLocaleString('en-IN')} more for free shipping</div>` : ''}
      <div class="summary-total"><span>Total</span><span>₹${cartData.total.toLocaleString('en-IN')}</span></div>
      <button class="checkout-btn" onclick="showPage('checkout')">Proceed to Checkout →</button>
      <div style="font-size:.72rem;color:var(--muted);text-align:center;margin-top:12px;">Try codes: REWEAR10 · FIRST50 · THRIFT20</div>
    </div>`;
}

// ─── Coupons ──────────────────────────────────────────────────
async function applyCoupon() {
  const input = document.getElementById('coupon-input');
  if (!input) return;
  const code = input.value.trim();
  if (!code) return;
  const data = await api.post('/api/coupon/apply', { code });
  if (data.success) {
    showToast(`🏷 ${data.label} applied!`);
    renderCart();
  } else {
    showToast('⚠ Invalid coupon code', 'error');
  }
}
async function removeCoupon() {
  await api.post('/api/coupon/remove', {});
  showToast('Coupon removed');
  renderCart();
}

// ─── Checkout ─────────────────────────────────────────────────
async function renderCheckoutSummary() {
  const cartData = await api.get('/api/cart');
  const box = document.getElementById('checkout-summary');
  if (!cartData.items.length) {
    box.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted)">Cart is empty</div>`; return;
  }
  box.innerHTML = `
    <div class="checkout-order-summary">
      <div class="summary-title">Your Order</div>
      ${cartData.items.map(item => `
        <div class="checkout-cart-item">
          <img class="checkout-cart-img" src="${item.image}" alt="${item.name}"/>
          <div style="flex:1;min-width:0">
            <div class="checkout-cart-name">${item.name}</div>
            <div class="checkout-cart-sub">Qty ${item.qty} · Size ${item.size}</div>
          </div>
          <div class="checkout-cart-price">₹${(item.price*item.qty).toLocaleString('en-IN')}</div>
        </div>`).join('')}
      <hr style="border:none;border-top:1px solid rgba(196,168,130,0.15);margin:14px 0"/>
      <div class="summary-row"><span>Subtotal</span><span>₹${cartData.subtotal.toLocaleString('en-IN')}</span></div>
      ${cartData.discount > 0 ? `<div class="summary-row discount"><span>Discount</span><span>−₹${cartData.discount.toLocaleString('en-IN')}</span></div>` : ''}
      <div class="summary-row ${cartData.shipping===0 ? 'free' : ''}">
        <span>Shipping</span>
        <span>${cartData.shipping===0 ? '🎉 Free' : '₹'+cartData.shipping}</span>
      </div>
      <div class="summary-total"><span>Total</span><span>₹${cartData.total.toLocaleString('en-IN')}</span></div>
    </div>`;
}

async function placeOrder() {
  const fname   = document.getElementById('f-fname').value.trim();
  const lname   = document.getElementById('f-lname').value.trim();
  const phone   = document.getElementById('f-phone').value.trim();
  const email   = document.getElementById('f-email').value.trim();
  const address = document.getElementById('f-address').value.trim();
  const notes   = document.getElementById('f-notes').value.trim();
  const payment = document.querySelector('.pay-opt.selected')?.dataset.pay || 'cod';

  if (!fname || !phone || !address) { showToast('⚠ Please fill Name, Phone & Address', 'error'); return; }

  const btn = document.querySelector('.order-btn');
  btn.textContent = 'Placing Order…'; btn.disabled = true;

  const result = await api.post('/api/order', {
    name: fname + (lname ? ' '+lname : ''),
    phone, email, address, notes, payment
  });

  btn.textContent = 'Place Order ✦'; btn.disabled = false;

  if (result.success) {
    document.getElementById('success-msg').textContent =
      `Thank you, ${result.name}! Your order of ₹${result.total.toLocaleString('en-IN')} is confirmed.`;
    document.getElementById('success-order-id').textContent = `Order ID: ${result.order_id}`;
    ['f-fname','f-lname','f-phone','f-email','f-address','f-notes'].forEach(id => document.getElementById(id).value = '');
    updateCartCount(0);
    showPage('success');
  } else {
    showToast('⚠ ' + result.message, 'error');
  }
}

// ─── Orders ───────────────────────────────────────────────────
async function renderOrders() {
  const orders = await api.get('/api/orders');
  const list   = document.getElementById('orders-list');

  if (!orders.length) {
    list.innerHTML = `<div class="orders-empty">
      <div style="font-size:3rem;margin-bottom:14px">📦</div>
      <p>No orders yet.<br>Place your first thrift order and it'll appear here.</p>
      <button class="btn-primary" style="margin-top:20px" onclick="showPage('home')">Start Shopping</button>
    </div>`; return;
  }

  list.innerHTML = orders.map(o => `
    <div class="order-card">
      <div class="order-card-header">
        <div>
          <div class="order-id">${o.id}</div>
          <div class="order-date">${o.date} · ${o.payment.toUpperCase()}</div>
        </div>
        <span class="order-status status-confirmed">${o.status}</span>
      </div>
      <div class="order-items-row">
        ${o.items.map(i => `<img class="order-item-thumb" src="${i.image}" alt="${i.name}" title="${i.name} ×${i.qty}"/>`).join('')}
      </div>
      <div class="order-footer">
        <span>${o.items.reduce((s,i)=>s+i.qty,0)} item(s) · ${o.address.split(',').slice(-1)[0].trim()}</span>
        <span class="order-total">₹${o.total.toLocaleString('en-IN')}</span>
      </div>
    </div>`).join('');
}

// ─── Payment selection ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.pay-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.cat;
      loadProducts();
    });
  });

  // Init
  loadWishlistIds().then(() => loadProducts());
  api.get('/api/cart').then(data => updateCartCount(data.count));
});

// ─── Toast ────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const t   = document.getElementById('toast');
  const dot = document.getElementById('toast-dot');
  document.getElementById('toast-msg').textContent = msg;
  dot.className = 'toast-dot' + (type === 'error' ? ' error' : '');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}