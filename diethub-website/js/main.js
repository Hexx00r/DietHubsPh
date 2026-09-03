(function () {
  'use strict';

  // Navbar
  var navbar = document.getElementById('navbar');
  var navToggle = document.getElementById('navToggle');
  var navMenu = document.getElementById('navMenu');
  var navLinks = document.querySelectorAll('.nav-link');

  // Menu tabs
  var tabBtns = document.querySelectorAll('.tab-btn');
  var tabContents = document.querySelectorAll('.tab-content');

  // Order modal
  var orderModal = document.getElementById('orderModal');
  var modalOverlay = document.getElementById('modalOverlay');
  var modalClose = document.getElementById('modalClose');
  var orderForm = document.getElementById('orderForm');
  var modalSuccess = document.getElementById('modalSuccess');
  var successClose = document.getElementById('successClose');
  var orderTrigger = document.getElementById('orderTrigger');

  // Form fields
  var planSelect = document.getElementById('planSelect');
  var deliverySelect = document.getElementById('deliverySelect');
  var areaSelect = document.getElementById('areaSelect');
  var addressInput = document.getElementById('addressInput');
  var deliveryFields = document.getElementById('deliveryFields');
  var totalAmount = document.getElementById('totalAmount');
  var totalInput = document.getElementById('totalInput');
  var timestampInput = document.getElementById('timestampInput');

  // Pricing data
  var PLAN_PRICES = { '1day': 150, '3day': 420, '6day': 780, bread: 0, custom: 0 };
  var AREA_FEES = { poblacion: 0, ichon: 30, ibarra: 20, libog: 20, other: 15 };

  // Make.com webhook (GHL automation)
  var WEBHOOK_URL = 'https://hook.eu1.make.com/cibub2nibjh4vir5g4x8lcfcr9lramad';

  // Normalize PH phone numbers to +63 format for GHL
  function formatPhone(phone) {
    phone = phone.replace(/\D/g, '');
    if (phone.startsWith('63')) {
      phone = phone.slice(2);
    }
    if (phone.startsWith('0')) {
      phone = phone.slice(1);
    }
    return '+63' + phone;
  }

  window.addEventListener('scroll', function () {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  navToggle.addEventListener('click', function () {
    navMenu.classList.toggle('active');
    var spans = navToggle.querySelectorAll('span');
    if (navMenu.classList.contains('active')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px,5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '1';
      spans[2].style.transform = '';
    }
  });

  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      navMenu.classList.remove('active');
      var spans = navToggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '1';
      spans[2].style.transform = '';
    });
  });

  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tab = btn.dataset.tab;
      tabBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      tabContents.forEach(function (c) { c.classList.remove('active'); });
      document.getElementById(tab).classList.add('active');
    });
  });

  // Order modal open/close
  function openModal() {
    orderModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    orderModal.classList.remove('active');
    document.body.style.overflow = '';
    modalSuccess.classList.remove('active');
    orderForm.style.display = 'block';
  }

  if (orderTrigger) {
    orderTrigger.addEventListener('click', function (e) {
      e.preventDefault();
      openModal();
    });
  }

  // All other #order links open the modal too
  document.querySelectorAll('a[href="#order"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      openModal();
    });
  });

  modalOverlay.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  successClose.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && orderModal.classList.contains('active')) {
      closeModal();
    }
  });

  // Delivery fields show/hide
  function toggleDeliveryFields() {
    var isDelivery = deliverySelect.value === 'delivery';
    deliveryFields.classList.toggle('visible', isDelivery);
    areaSelect.required = isDelivery;
    addressInput.required = isDelivery;
    if (!isDelivery) {
      areaSelect.value = '';
    }
    updateTotal();
  }

  deliverySelect.addEventListener('change', toggleDeliveryFields);

  // Dynamic total
  function computeTotal() {
    var plan = planSelect.value;
    var area = areaSelect.value;
    var total = PLAN_PRICES[plan] || 0;
    if (deliverySelect.value === 'delivery') {
      total += AREA_FEES[area] || 0;
    }
    return total;
  }

  function formatTotal(total) {
    if (!planSelect.value) return '₱0';
    var plan = planSelect.value;
    if (plan === 'bread' || plan === 'custom') {
      return 'Custom quote';
    }
    if (deliverySelect.value === 'delivery' && !areaSelect.value) {
      return '₱' + total + ' + delivery';
    }
    return '₱' + total;
  }

  function updateTotal() {
    var total = computeTotal();
    var display = formatTotal(total);
    totalAmount.textContent = display;
    totalInput.value = display;
  }

  planSelect.addEventListener('change', updateTotal);
  areaSelect.addEventListener('change', updateTotal);

  // Form submission: Make.com webhook → GHL automation
  orderForm.addEventListener('submit', function (e) {
    e.preventDefault();

    timestampInput.value = new Date().toISOString();
    updateTotal();

    var submitBtn = orderForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    // Send to Make.com → GHL automation
    var orderData = {
      name: orderForm.querySelector('[name="name"]').value,
      phone: formatPhone(orderForm.querySelector('[name="phone"]').value),
      plan: planSelect.value,
      days: orderForm.querySelector('[name="days"]').value,
      option: orderForm.querySelector('[name="option"]').value,
      delivery: deliverySelect.value,
      area: areaSelect.value,
      address: addressInput.value,
      notes: orderForm.querySelector('[name="notes"]').value,
      total: totalAmount.textContent,
      timestamp: timestampInput.value,
      source: 'Website Order Form'
    };

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    }).then(function (response) {
      if (response.ok) {
        orderForm.style.display = 'none';
        modalSuccess.classList.add('active');
      } else {
        alert('Something went wrong. Please try again or message us on Facebook.');
      }
    }).catch(function () {
      alert('Something went wrong. Please try again or message us on Facebook.');
    }).finally(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Order';
    });
  });

  // Scroll reveal animation
  var observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.menu-card,.step,.pricing-card,.review-card,.about-card,.special-card,.bread-card').forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Smooth scroll for in-page anchors.
  // Links that open the modal (href="#order") already called preventDefault,
  // so skip them here to avoid scrolling the page behind the modal.
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      var href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      var target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
