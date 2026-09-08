/* Diet Hub — reviews carousel: scroll-snap track + prev/next buttons + dots.
   The track swipes natively on touch; this file only adds buttons, dots and
   keyboard support. Without it the carousel still works as a plain scroller. */
(function () {
  'use strict';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  var root = $('.js-reviews-carousel');
  if (!root) { return; }
  var track = $('.js-reviews-track', root);
  var slides = $$('.review-slide', track);
  if (!track || slides.length === 0) { return; }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function slideStep() {
    var gap = parseFloat(getComputedStyle(track).gap) || 0;
    return slides[0].getBoundingClientRect().width + gap;
  }

  function scrollToIndex(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({
      left: i * slideStep(),
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  }

  /* Dots */
  var dotsBox = $('.js-reviews-dots', root);
  var dots = [];
  if (dotsBox) {
    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'reviews-dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Go to review ' + (i + 1));
      b.addEventListener('click', function () { scrollToIndex(i); });
      dotsBox.appendChild(b);
      dots.push(b);
    });
  }

  function currentIndex() {
    return Math.round(track.scrollLeft / slideStep());
  }

  function syncDots() {
    var idx = currentIndex();
    dots.forEach(function (d, i) {
      d.classList.toggle('active', i === idx);
      d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
    });
  }

  var rafPending = false;
  track.addEventListener('scroll', function () {
    if (rafPending) { return; }
    rafPending = true;
    requestAnimationFrame(function () { rafPending = false; syncDots(); });
  }, { passive: true });
  syncDots();

  /* Buttons */
  var prev = $('.js-reviews-prev', root);
  var next = $('.js-reviews-next', root);
  if (prev) {
    prev.addEventListener('click', function () { scrollToIndex(currentIndex() - 1); });
  }
  if (next) {
    next.addEventListener('click', function () { scrollToIndex(currentIndex() + 1); });
  }

  /* Keyboard support on the carousel region */
  root.setAttribute('tabindex', '0');
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollToIndex(currentIndex() - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollToIndex(currentIndex() + 1); }
  });
})();
