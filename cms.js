/* 더블케어랩 (더조은 15분샵 인천 부평점) — 사장님 수정 기능 · 3차
   ------------------------------------------------------------------
   읽는 순서 (이게 핵심이다)
       고치는 중(localStorage)  >  웹에 반영된 것(content.js)  >  원래 HTML
     사장님은 고친 결과를 미리 보시고, 손님은 반영된 것만 보십니다.

   저장 위치
     · 고치는 중 : 이 브라우저의 localStorage (cms_ 로 시작하는 열쇠)
         cms_<열쇠>           글 한 칸
         cms_img_<파일이름>    바꾼 사진 (jpeg data URL)
         cms_set_tel          전화번호
         cms_set_addr         매장 주소
     · 웹에 반영된 것 : content.js 의 window.DCL_PUBLISHED
         { data: { "열쇠": "글", "@tel": "...", "@addr": "..." }, media: { "파일이름": "경로" } }

   admin.html 은 window.CMS_ADMIN = true 를 먼저 켜고 이 파일을 불러온다.
   그때는 아래 「페이지 동작」을 건너뛰고 규칙·도구만 내어준다.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var PUB_NAME = 'DCL_PUBLISHED';   // content.js 가 만드는 전역 이름
  var K = 'cms_';
  var TEL_KEY = '@tel';
  var ADDR_KEY = '@addr';

  /* ============================================================
     1. 표현 규제 규칙  ★ 여기만 고치면 홈페이지·관리자 양쪽에 적용됩니다
     근거를 한 곳에 모았다 —
       · 주의사항-요약.txt  1·2절 (질병명 / 못 쓰는 말)
       · 기획서.md 맨 아래 「표현 규제 메모」
       · 리서치 새 위험: 당근 현수막 「내장지방」, 소개글 「다이어트」
     막지는 않는다. 경고만 띄운다 — 사장님이 판단하시게 두고, 기록은 남긴다.
     ============================================================ */
  var RULES = {
    banned: [
      /* ── 질병 이름 (가장 무겁다 · 형사처벌 구간) ── */
      { w: '항암', why: '질병 표방 — 형사처벌 구간' },
      { w: '암에', why: '질병명 사용' },
      { w: '아토피', why: '질병명 사용' },
      { w: '루게릭', why: '질병명 사용' },
      { w: '파킨슨', why: '질병명 사용' },
      { w: '류마티스', why: '질병명 사용' },
      { w: '관절염', why: '질병명 사용' },
      { w: '폐렴', why: '질병명 사용' },
      { w: '위염', why: '질병명 사용' },
      { w: '대장염', why: '질병명 사용' },
      { w: '궤양', why: '질병명 사용' },
      { w: '항염', why: '질병 치료 표현' },
      { w: '혈당', why: '질병(당뇨) 표방' },
      { w: '혈압', why: '질병(고혈압) 표방' },
      { w: '당뇨', why: '질병명 사용' },
      { w: '고혈압', why: '질병명 사용' },
      { w: '변비', why: '질병 치료 표현' },
      { w: '콜레스테롤', why: '표시면 인정 문구 안에서만 쓸 수 있습니다' },

      /* ── 몸에서 무엇이 빠진다는 말 ── */
      { w: '디톡스', why: '생리작용 단정' },
      { w: '독소', why: '생리작용 단정' },
      { w: '노폐물', why: '생리작용 단정' },
      { w: '배출', why: '생리작용 단정' },
      { w: '면역력', why: '효능 단정' },
      { w: '혈액순환', why: '효능 단정' },
      { w: '혈행 개선', why: '표시면 인정 문구 안에서만 쓸 수 있습니다' },
      { w: '인체정화', why: '프로그램·강의 이름으로만 씁니다. 몸에서 무엇이 빠진다는 설명을 붙이지 않습니다' },

      /* ── 살·체형 (당근 소개글에서 실제로 쓰고 계신 말) ── */
      { w: '다이어트', why: '건강기능식품 광고에서 주의 표현' },
      { w: '체지방', why: '표시면 인정 문구 안에서만 쓸 수 있습니다' },
      { w: '내장지방', why: '매장 현수막에 있는 표현 — 표시광고법 위반' },
      { w: '살이 빠', why: '효과 보장 표현' },
      { w: '체중 감량', why: '효과 보장 표현' },
      { w: '감량', why: '효과 보장 표현' },

      /* ── 의약품처럼 읽히는 말 ── */
      { w: '치료', why: '의약품 오인' },
      { w: '완치', why: '의약품 오인' },
      { w: '예방', why: '의약품 오인' },
      { w: '효능', why: '의약품 오인' },
      { w: '효과', why: '효과 단정·암시' },
      { w: '낫습니다', why: '질병 치료 표현' },
      { w: '낫는다', why: '질병 치료 표현' },
      { w: '좋아집니다', why: '단정 — 인정 문구의 어미가 아닙니다' },
      { w: '개선됩니다', why: '단정 — 인정 문구의 어미가 아닙니다' },

      /* ── 안전·천연 단정 ── */
      { w: '부작용 없', why: '안전성 단정' },
      { w: '무해', why: '안전성 단정' },
      { w: '안전한', why: '안전성 단정' },
      { w: '몸에 좋은', why: '안전성·효능 단정' },
      { w: '천연', why: '식품 표시·광고에서 함부로 못 쓰는 말' },
      { w: '100%', why: '단정·과장' },

      /* ── 비교·최상급 ── */
      { w: '최고', why: '근거 없는 비교·최상급' },
      { w: '최저가', why: '근거 없는 비교·최상급' },
      { w: '국내 1위', why: '근거 없는 비교·최상급' },
      { w: '1위', why: '근거 없는 비교·최상급' },
      { w: '최초', why: '근거 없는 비교·최상급' },
      { w: '유일', why: '근거 없는 비교·최상급' },

      /* ── 의료인·기관을 업고 가는 말 ── */
      { w: '의사도 인정', why: '의료인 추천 표방' },
      { w: '병원에서 추천', why: '의료인 추천 표방' },
      { w: '의사가 추천', why: '의료인 추천 표방' },

      /* ── 다단계·사업자 모집 (방문판매법) ── */
      { w: '후원수당', why: '사업자 모집 표현 — 손님용 사이트에 넣지 않습니다' },
      { w: '수익', why: '사업자 모집 표현' },
      { w: '부업', why: '사업자 모집 표현' },

      /* ── 체험담 ── */
      { w: '먹고 나서', why: '체험담 효능 암시' },
      { w: '복용 후', why: '체험담 효능 암시' },
      { w: '비포', why: '전후 비교 — 게시 불가' },
      { w: '애프터', why: '전후 비교 — 게시 불가' }
    ],

    /* 법으로 넣게 되어 있거나 표시면에 인정된 문구 — 검사에서 먼저 걷어낸다.
       (이걸 안 걷어내면 법정 고지문 자체가 금지어로 걸린다) */
    allow: [
      /본 제품은 질병의 예방 및 치료를 위한 의약품이 아닙니다/g,
      /질병의 예방 및 치료/g,
      /질병의 진단[^가-힣]{0,3}치료[^가-힣]{0,3}처치를 위한 의료 행위가 아닙니다/g,
      /의료기기가 아닌 미용기기/g,
      /어떠한 의학적 효능, ?효과도 제공하지 아니합니다/g,
      /미용적인 효과 외/g,
      /15분 케어는 의료 행위가 아닙니다/g,
      /치료를 받고 계시거나 복용 중인 약이 있으시면/g,
      /담당 의료진과 먼저 상의/g,
      /[^,.\n「」]{0,40}에 도움을 줄 수 있음/g,     /* 인정 기능성 문구 */
      /효능을 말[씀슴]드릴 수 없습니다/g,

      /* 지금 사이트에 실려 있는 말 가운데, 금지어 글자가 겹치지만 광고 표현이 아닌 것.
         이걸 안 걷어내면 관리자를 여실 때마다 멀쩡한 글에 빨간 경고가 6군데 뜨고,
         사장님은 경고를 통째로 무시하게 된다 — 그러면 진짜 경고도 안 보신다. */
      /최고경영자과정/g,                    /* 학력 — 「최고」가 아니라 과정 이름 */
      /인체정화 프로그램 강의/g,            /* 강의 이름으로 쓰는 것은 허용 (아래 인체정화 항 참조) */
      /이 가게의 유일한 담보/g,             /* 제품 비교가 아니라 대표 소개의 비유 */

      /효능 설명이 거의 없던데요/g,
      /효능 부분만/g,
      /제품 표시면[^.]{0,40}/g,
      /「좋아집니다」·「개선됩니다」·「빠집니다」/g   /* 「박스 뒷면」 03번의 설명문 */
    ],

    /* 이 말이 들어 있던 칸에서 이 말이 사라지면 = 위반 */
    mustKeep: '도움을 줄 수 있음',

    /* 비우면 원문으로 되돌리는 법정 고지문 (열쇠 + 문장으로 이중 판정) */
    protectedKeys: ['common-footer-legal'],
    protectedMarks: [
      '질병의 예방 및 치료를 위한 의약품이 아닙니다',
      '의료기기가 아닌 미용기기'
    ]
  };

  function isProtected(key, origText) {
    if (RULES.protectedKeys.indexOf(key) >= 0) return true;
    for (var i = 0; i < RULES.protectedMarks.length; i++) {
      if (String(origText || '').indexOf(RULES.protectedMarks[i]) >= 0) return true;
    }
    return false;
  }

  /* 글 한 칸을 검사한다 → [{w, why}, ...] */
  function check(text) {
    var t = String(text || '').replace(/<[^>]*>/g, ' ');
    RULES.allow.forEach(function (re) { t = t.replace(re, ' '); });
    var hit = [], seen = {};
    RULES.banned.forEach(function (b) {
      if (t.indexOf(b.w) >= 0 && !seen[b.w]) { seen[b.w] = 1; hit.push(b); }
    });
    return hit;
  }

  /* ============================================================
     2. 값을 읽는 창구 — 이 함수 하나로 모은다
     ============================================================ */
  function pub() { return window[PUB_NAME] || { data: {}, media: {} }; }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  /* 글 한 칸 */
  function cmsGet(key) {
    var mine = lsGet(K + key);
    if (mine !== null) return mine;
    var p = pub().data || {};
    var v = p[key];
    return (v === undefined || v === null) ? null : v;
  }
  /* 사진 한 장 (열쇠 = 파일 이름) */
  function cmsImg(name) {
    var mine = lsGet(K + 'img_' + name);
    if (mine) return mine;
    var m = (pub().media || {})[name];
    return m || null;
  }
  /* 설정값 (전화·주소) */
  function cmsSet(name) {
    var mine = lsGet('cms_set_' + name);
    if (mine !== null && mine !== '') return mine;
    var v = (pub().data || {})[name === 'tel' ? TEL_KEY : ADDR_KEY];
    return (v === undefined || v === null || v === '') ? null : v;
  }

  /* 사진을 긴 변 1600px 으로 줄여서 저장한다 */
  function saveImage(key, file, cb) {
    var r = new FileReader();
    r.onerror = function () { cb(false, '사진 파일을 읽지 못했습니다.'); };
    r.onload = function (e) {
      var img = new Image();
      img.onerror = function () { cb(false, '사진 파일이 아니거나 열 수 없는 형식입니다.'); };
      img.onload = function () {
        var max = 1600, w = img.width, h = img.height;
        if (Math.max(w, h) > max) { var s = max / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        var data;
        try { data = c.toDataURL('image/jpeg', 0.85); }
        catch (err) { cb(false, '사진을 바꾸는 중 문제가 생겼습니다.'); return; }
        if (!lsSet(K + 'img_' + key, data)) {
          cb(false, '저장 공간이 부족합니다. 안 쓰는 사진을 되돌리거나, 사진 크기를 줄여서 다시 해 주세요.');
          return;
        }
        cb(true, null, data);
      };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  }

  /* 지금 쓰고 있는 저장 공간 (바이트) */
  function usage() {
    var n = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf('cms_') === 0) n += (k.length + (localStorage.getItem(k) || '').length) * 2;
      }
    } catch (e) {}
    return n;
  }

  window.CMS_RULES = RULES;
  window.CMS = {
    check: check, isProtected: isProtected, saveImage: saveImage, usage: usage,
    get: cmsGet, img: cmsImg, setting: cmsSet, published: pub,
    PUB_NAME: PUB_NAME, TEL_KEY: TEL_KEY, ADDR_KEY: ADDR_KEY
  };

  /* 관리자 페이지에서는 여기까지만 */
  if (window.CMS_ADMIN) return;

  /* ============================================================
     3. 페이지 동작
     ============================================================ */
  var DEF_TEL_TEXT = '010-8776-1017';

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function base(u) {
    if (!u) return '';
    u = u.split('?')[0].split('#')[0];
    return u.substring(u.lastIndexOf('/') + 1);
  }

  /* --- 글 되살리기 (편집 모드가 아니어도 항상) --- */
  each(document.querySelectorAll('[data-cms]'), function (el) {
    var v = cmsGet(el.getAttribute('data-cms'));
    if (v !== null) el.innerHTML = v;
  });

  /* --- 사진 되살리기 : 열쇠는 「파일 이름」 --- */
  each(document.querySelectorAll('img'), function (img) {
    var name = base(img.getAttribute('src') || img.getAttribute('data-src'));
    if (name && !img.getAttribute('data-cms-imgkey')) img.setAttribute('data-cms-imgkey', name);
    var v = name && cmsImg(name);
    if (!v) return;
    var pic = img.parentNode;
    /* <picture> 안의 <source>(웹피·폰용)가 <img> 보다 우선한다 → 걷어내야 화면이 바뀐다 */
    if (pic && pic.tagName === 'PICTURE') each(pic.querySelectorAll('source'), function (s) { s.parentNode.removeChild(s); });
    img.removeAttribute('data-src');
    img.removeAttribute('srcset');
    img.src = v;
  });

  /* --- 전화번호 : 링크·본문 글자를 함께 바꾼다 --- */
  var tel = cmsSet('tel');
  if (tel && tel.replace(/[^0-9]/g, '') && tel !== DEF_TEL_TEXT) {
    var digits = tel.replace(/[^0-9]/g, '');
    each(document.querySelectorAll('a[href^="tel:"]'), function (a) { a.href = 'tel:' + digits; });
    each(document.querySelectorAll('a[href^="sms:"]'), function (a) { a.href = 'sms:' + digits; });
    (function walk(node) {
      for (var n = node.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3) {
          if (n.nodeValue.indexOf(DEF_TEL_TEXT) >= 0) n.nodeValue = n.nodeValue.split(DEF_TEL_TEXT).join(tel);
        } else if (n.nodeType === 1 && n.tagName !== 'SCRIPT' && n.tagName !== 'STYLE') walk(n);
      }
    })(document.body);
  }

  /* --- 주소 : 글자 + 네이버·카카오 지도 링크를 한꺼번에 --- */
  var addr = cmsSet('addr');
  if (addr) {
    var at = document.getElementById('addrText');
    if (at) at.textContent = addr;
    var q = encodeURIComponent(addr.replace(/\s*\d+층\s*$/, '').trim());
    each(document.querySelectorAll('a[href*="map.naver.com"]'), function (a) {
      a.href = 'https://map.naver.com/p/search/' + q;
    });
    each(document.querySelectorAll('a[href*="map.kakao.com"]'), function (a) {
      a.href = 'https://map.kakao.com/?q=' + q;
    });
  }

  /* --- 여기부터는 편집 모드일 때만 --- */
  if (!/[?&]edit=1/.test(location.search)) {
    try { sessionStorage.removeItem('cms_session'); } catch (e) {}
    return;
  }
  var until = parseInt(lsGet('cms_until') || '0', 10);
  if (Date.now() > until) {
    alert('편집할 수 있는 시간이 지났습니다.\n관리자 페이지(admin.html)에서 다시 들어와 주세요.');
    return;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startEdit);
  else startEdit();
  var started = false;

  function startEdit() {
    if (started) return;
    started = true;

    var css = document.createElement('style');
    css.textContent =
      '[data-cms]{outline:1px dashed rgba(46,76,130,.35);outline-offset:2px;border-radius:3px;}' +
      '[data-cms]:hover{outline:2px dashed #2E4C82;background:rgba(46,76,130,.07);}' +
      '[data-cms]:focus{outline:3px solid #2E4C82;background:#fff;color:#111;}' +
      '[data-cms].cms-changed{outline:2px solid #C08A00;background:rgba(192,138,0,.10);}' +
      '[data-cms].cms-locked{outline:2px solid #8A1F11;}' +
      'img[data-cms-imgkey]{cursor:zoom-in;outline:2px dashed rgba(46,76,130,.6);outline-offset:3px;}' +
      '#cmsBar{position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#111;color:#fff;' +
      'display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 14px;' +
      "font:15px/1.4 'Pretendard Variable',Pretendard,system-ui,sans-serif;box-shadow:0 -2px 12px rgba(0,0,0,.3);}" +
      '#cmsBar b{font-size:16px;}' +
      "#cmsBar button,#cmsBar a{font:600 15px/1 'Pretendard Variable',Pretendard,system-ui,sans-serif;border:0;" +
      'border-radius:8px;padding:12px 14px;cursor:pointer;text-decoration:none;}' +
      '#cmsBar .go{background:#2E4C82;color:#fff;} #cmsBar .warn{background:#8A1F11;color:#fff;}' +
      '#cmsBar .plain{background:#EDEBE6;color:#111;}' +
      '#cmsBar .cnt{margin-left:auto;font-size:14px;color:#B9B7B0;}' +
      '#cmsToast{position:fixed;left:50%;transform:translateX(-50%);bottom:82px;z-index:100000;max-width:92vw;' +
      "background:#8A1F11;color:#fff;padding:14px 16px;border-radius:10px;font:15px/1.6 'Pretendard Variable',Pretendard,system-ui,sans-serif;" +
      'white-space:pre-line;box-shadow:0 6px 20px rgba(0,0,0,.3);display:none;}' +
      'body{padding-bottom:130px !important;}' +
      '.mobar,.floatcall{display:none !important;}';
    document.head.appendChild(css);

    /* 접혀 있는 것(자주 묻는 질문·이력 더보기)은 전부 펼친다 — 접힌 채로는 답을 못 고친다.
       script.js 의 FAQ 아코디언(한 번에 하나만 열림)이 도로 접어 버리므로,
       한 번 펴는 것으로는 모자란다. 편집 모드 동안에는 접히면 다시 편다. */
    each(document.querySelectorAll('details'), function (d) {
      d.open = true;
      d.addEventListener('toggle', function () { if (!d.open) d.open = true; });
    });

    var changed = {};
    each(document.querySelectorAll('[data-cms]'), function (el) {
      var key = el.getAttribute('data-cms');
      el.setAttribute('data-cms-orig', el.innerHTML);
      if (lsGet(K + key) !== null) { el.classList.add('cms-changed'); changed[key] = 1; }
      if (isProtected(key, el.textContent)) {
        el.classList.add('cms-locked');
        el.title = '법으로 넣게 되어 있는 안내문입니다. 비우면 원래대로 되돌아갑니다.';
      }
      el.contentEditable = 'true';
      el.spellcheck = false;
      var t = null;
      el.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { save(el); }, 700); });
      el.addEventListener('blur', function () { clearTimeout(t); save(el); });
      /* 편집 중에는 링크를 따라가지 않는다 */
      el.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) e.preventDefault(); });
    });

    function save(el) {
      var key = el.getAttribute('data-cms');
      var html = el.innerHTML;
      var text = el.textContent.replace(/\s+/g, ' ').trim();
      var orig = el.getAttribute('data-cms-orig') || '';
      var origText = orig.replace(/<[^>]*>/g, ' ');

      /* ① 법정 고지문 자동 복구 — 비우면 원문으로 되돌린다 */
      if (!text && isProtected(key, origText)) {
        toast('이 안내문은 법으로 넣게 되어 있어 비울 수 없습니다.\n원래 내용으로 되돌렸습니다.');
        el.innerHTML = orig;
        try { localStorage.removeItem(K + key); } catch (e) {}
        el.classList.remove('cms-changed');
        delete changed[key];
        count();
        return;
      }

      /* ② 인정 기능성 문구의 어미를 지우면 경고 */
      if (orig.indexOf(RULES.mustKeep) >= 0 && html.indexOf(RULES.mustKeep) < 0) {
        toast('⚠ 「도움을 줄 수 있음」을 지우시면 법 위반입니다.\n' +
              '이 문장은 제품 상자 뒷면에 적힌 그대로 두셔야 합니다.\n' +
              '(요약하거나 쉬운 말로 풀어 쓰는 것도 안 됩니다)');
      }

      /* ③ 금지어 — 막지 않고 경고만 */
      var hit = check(text);
      if (hit.length) {
        toast('⚠ 쓰면 안 되는 말이 들어 있습니다\n' +
          hit.map(function (h) { return '· 「' + h.w + '」 — ' + h.why; }).join('\n') +
          '\n저장은 되었지만 그대로 두시면 안 됩니다.');
      }

      if (!lsSet(K + key, html)) { toast('저장 공간이 부족해 저장하지 못했습니다.'); return; }
      el.classList.add('cms-changed');
      changed[key] = 1;
      count();
    }

    /* 사진: 누르면 바로 바꾼다 */
    each(document.querySelectorAll('img[data-cms-imgkey]'), function (img) {
      img.title = '누르면 이 사진을 바꿉니다';
      img.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var key = img.getAttribute('data-cms-imgkey');
        var f = document.createElement('input');
        f.type = 'file'; f.accept = 'image/*';
        f.onchange = function () {
          if (!f.files || !f.files[0]) return;
          saveImage(key, f.files[0], function (ok, msg, data) {
            if (!ok) { toast(msg); return; }
            var pic = img.parentNode;
            if (pic && pic.tagName === 'PICTURE') each(pic.querySelectorAll('source'), function (s) { s.parentNode.removeChild(s); });
            img.removeAttribute('srcset');
            img.src = data;
            toast('사진을 바꿨습니다.');
            count();
          });
        };
        f.click();
      });
    });

    /* 아래 고정 띠 */
    var bar = document.createElement('div');
    bar.id = 'cmsBar';
    bar.innerHTML =
      '<b>수정 중</b>' +
      '<button type="button" class="plain" id="cmsHelp">쓰는 법</button>' +
      '<button type="button" class="warn" id="cmsUndo">이 페이지 되돌리기</button>' +
      '<a class="go" href="admin.html">관리자 페이지로 (웹에 반영하기)</a>' +
      '<a class="plain" href="index.html">수정 끝내기</a>' +
      '<span class="cnt" id="cmsCnt"></span>';
    document.body.appendChild(bar);

    document.getElementById('cmsHelp').onclick = function () {
      alert('◆ 글 고치기\n  · 고치고 싶은 글을 마우스로 누르고 그냥 고쳐 쓰시면 됩니다.\n' +
        '  · 저장 단추는 없습니다. 손을 떼면 저절로 저장됩니다.\n\n' +
        '◆ 사진 바꾸기\n  · 바꾸고 싶은 사진을 한 번 누르면 파일 고르는 창이 열립니다.\n\n' +
        '◆ 손님 화면에 보이게 하려면\n' +
        '  · 다 고치신 뒤 아래 「관리자 페이지로」를 누르고,\n' +
        '    거기서 「웹에 반영하기」를 한 번 눌러 주십시오.\n' +
        '  · 이걸 안 누르시면 이 컴퓨터에서만 바뀐 채로 남습니다.\n\n' +
        '◆ 되돌리기\n  · 아래 「이 페이지 되돌리기」를 누르면 처음 모습으로 돌아갑니다.\n\n' +
        '◆ 화면이 안 바뀌면\n  · 키보드에서 Ctrl 과 Shift 를 누른 채 R 을 누르세요.');
    };
    document.getElementById('cmsUndo').onclick = function () {
      if (!confirm('이 화면에서 고친 글과 사진을 전부 처음 상태로 되돌립니다.\n정말 되돌릴까요?')) return;
      var kill = [];
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k.indexOf('cms_') === 0 && k.indexOf('cms_set_') !== 0 &&
              k !== 'cms_until' && k !== 'cms_pin') kill.push(k);
        }
        kill.forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
      location.reload();
    };

    function count() {
      var n = Object.keys(changed).length, m = 0;
      try {
        for (var i = 0; i < localStorage.length; i++) if (localStorage.key(i).indexOf('cms_img_') === 0) m++;
      } catch (e) {}
      document.getElementById('cmsCnt').textContent = '글 ' + n + '곳 · 사진 ' + m + '장 고침 (아직 웹에는 안 나갔습니다)';
    }
    count();

    var toastEl = document.createElement('div');
    toastEl.id = 'cmsToast';
    document.body.appendChild(toastEl);
    var tt = null;
    function toast(msg) {
      toastEl.textContent = msg;
      toastEl.style.display = 'block';
      clearTimeout(tt);
      tt = setTimeout(function () { toastEl.style.display = 'none'; }, 8000);
    }
  }
})();
