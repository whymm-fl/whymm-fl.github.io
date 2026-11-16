/* whymm theme — search.js（客户端站内搜索） */
(function () {
  'use strict';

  var doc = document;
  var layer = doc.getElementById('searchLayer');
  var input = doc.getElementById('searchInput');
  var box = doc.getElementById('searchResults');
  if (!layer || !input || !box) return;

  var dataUrl = input.getAttribute('data-search-url') || '/search.json';
  var posts = null;
  var request = null;
  var activeIndex = -1;

  var DEFAULT_HTML = box.innerHTML;

  function load() {
    if (posts || request) return;
    request = fetch(dataUrl).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (json) {
      posts = Array.isArray(json) ? json : [];
      run(input.value);
    }).catch(function () {
      box.innerHTML = '<div class="search-empty"><p>搜索索引加载失败</p><span>请确认站点已重新生成（/search.json）</span></div>';
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function highlight(text, q) {
    var safe = escapeHtml(text);
    if (!q) return safe;
    var esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      return safe.replace(new RegExp('(' + esc + ')', 'gi'), '<mark>$1</mark>');
    } catch (e) {
      return safe;
    }
  }

  function score(post, q) {
    var s = 0;
    var title = (post.title || '').toLowerCase();
    var content = (post.content || '').toLowerCase();
    var tags = (post.tags || []).join(' ').toLowerCase();
    var cats = (post.categories || []).join(' ').toLowerCase();

    if (title.indexOf(q) > -1) s += 12;
    if (tags.indexOf(q) > -1) s += 6;
    if (cats.indexOf(q) > -1) s += 5;
    if (content.indexOf(q) > -1) s += 3;
    if (!s) return 0;

    var words = q.split(/\s+/).filter(Boolean);
    words.forEach(function (w) {
      if (title.indexOf(w) > -1) s += 4;
      if (content.indexOf(w) > -1) s += 1;
    });
    return s;
  }

  function snippet(post, q) {
    var text = post.content || '';
    var i = text.toLowerCase().indexOf(q);
    if (i < 0) return text.slice(0, 88);
    var start = Math.max(0, i - 36);
    return (start > 0 ? '…' : '') + text.slice(start, start + 96);
  }

  function render(html) {
    box.innerHTML = html;
    activeIndex = -1;
  }

  function run(q) {
    q = (q || '').trim();
    if (!q) { render(DEFAULT_HTML); return; }
    if (!posts) { render('<div class="search-empty"><p>正在载入索引…</p></div>'); return; }

    var lower = q.toLowerCase();
    var hits = posts
      .map(function (p) { return { post: p, s: score(p, lower) }; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 12);

    if (!hits.length) {
      render('<div class="search-empty"><p>没有找到「' + escapeHtml(q) + '」</p><span>换个关键词试试，比如 CVE、SSTI、堆溢出</span></div>');
      return;
    }

    render(hits.map(function (x) {
      var p = x.post;
      return '<a class="search-hit" href="/' + p.path + '">' +
        '<div class="search-hit-title">' + highlight(p.title, q) + '</div>' +
        '<div class="search-hit-meta">' +
        '<span>' + escapeHtml(p.date) + '</span>' +
        '<span>' + escapeHtml((p.categories || []).join(' / ')) + '</span>' +
        '</div>' +
        '<div class="search-hit-desc">' + highlight(snippet(p, lower), q) + '</div>' +
        '</a>';
    }).join(''));
  }

  function open() {
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden', 'false');
    doc.body.style.overflow = 'hidden';
    load();
    setTimeout(function () { input.focus(); }, 30);
  }

  function close() {
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    doc.body.style.overflow = '';
    input.value = '';
    render(DEFAULT_HTML);
  }

  function move(dir) {
    var items = Array.prototype.slice.call(box.querySelectorAll('.search-hit'));
    if (!items.length) return;
    activeIndex = (activeIndex + dir + items.length) % items.length;
    items.forEach(function (el, i) { el.classList.toggle('is-active', i === activeIndex); });
    items[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', function () { run(input.value); });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') {
      var items = box.querySelectorAll('.search-hit');
      if (activeIndex > -1 && items[activeIndex]) items[activeIndex].click();
      else if (items[0]) items[0].click();
    }
  });

  doc.addEventListener('click', function (e) {
    if (e.target.closest('[data-close="search"]')) close();
  });

  doc.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement.tagName) || doc.activeElement.isContentEditable;

    if (e.key === 'Escape' && layer.classList.contains('is-open')) close();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      layer.classList.contains('is-open') ? close() : open();
    }
    if (e.key === '/' && !typing && !layer.classList.contains('is-open')) {
      e.preventDefault();
      open();
    }
  });

  var trigger = doc.getElementById('searchBtn');
  if (trigger) trigger.addEventListener('click', open);

  window.__whymmSearchOpen = open;
})();
