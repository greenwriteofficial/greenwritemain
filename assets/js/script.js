/* assets/js/script.js
   Full-site interactive behavior for GreenWrite
   - header, mobile menu, dark mode
   - typed text, parallax hero
   - reveal / counters
   - slideshows (hero, products)
   - lightbox
   - order form totals, preview, save, send to WhatsApp
   - back-to-top, floating WhatsApp
*/

/* ---------------------------
   Utilities
----------------------------*/
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const safe = fn => { try { return fn(); } catch(e) { console.warn(e); } };

/* ---------------------------
   HEADER: sticky + hamburger + mobile menu
----------------------------*/
(function headerInit() {
  const siteHeader = document.querySelector('.site-header') || $('header');
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  // sticky/shrink on scroll
  if (siteHeader) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) siteHeader.classList.add('shrink');
      else siteHeader.classList.remove('shrink');
    }, { passive: true });
  }

  // hamburger open/close
  if (menuBtn && mobileMenu) {
    const openMenu = () => {
      mobileMenu.classList.add('open');
      menuBtn.classList.add('open');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('lock');
      mobileMenu.setAttribute('aria-hidden', 'false');
    };
    const closeMenu = () => {
      mobileMenu.classList.remove('open');
      menuBtn.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('lock');
      mobileMenu.setAttribute('aria-hidden', 'true');
    };
    menuBtn.addEventListener('click', () => {
      if (mobileMenu.classList.contains('open')) closeMenu(); else openMenu();
    });
    // close when clicking an item
    $$('.mobile-nav a').forEach(a => a.addEventListener('click', closeMenu));
    // ESC to close
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    // ensure show/hide main nav depending on width
    function updateNavVisibility() {
      const mainNav = document.querySelector('.main-nav');
      if (!mainNav) return;
      if (window.innerWidth <= 980) {
        mainNav.style.display = 'none';
        if (menuBtn) menuBtn.style.display = 'flex';
      } else {
        mainNav.style.display = 'flex';
        if (menuBtn) menuBtn.style.display = 'none';
        // ensure menu closed
        closeMenu();
      }
    }
    updateNavVisibility();
    window.addEventListener('resize', updateNavVisibility);
  }
})();

/* ---------------------------
   DARK MODE toggle (persist)
----------------------------*/
(function darkModeInit() {
  const DARK_KEY = 'greenwrite_dark_v1';
  const darkToggle = document.getElementById('darkToggle');
  const mobileDarkToggle = document.getElementById('mobileDarkToggle');

  function setDark(on) {
    if (on) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    try { localStorage.setItem(DARK_KEY, on ? '1' : '0'); } catch(e) {}
  }
  // init
  safe(() => {
    const stored = localStorage.getItem(DARK_KEY);
    if (stored === null) {
      // respect system preference
      const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDark(prefers);
    } else setDark(stored === '1');
  });

  // toggles
  if (darkToggle) darkToggle.addEventListener('click', () => setDark(!document.body.classList.contains('dark')));
  if (mobileDarkToggle) mobileDarkToggle.addEventListener('click', () => setDark(!document.body.classList.contains('dark')));
})();

/* ---------------------------
   TYPED SMALL (header) & HERO PARALLAX
----------------------------*/
(function typedAndParallax() {
  // typed small (header)
  const typedEl = document.getElementById('typedText') || document.getElementById('typedTextSmall');
  const words = ["Write your future.", "Grow your planet."];
  if (typedEl) {
    let wI = 0, cI = 0;
    (function loop() {
      const w = words[wI];
      typedEl.textContent = w.slice(0, cI);
      cI++;
      if (cI > w.length + 8) { cI = 0; wI = (wI + 1) % words.length; setTimeout(loop, 700); }
      else setTimeout(loop, 60);
    })();
  }

  // parallax
  const heroWrap = document.getElementById('heroWrap');
  const heroBg = document.getElementById('heroBg');
  if (heroWrap && heroBg) {
    heroWrap.addEventListener('mousemove', (e) => {
      const rect = heroWrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroBg.style.transform = `translate(${x * 18}px, ${y * 12}px) rotate(${x * 2}deg)`;
    });
  }
})();

/* ---------------------------
   REVEAL / FADE-IN & COUNTERS
----------------------------*/
(function revealAndCounters() {
  const revealElems = document.querySelectorAll('.fade-in, .reveal-list');
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) {
        ent.target.classList.add('show');
        obs.unobserve(ent.target);
      }
    });
  }, { threshold: 0.12 });
  revealElems.forEach(el => io.observe(el));

  // counters - animate once when stats visible
  const stats = document.querySelector('.stats');
  if (stats) {
    const counterIo = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          $$('.num').forEach(el => {
            const target = +el.getAttribute('data-target') || 0;
            let current = 0;
            const step = Math.max(1, Math.floor(target / 80));
            const t = setInterval(() => {
              current += step;
              if (current >= target) { el.textContent = target; clearInterval(t); }
              else el.textContent = current;
            }, 18);
          });
          obs.disconnect();
        }
      });
    }, { threshold: 0.2 });
    counterIo.observe(stats);
  }
})();

/* ---------------------------
   SLIDESHOW helper (hero & products)
   containerId should have children with class .slide
----------------------------*/
function startSlideshow(containerId, interval = 3600) {
  safe(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const slides = Array.from(container.querySelectorAll('.slide'));
    if (!slides.length) return;
    const prev = container.querySelector('.slide-prev');
    const next = container.querySelector('.slide-next');
    let idx = 0;
    function show(i) {
      slides.forEach(s => s.classList.remove('active'));
      slides[i].classList.add('active');
    }
    show(idx);
    let timer = setInterval(() => { idx = (idx + 1) % slides.length; show(idx); }, interval);
    container.addEventListener('mouseenter', () => clearInterval(timer));
    container.addEventListener('mouseleave', () => { timer = setInterval(() => { idx = (idx + 1) % slides.length; show(idx); }, interval); });
    prev && prev.addEventListener('click', () => { idx = (idx - 1 + slides.length) % slides.length; show(idx); });
    next && next.addEventListener('click', () => { idx = (idx + 1) % slides.length; show(idx); });
  });
}
document.addEventListener('DOMContentLoaded', () => {
  startSlideshow('heroSlideshow', 3500);
  startSlideshow('prodSlideshow', 3500);
});

/* ---------------------------
   LIGHTBOX (view-btn with data-img OR images with .gallery-grid)
   expects #lightbox and #lbimg present
----------------------------*/
(function lightboxInit() {
  const lb = document.getElementById('lightbox');
  const lbimg = document.getElementById('lbimg') || document.getElementById('lightbox-img');
  if (!lb || !lbimg) return;
  // open from buttons
  $$('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const src = btn.dataset.img || btn.getAttribute('data-src') || '';
      if (!src) {
        // fallback: try to find <img> sibling
        const img = btn.closest('.prod') && btn.closest('.prod').querySelector('img');
        if (img) lbimg.src = img.src;
      } else lbimg.src = src;
      lb.classList.add('show');
      lb.setAttribute('aria-hidden', 'false');
    });
  });
  // open from gallery images
  $$('.gallery-grid img').forEach(img => img.addEventListener('click', e => {
    lbimg.src = e.target.src;
    lb.classList.add('show');
    lb.setAttribute('aria-hidden', 'false');
  }));
  // close
  lb.addEventListener('click', e => { if (e.target === lb) { lb.classList.remove('show'); lb.setAttribute('aria-hidden','true'); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('show'); });
})();

/* ---------------------------
   BACK TO TOP
----------------------------*/
(function backToTop() {
  const btn = document.getElementById('topBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => { if (window.scrollY > 450) btn.classList.add('show'); else btn.classList.remove('show'); }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ---------------------------
   Floating WhatsApp insert (if missing)
----------------------------*/
(function insertWhats() {
  if (!document.querySelector('.whats-float')) {
    const anchor = document.createElement('a');
    anchor.className = 'whats-float';
    anchor.href = 'https://wa.me/584161689126';
    anchor.target = '_blank';
    anchor.setAttribute('aria-label', 'WhatsApp');
    anchor.innerHTML = '💬';
    document.body.appendChild(anchor);
  }
})();

/* ---------------------------
   ORDER FORM: totals, shipping, preview, save, submit -> WhatsApp
   Requires elements (ids): productSelect, qty, country, itemsTotal, shipCost, grandTotal,
   previewBtn, orderForm, orderModal, orderDetails, closeModal, confirmOrder, editOrder, saveLocal, successModal, closeSuccess
----------------------------*/
(function orderFormInit() {
  const productSelect = document.getElementById('productSelect');
  const qtyInput = document.getElementById('qty');
  const countrySelect = document.getElementById('country');
  const itemsTotal = document.getElementById('itemsTotal');
  const shipCostEl = document.getElementById('shipCost');
  const grandTotalEl = document.getElementById('grandTotal');
  const previewBtn = document.getElementById('previewBtn');
  const orderForm = document.getElementById('orderForm');
  const orderModal = document.getElementById('orderModal');
  const orderDetails = document.getElementById('orderDetails');
  const closeModal = document.getElementById('closeModal');
  const confirmOrder = document.getElementById('confirmOrder');
  const editOrder = document.getElementById('editOrder');
  const paymentArea = document.getElementById('paymentArea');
  const saveLocalBtn = document.getElementById('saveLocal');
  const successModal = document.getElementById('successModal');
  const closeSuccess = document.getElementById('closeSuccess');

  if (!productSelect || !qtyInput || !countrySelect || !itemsTotal || !shipCostEl || !grandTotalEl) return;

  const productWeightMap = { "Plantable Pen": 12, "Plantable Pencil": 10, "Combo Pack": 25 };
  const packagingWeightG = 30;
  const FREE_SHIPPING_MIN_ORDER = 1000;
  const BULK_FREE_QTY = 50;

  const shippingRates = {
    "IN":[ {maxKg:0.25,cost:50},{maxKg:0.5,cost:80},{maxKg:1.0,cost:120},{maxKg:2.0,cost:200},{maxKg:5.0,cost:350} ],
    "US":[ {maxKg:0.25,cost:700},{maxKg:0.5,cost:900},{maxKg:1.0,cost:1400},{maxKg:2.0,cost:2400},{maxKg:5.0,cost:3800} ],
    "UK":[ {maxKg:0.25,cost:600},{maxKg:0.5,cost:800},{maxKg:1.0,cost:1300},{maxKg:2.0,cost:2200},{maxKg:5.0,cost:3600} ],
    "AU":[ {maxKg:0.25,cost:700},{maxKg:0.5,cost:1000},{maxKg:1.0,cost:1500},{maxKg:2.0,cost:2600},{maxKg:5.0,cost:4000} ],
    "OTHER":[ {maxKg:0.25,cost:1000},{maxKg:0.5,cost:1400},{maxKg:1.0,cost:2200},{maxKg:2.0,cost:3800},{maxKg:5.0,cost:6000} ]
  };

  function calcTotals(){
    const price = +productSelect.options[productSelect.selectedIndex].dataset.price || 0;
    const productName = productSelect.value;
    const qty = Math.max(1, Math.floor(+qtyInput.value || 1));
    const itemTotal = price * qty;

    const perItemWeightG = +productSelect.options[productSelect.selectedIndex].dataset.weight || (productWeightMap[productName] || 15);
    const totalWeightG = (perItemWeightG * qty) + packagingWeightG;
    const totalWeightKg = Math.max(0.001, totalWeightG / 1000);

    const countryCode = (countrySelect.value || "IN").toUpperCase();
    const table = shippingRates[countryCode] || shippingRates["OTHER"];
    let shipCost = table[table.length-1].cost;
    for (let i=0;i<table.length;i++){
      if (totalWeightKg <= table[i].maxKg) { shipCost = table[i].cost; break; }
    }

    if (qty >= BULK_FREE_QTY) shipCost = 0;
    else if (itemTotal >= FREE_SHIPPING_MIN_ORDER && countryCode === "IN") shipCost = 0;

    itemsTotal.textContent = `₹${itemTotal}`;
    shipCostEl.textContent = `₹${shipCost}`;
    grandTotalEl.textContent = `₹${itemTotal + shipCost}`;

    return { price, qty, itemTotal, totalWeightKg, shipCost, grand: itemTotal + shipCost };
  }

  productSelect.addEventListener('change', calcTotals);
  qtyInput.addEventListener('input', calcTotals);
  countrySelect.addEventListener('change', calcTotals);
  document.addEventListener('DOMContentLoaded', calcTotals);

  // save draft
  if (saveLocalBtn) saveLocalBtn.addEventListener('click', () => {
    const draft = {
      name: (document.getElementById('name') && document.getElementById('name').value) || '',
      phone: (document.getElementById('phone') && document.getElementById('phone').value) || '',
      product: productSelect.value,
      price: productSelect.options[productSelect.selectedIndex].dataset.price,
      qty: qtyInput.value,
      country: countrySelect.value,
      email: (document.getElementById('email') && document.getElementById('email').value) || '',
      note: (document.getElementById('note') && document.getElementById('note').value) || '',
      totals: calcTotals()
    };
    try { localStorage.setItem('greenwrite_draft', JSON.stringify(draft)); alert('Draft saved locally.'); } catch(e){ alert('Could not save draft.'); }
  });

  // preview
  if (previewBtn) previewBtn.addEventListener('click', () => {
    const totals = calcTotals();
    const name = (document.getElementById('name') && document.getElementById('name').value) || '-';
    const phone = (document.getElementById('phone') && document.getElementById('phone').value) || '-';
    const note = (document.getElementById('note') && document.getElementById('note').value) || '';
    const html = `
      <div><strong>Name:</strong> ${escapeHtml(name)}</div>
      <div><strong>Phone:</strong> ${escapeHtml(phone)}</div>
      <div><strong>Product:</strong> ${escapeHtml(productSelect.value)} x ${totals.qty} @ ₹${totals.price}</div>
      <div style="display:flex;justify-content:space-between"><div>Items</div><div>₹${totals.itemTotal}</div></div>
      <div style="display:flex;justify-content:space-between"><div>Shipping</div><div>₹${totals.shipCost}</div></div>
      <hr/>
      <div style="display:flex;justify-content:space-between;font-weight:800"><div>Total</div><div>₹${totals.grand}</div></div>
      <div style="margin-top:8px;color:var(--muted)"><strong>Note:</strong> ${escapeHtml(note)}</div>
    `;
    if (orderDetails) orderDetails.innerHTML = html;
    if (orderModal) { orderModal.classList.add('show'); orderModal.setAttribute('aria-hidden','false'); }
    if (paymentArea) paymentArea.style.display = 'none';
  });

  if (editOrder) editOrder.addEventListener('click', ()=> { if (orderModal) { orderModal.classList.remove('show'); orderModal.setAttribute('aria-hidden','true'); } });
  if (confirmOrder) confirmOrder.addEventListener('click', ()=> { if (paymentArea) paymentArea.style.display = 'block'; });
  if (closeModal) closeModal.addEventListener('click', ()=> { if (orderModal) { orderModal.classList.remove('show'); orderModal.setAttribute('aria-hidden','true'); } });

  // form submit -> save & open WhatsApp
  if (orderForm) orderForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const nameVal = (document.getElementById('name') && document.getElementById('name').value.trim()) || '';
    const phoneVal = (document.getElementById('phone') && document.getElementById('phone').value.trim()) || '';
    if (!nameVal || !phoneVal) { alert('Please enter name and phone.'); return; }
    const totals = calcTotals();
    const order = {
      name: nameVal,
      phone: phoneVal,
      email: (document.getElementById('email') && document.getElementById('email').value.trim()) || '',
      product: productSelect.value,
      priceEach: totals.price,
      qty: totals.qty,
      shippingCountry: countrySelect.value,
      shippingCost: totals.shipCost,
      total: totals.grand,
      note: (document.getElementById('note') && document.getElementById('note').value.trim()) || '',
      timestamp: new Date().toISOString()
    };
    // store locally
    try {
      const all = JSON.parse(localStorage.getItem('greenwrite_orders') || '[]');
      all.unshift(order);
      localStorage.setItem('greenwrite_orders', JSON.stringify(all));
    } catch(e) { /* ignore */ }

    // open WhatsApp with message
    const waNo = '584161689126';
    const text = encodeURIComponent(
      `GreenWrite order:%0AName: ${order.name}%0APhone: ${order.phone}%0AEmail: ${order.email}%0AProduct: ${order.product} x${order.qty}%0AShipping: ${order.shippingCountry} (₹${order.shippingCost})%0ATotal: ₹${order.total}%0ANote: ${order.note}`
    );
    window.open(`https://wa.me/${waNo}?text=${text}`, '_blank');

    // show success modal if present
    if (successModal) { successModal.classList.add('show'); successModal.setAttribute('aria-hidden','false'); }
  });

  if (closeSuccess) closeSuccess.addEventListener('click', () => { if (successModal) { successModal.classList.remove('show'); successModal.setAttribute('aria-hidden','true'); } });

  // prefill from saved draft
  (function loadDraft(){
    try {
      const d = JSON.parse(localStorage.getItem('greenwrite_draft') || 'null');
      if (d && confirm('Load saved draft?')) {
        document.getElementById('name') && (document.getElementById('name').value = d.name || '');
        document.getElementById('phone') && (document.getElementById('phone').value = d.phone || '');
        document.getElementById('qty') && (document.getElementById('qty').value = d.qty || 1);
        [...productSelect.options].forEach(opt => { if (opt.value === d.product) opt.selected = true; });
        document.getElementById('note') && (document.getElementById('note').value = d.note || '');
        document.getElementById('email') && (document.getElementById('email').value = d.email || '');
        calcTotals();
      }
    } catch(e) {}
  })();

  // helper
  function escapeHtml(str) { return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s])); }
})();

/* ---------------------------
   BUY NOW buttons (pre-fill & scroll)
----------------------------*/
(function buyNowBind(){
  $$('.prod .btn').forEach(b => {
    b.addEventListener('click', () => {
      const name = b.dataset.name || '';
      const price = b.dataset.price || '';
      const prodSelect = document.getElementById('productSelect');
      const qty = document.getElementById('qty');
      if (prodSelect && name) {
        [...prodSelect.options].forEach(opt => { opt.selected = (opt.value === name); });
      }
      if (qty) qty.value = 1;
      // recalc totals if function exists
      safe(() => { const ev = new Event('input'); document.getElementById('qty').dispatchEvent(ev); });
      const orderSec = document.getElementById('order');
      if (orderSec) orderSec.scrollIntoView({ behavior: 'smooth' });
      b.animate([{ transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 240 });
    });
  });
})();

/* ---------------------------
   Keyboard: close modals with Esc
----------------------------*/
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $$('.modal.show').forEach(m => { m.classList.remove('show'); m.setAttribute('aria-hidden','true'); });
    const lb = document.getElementById('lightbox');
    if (lb) lb.classList.remove('show');
  }
});

/* ---------------------------
   Safety note / missing assets info
----------------------------*/
(function missingAssetsNotice(){
  // If logo or main images are broken the user should re-upload — we don't interrupt the script
  const imgs = $$('img');
  imgs.forEach(img => {
    img.addEventListener('error', () => {
      console.warn('Image failed to load:', img.src);
      // don't replace automatically — keep console note
    });
  });
})();
