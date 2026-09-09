/* 더블케어랩 — 4차 럭셔리판
   ① 머리: 히어로를 지나면 밝은 바탕으로
   ② 스크롤 등장(reveal)
   ③ 히어로 사진 3장 넘김 — 2초 보여주고 덮기 방식으로 전환(앞 장 위에 다음 장을 올려 어두워지지 않게)
   ④ FAQ는 한 번에 하나만
   ⑤ 주소 복사 · 플로팅 단추 */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ① 머리 */
  var hd = document.getElementById('hd');
  var hero = document.querySelector('.hero');
  if (hd && hero) {
    var onScroll = function () { hd.classList.toggle('solid', window.scrollY > hero.offsetHeight - 80); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ② 등장 */
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  /* ③ 히어로 슬라이드 — 덮기 방식 */
  var slides = document.querySelectorAll('.hero-bg > img, .hero-bg picture > img');
  var tag = document.getElementById('heroTag');
  if (slides.length > 1 && !reduce) {
    var i = 0, z = 1, HOLD = 2000, FADE = 800;
    slides[0].classList.add('is-on'); slides[0].style.zIndex = z;
    setInterval(function () {
      var prev = slides[i]; i = (i + 1) % slides.length; var next = slides[i];
      next.style.zIndex = ++z; next.classList.add('is-on');          // 다음 장을 위에 올린다
      if (tag && next.dataset.tag) tag.textContent = next.dataset.tag;
      setTimeout(function () { prev.classList.remove('is-on'); }, FADE + 50); // 다 덮인 뒤에 앞 장을 치운다
    }, HOLD + FADE);
  } else if (slides.length) { slides[0].classList.add('is-on'); }

  /* ④ FAQ 하나만 */
  document.querySelectorAll('.faq').forEach(function (g) {
    var items = g.querySelectorAll('details.fold');
    items.forEach(function (d) { d.addEventListener('toggle', function () {
      if (!d.open) return; items.forEach(function (o) { if (o !== d) o.open = false; }); }); });
  });

  /* ⑤ 주소 복사 */
  var copyBtn = document.getElementById('copyAddr'), addrEl = document.getElementById('addrText');
  if (copyBtn && addrEl) {
    copyBtn.addEventListener('click', function () {
      var text = addrEl.textContent.trim();
      var done = function () { var o = copyBtn.textContent; copyBtn.textContent = '복사했습니다'; setTimeout(function () { copyBtn.textContent = o; }, 1600); };
      var fb = function () { var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:absolute;left:-9999px';
        document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(ta); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fb); else fb();
    });
  }

  /* 플로팅 단추는 히어로를 지나야 */
  var fb2 = document.querySelector('.floatcall');
  if (fb2 && hero && 'IntersectionObserver' in window) {
    fb2.style.opacity = '0'; fb2.style.pointerEvents = 'none';
    new IntersectionObserver(function (es) { var out = !es[0].isIntersecting;
      fb2.style.opacity = out ? '1' : '0'; fb2.style.pointerEvents = out ? 'auto' : 'none'; }, { threshold: 0.15 }).observe(hero);
  }
})();
