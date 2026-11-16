/* whymm theme — main.js */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  /* ---------- theme toggle ---------- */
  var themeBtn = $('#themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      var meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'light' ? '#f6f8fb' : '#080b10');
      try { localStorage.setItem('whymm-theme', next); } catch (e) {}
    });
  }

  /* ---------- mobile nav ---------- */
  var navBtn = $('#navBtn');
  var nav = $('#siteNav');
  if (navBtn && nav) {
    navBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('.nav-link')) {
        nav.classList.remove('is-open');
        navBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- progress + back to top ---------- */
  var bar = $('#progressBar');
  var toTop = $('#toTop');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || root.scrollTop;
    if (bar) {
      var max = root.scrollHeight - root.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    }
    if (toTop) toTop.classList.toggle('is-show', y > 620);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- code blocks: language label + copy ---------- */
  $$('figure.highlight').forEach(function (fig) {
    var lang = 'code';
    Array.prototype.forEach.call(fig.classList, function (c) {
      if (c !== 'highlight') lang = c;
    });

    var barEl = doc.createElement('div');
    barEl.className = 'code-bar';
    barEl.innerHTML = '<span class="code-lang">' + lang + '</span>' +
      '<button class="code-copy" type="button" aria-label="复制代码">复制</button>';
    fig.insertBefore(barEl, fig.firstChild);

    var btn = barEl.querySelector('.code-copy');
    btn.addEventListener('click', function () {
      var pre = fig.querySelector('td.code pre') || fig.querySelector('pre');
      var text = pre ? pre.textContent.replace(/\n+$/, '') : '';
      var done = function () {
        btn.textContent = '已复制';
        btn.classList.add('is-done');
        setTimeout(function () {
          btn.textContent = '复制';
          btn.classList.remove('is-done');
        }, 1600);
      };
      var fallback = function () {
        var ta = doc.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        doc.body.appendChild(ta);
        ta.select();
        try { doc.execCommand('copy'); done(); } catch (e) {}
        doc.body.removeChild(ta);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
    });
  });

  /* ---------- article enhancements ---------- */
  var content = $('#postContent') || $('.post-content');
  if (content) {
    // wrap tables for horizontal scroll
    $$('table', content).forEach(function (table) {
      var parent = table.parentNode;
      if (parent && parent.classList && parent.classList.contains('table-wrap')) return;
      var wrap = doc.createElement('div');
      wrap.className = 'table-wrap';
      parent.insertBefore(wrap, table);
      wrap.appendChild(table);
    });

    // image zoom
    var viewer = $('#imgViewer');
    if (viewer) {
      var vImg = viewer.querySelector('img');
      var closeViewer = function () {
        viewer.classList.remove('is-open');
        viewer.setAttribute('aria-hidden', 'true');
      };
      $$('img', content).forEach(function (img) {
        if (img.closest('a')) return;
        if (img.classList.contains('emoji')) return;
        img.classList.add('is-zoomable');
        img.addEventListener('click', function () {
          vImg.src = img.currentSrc || img.src;
          viewer.classList.add('is-open');
          viewer.setAttribute('aria-hidden', 'false');
        });
      });
      viewer.addEventListener('click', closeViewer);
      doc.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeViewer();
      });
    }
  }

  /* ---------- TOC scroll spy ---------- */
  var tocLinks = $$('.toc a[href^="#"]');
  if (tocLinks.length && content) {
    var linkMap = {};
    tocLinks.forEach(function (a) {
      var raw = a.getAttribute('href').slice(1);
      var id = raw;
      try { id = decodeURIComponent(raw); } catch (e) {}
      linkMap[id] = a;
    });

    var headings = $$('h2, h3', content).filter(function (h) { return h.id; });
    var activeId = null;

    var spy = function () {
      var offset = 140;
      var current = headings.length ? headings[0].id : null;
      for (var i = 0; i < headings.length; i++) {
        var top = headings[i].getBoundingClientRect().top;
        if (top - offset <= 0) current = headings[i].id;
        else break;
      }
      if (current === activeId) return;
      activeId = current;
      tocLinks.forEach(function (a) { a.classList.remove('is-active'); });
      tocLinks.forEach(function (a) {
        var raw = a.getAttribute('href').slice(1);
        var id = raw;
        try { id = decodeURIComponent(raw); } catch (e) {}
        if (id === activeId) a.classList.add('is-active');
      });
    };

    window.addEventListener('scroll', spy, { passive: true });
    spy();
  }

  /* ---------- external links ---------- */
  $$('.post-content a[href^="http"]').forEach(function (a) {
    if (a.hostname && a.hostname !== window.location.hostname) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });
})();
