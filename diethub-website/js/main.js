/* Diet Hub — shared site behaviour: navbar, reveal animations, cart, order submission */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  Configuration
   * ------------------------------------------------------------------ */
  // Inbound webhook feeding the GoHighLevel automation (verified 200 OK on 2026-09-07).
  // If this endpoint is unavailable at order time, orders are saved locally as a mock.
  var WEBHOOK_URL = 'https://hook.eu1.make.com/cibub2nibjh4vir5g4x8lcfcr9lramad';
  var WEBHOOK_TIMEOUT_MS = 12000;
  var CART_KEY = 'diethub_cart';
  var MOCK_KEY = 'diethub_mock_orders';
  var AREA_FEES = { poblacion: 0, ichon: 30, ibarra: 20, libog: 20, other: 15 };

  /* ------------------------------------------------------------------ *
   *  Helpers
   * ------------------------------------------------------------------ */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function pesos(n) {
    return '₱' + Number(n || 0).toLocaleString('en-PH');
  }

  // Normalize PH phone numbers to +63 format for GHL
  function formatPhone(phone) {
    phone = String(phone || '').replace(/\D/g, '');
    if (phone.indexOf('63') === 0) { phone = phone.slice(2); }
    if (phone.indexOf('0') === 0) { phone = phone.slice(1); }
    return '+63' + phone;
  }

  var toastEl = null;
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  /* ------------------------------------------------------------------ *
   *  Navbar: scroll state, mobile toggle, active link
   * ------------------------------------------------------------------ */
  var navbar = $('#navbar');
  var navToggle = $('#navToggle');
  var navMenu = $('#navMenu');

  function closeMobileNav() {
    if (!navMenu) { return; }
    navMenu.classList.remove('active');
    if (navToggle) {
      $$('span', navToggle).forEach(function (s) { s.style.transform = ''; s.style.opacity = '1'; });
    }
  }

  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      var open = navMenu.classList.toggle('active');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      var spans = $$('span', navToggle);
      if (spans.length >= 3) {
        spans[0].style.transform = open ? 'rotate(45deg) translate(5px,5px)' : '';
        spans[1].style.opacity = open ? '0' : '1';
        spans[2].style.transform = open ? 'rotate(-45deg) translate(5px,-5px)' : '';
      }
    });
    $$('.nav-link', navMenu).forEach(function (link) {
      link.addEventListener('click', closeMobileNav);
    });
  }

  // Highlight the current page in the navbar
  (function setActiveNav() {
    var page = location.pathname.split('/').pop() || 'index.html';
    $$('.nav-link').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === page || (page === '' && href === 'index.html')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  })();

  /* ------------------------------------------------------------------ *
   *  Reveal-on-scroll animations
   * ------------------------------------------------------------------ */
  (function initReveal() {
    var targets = $$('.reveal');
    if (!targets.length) { return; }
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { io.observe(el); });
  })();

  /* ------------------------------------------------------------------ *
   *  Menu category tabs
   * ------------------------------------------------------------------ */
  (function initTabs() {
    var tabBtns = $$('.tab-btn');
    if (!tabBtns.length) { return; }
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        $$('.tab-content').forEach(function (c) { c.classList.remove('active'); });
        var panel = document.getElementById(btn.getAttribute('data-tab'));
        if (panel) { panel.classList.add('active'); }
      });
    });
  })();

  /* ------------------------------------------------------------------ *
   *  Cart (localStorage)
   * ------------------------------------------------------------------ */
  function getCart() {
    try {
      var cart = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(cart) ? cart : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadges();
    if ($('#cartItems')) { renderCart(); }
  }

  function cartCount() {
    return getCart().reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function updateCartBadges() {
    var n = cartCount();
    $$('.js-cart-count').forEach(function (badge) {
      badge.textContent = n;
      badge.style.display = n > 0 ? 'inline-flex' : 'none';
    });
  }

  function addToCart(item) {
    var cart = getCart();
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === item.id) { existing = cart[i]; break; }
    }
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
    }
    saveCart(cart);
    toast(item.name + ' added to your order');
  }

  // Wire every "Add to Order" button on the page
  $$('.js-add').forEach(function (btn) {
    btn.addEventListener('click', function () {
      addToCart({
        id: btn.getAttribute('data-id'),
        name: btn.getAttribute('data-name'),
        price: parseInt(btn.getAttribute('data-price'), 10) || 0
      });
      btn.classList.add('added');
      var original = btn.textContent;
      btn.textContent = 'Added ✓';
      setTimeout(function () {
        btn.classList.remove('added');
        btn.textContent = original;
      }, 1400);
    });
  });

  /* ------------------------------------------------------------------ *
   *  Order page: cart summary + checkout form
   * ------------------------------------------------------------------ */
  var cartList = $('#cartItems');
  var orderForm = $('#orderForm');

  function currentFee() {
    var method = orderForm ? orderForm.querySelector('[name="method"]') : null;
    var area = orderForm ? orderForm.querySelector('[name="area"]') : null;
    if (!orderForm || !method || method.value !== 'delivery' || !area) { return 0; }
    return AREA_FEES[area.value] != null ? AREA_FEES[area.value] : 0;
  }

  function renderCart() {
    if (!cartList) { return; }
    var cart = getCart();

    if (!cart.length) {
      cartList.innerHTML =
        '<div class="cart-empty"><div class="big">🍽️</div>' +
        '<p>Your cart is empty.</p>' +
        '<p style="margin-top:14px"><a class="btn btn-primary" href="menu.html">Browse the Menu</a></p></div>';
    } else {
      var html = '<ul class="cart-list">';
      cart.forEach(function (item) {
        html +=
          '<li class="cart-item" data-id="' + item.id + '">' +
            '<img class="cart-item-img" src="images/food/' + item.id + '.webp" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' +
            '<div class="cart-item-info">' +
              '<h4>' + item.name + '</h4>' +
              '<div class="cart-item-unit">' + pesos(item.price) + ' each</div>' +
              '<div class="cart-item-sub">' + pesos(item.price * item.qty) + '</div>' +
            '</div>' +
            '<div class="qty-controls">' +
              '<button type="button" class="qty-btn js-dec" aria-label="Decrease quantity">−</button>' +
              '<span class="qty-val">' + item.qty + '</span>' +
              '<button type="button" class="qty-btn js-inc" aria-label="Increase quantity">+</button>' +
            '</div>' +
            '<button type="button" class="cart-remove js-remove" aria-label="Remove item">×</button>' +
          '</li>';
      });
      html += '</ul>';
      cartList.innerHTML = html;
    }

    updateTotals();
  }

  function updateTotals() {
    var cart = getCart();
    var subtotal = cart.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
    var fee = currentFee();
    var els = {
      subtotal: $('#cartSubtotal'),
      fee: $('#cartFee'),
      feeRow: $('#cartFeeRow'),
      grand: $('#cartGrand')
    };
    if (els.subtotal) { els.subtotal.textContent = pesos(subtotal); }
    if (els.fee) { els.fee.textContent = fee === 0 ? 'FREE' : pesos(fee); }
    if (els.feeRow) { els.feeRow.style.display = (orderForm && orderForm.querySelector('[name="method"]').value === 'delivery') ? 'flex' : 'none'; }
    if (els.grand) { els.grand.textContent = pesos(subtotal + fee); }
    var submitBtn = orderForm ? orderForm.querySelector('button[type="submit"]') : null;
    if (submitBtn) { submitBtn.disabled = cart.length === 0; }
  }

  if (cartList) {
    cartList.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) { return; }
      var row = e.target.closest('.cart-item');
      if (!row) { return; }
      var id = row.getAttribute('data-id');
      var cart = getCart();
      var item = null;
      for (var i = 0; i < cart.length; i++) { if (cart[i].id === id) { item = cart[i]; break; } }
      if (!item) { return; }
      if (btn.classList.contains('js-inc')) { item.qty += 1; }
      if (btn.classList.contains('js-dec')) { item.qty -= 1; }
      if (btn.classList.contains('js-remove') || item.qty <= 0) {
        cart = cart.filter(function (c) { return c.id !== id; });
      }
      saveCart(cart);
    });
    renderCart();
  }

  // Delivery / pickup toggle
  if (orderForm) {
    var methodSelect = orderForm.querySelector('[name="method"]');
    var areaSelect = orderForm.querySelector('[name="area"]');
    var addressInput = orderForm.querySelector('[name="address"]');
    var deliveryFields = $('#deliveryFields');

    function toggleDeliveryFields() {
      var isDelivery = methodSelect.value === 'delivery';
      if (deliveryFields) { deliveryFields.classList.toggle('visible', isDelivery); }
      if (areaSelect) { areaSelect.required = isDelivery; }
      if (addressInput) { addressInput.required = isDelivery; }
      if (!isDelivery && areaSelect) { areaSelect.value = ''; }
      updateTotals();
    }
    if (methodSelect) { methodSelect.addEventListener('change', toggleDeliveryFields); }
    if (areaSelect) { areaSelect.addEventListener('change', updateTotals); }
  }

  /* ------------------------------------------------------------------ *
   *  Checkout: build structured JSON and POST to the GHL webhook
   * ------------------------------------------------------------------ */
  function buildOrderPayload() {
    var cart = getCart();
    var subtotal = cart.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
    var fee = currentFee();
    var get = function (name) {
      var el = orderForm.querySelector('[name="' + name + '"]');
      return el ? el.value.trim() : '';
    };
    var items = cart.map(function (item) {
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        subtotal: item.price * item.qty
      };
    });
    var customer = {
      name: get('name'),
      phone: formatPhone(get('phone')),
      method: get('method'),
      area: get('area'),
      address: get('address'),
      notes: get('notes')
    };
    return {
      orderId: 'DH-' + Date.now().toString(36).toUpperCase(),
      timestamp: new Date().toISOString(),
      source: 'Diet Hub Website',
      currency: 'PHP',
      customer: customer,
      items: items,
      itemCount: cart.reduce(function (sum, item) { return sum + item.qty; }, 0),
      itemsSummary: items.map(function (i) { return i.qty + '× ' + i.name; }).join(', '),
      subtotal: subtotal,
      deliveryFee: fee,
      total: subtotal + fee,
      // Flat fields kept for the existing Make → GHL field mapping
      name: customer.name,
      phone: customer.phone,
      delivery: customer.method,
      area: customer.area,
      address: customer.address,
      notes: customer.notes,
      totalDisplay: pesos(subtotal + fee)
    };
  }

  function showResult(kind, html) {
    var box = $('#orderResult');
    if (!box) { return; }
    box.className = 'order-result show ' + kind;
    box.innerHTML = html;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Fallback when the webhook cannot be reached: keep the order locally as JSON
  // (downloadable file + localStorage queue) and flag GHL for later configuration.
  function mockSubmit(payload) {
    var queue = [];
    try { queue = JSON.parse(localStorage.getItem(MOCK_KEY)) || []; } catch (e) { queue = []; }
    queue.push(payload);
    try { localStorage.setItem(MOCK_KEY, JSON.stringify(queue)); } catch (e) { /* storage full */ }

    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = payload.orderId.toLowerCase() + '-order.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showResult('mock',
      '<b>Order saved locally (GHL offline).</b><br>' +
      'We could not reach the ordering service right now, so your order <b>' + payload.orderId + '</b> ' +
      'was saved as a JSON file and queued on this device. Please send it to us on ' +
      '<a href="https://m.me/diethub.ph" target="_blank" rel="noopener" style="text-decoration:underline">Messenger</a> so we can confirm. ' +
      '<i>(Webhook flagged for later configuration.)</i>');
  }

  if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var cart = getCart();
      if (!cart.length) {
        showResult('error', 'Your cart is empty. Please add items from the <a href="menu.html" style="text-decoration:underline">menu</a> first.');
        return;
      }

      var payload = buildOrderPayload();
      var submitBtn = orderForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      var timedOut = false;
      var timer = setTimeout(function () { timedOut = true; }, WEBHOOK_TIMEOUT_MS);

      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (response) {
        clearTimeout(timer);
        if (timedOut) { throw new Error('timeout'); }
        if (response.ok) {
          showResult('success',
            '<b>Order received — thank you, ' + payload.customer.name.split(' ')[0] + '!</b><br>' +
            'Order <b>' + payload.orderId + '</b> (' + payload.totalDisplay + ') was sent successfully. ' +
            'We\'ll confirm your slot shortly — keep an eye on your phone or Messenger.');
          localStorage.removeItem(CART_KEY);
          updateCartBadges();
          renderCart();
          orderForm.reset();
          if ($('#deliveryFields')) { $('#deliveryFields').classList.remove('visible'); }
        } else {
          showResult('error',
            '<b>Order could not be sent (' + response.status + ').</b><br>' +
            'Please try again in a moment, or message us directly on ' +
            '<a href="https://m.me/diethub.ph" target="_blank" rel="noopener" style="text-decoration:underline">Messenger</a>.');
        }
      }).catch(function () {
        clearTimeout(timer);
        mockSubmit(payload);
        localStorage.removeItem(CART_KEY);
        updateCartBadges();
        renderCart();
        orderForm.reset();
        if ($('#deliveryFields')) { $('#deliveryFields').classList.remove('visible'); }
      }).then(function () {
        submitBtn.disabled = getCart().length === 0;
        submitBtn.textContent = 'Place Order';
      });
    });
  }

  // Initial paint
  updateCartBadges();
})();
