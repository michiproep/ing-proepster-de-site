/*
 * Language handling for the two page variants:
 *   /index.html     -> English (default)
 *   /de/index.html  -> German
 *
 * On the English page, visitors without a stored choice whose browser
 * prefers German are redirected to /de/index.html. An explicit choice made via the
 * dropdown is remembered in localStorage and always wins over detection.
 * The choice is also passed along as ?lang=xx when switching, because under
 * file:// some browsers give every folder its own localStorage.
 * Loaded blocking in <head> so the redirect happens before the page renders.
 */
(function () {
  var STORAGE_KEY = 'imp-lang';
  var pageLang = document.documentElement.lang === 'de' ? 'de' : 'en';
  var pathTo = { en: '../index.html', de: 'de/index.html' };

  // Section ids differ per language; keep the visitor on the same section when switching.
  // An empty English id means the section only exists on the German page.
  var ids = [
    ['top', 'top'],
    ['services', 'leistungen'],
    ['ai', 'ki'],
    ['process', 'ablauf'],
    ['benefits', 'vorteile'],
    ['', 'zuhause'],
    ['contact', 'kontakt'],
    ['legal-notice', 'impressum'],
    ['privacy', 'datenschutz']
  ];

  function mapHash(hash, target) {
    var id = hash.replace(/^#/, '');
    if (!id) { return ''; }
    for (var i = 0; i < ids.length; i++) {
      var pair = target === 'de' ? ids[i] : [ids[i][1], ids[i][0]];
      if (pair[0] === id) { return pair[1] ? '#' + pair[1] : ''; }
    }
    return hash;
  }

  function readStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function store(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage unavailable */ }
  }

  function detect() {
    var list = navigator.languages || [navigator.language || navigator.userLanguage || ''];
    for (var i = 0; i < list.length; i++) {
      if (/^de\b/i.test(list[i])) { return 'de'; }
      if (/^en\b/i.test(list[i])) { return 'en'; }
    }
    return 'en';
  }

  function paramLang() {
    var m = /[?&]lang=(de|en)(?:&|$)/.exec(location.search);
    return m ? m[1] : null;
  }

  function go(target, replace) {
    var url = pathTo[target] + '?lang=' + target + mapHash(location.hash, target);
    if (replace) { location.replace(url); } else { location.href = url; }
  }

  var explicit = paramLang();
  if (explicit) {
    store(explicit);
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* keep query */ }
  }

  if (pageLang === 'en') {
    var preferred = explicit || readStored() || detect();
    if (preferred === 'de') { go('de', true); return; }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('lang-switch');
    if (!root) { return; }
    var btn = root.querySelector('.lang-btn');
    var menu = root.querySelector('.lang-menu');
    var links = menu.querySelectorAll('a[data-lang]');

    function setOpen(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.hidden = !open;
    }

    btn.addEventListener('click', function () {
      var open = menu.hidden;
      setOpen(open);
      if (open) { (menu.querySelector('a[aria-current]') || links[0]).focus(); }
    });

    document.addEventListener('click', function (e) {
      if (!root.contains(e.target)) { setOpen(false); }
    });

    root.addEventListener('focusout', function (e) {
      if (!root.contains(e.relatedTarget)) { setOpen(false); }
    });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setOpen(false); btn.focus(); return; }
      if (menu.hidden) { return; }
      var idx = Array.prototype.indexOf.call(links, document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); links[(idx + 1) % links.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); links[(idx - 1 + links.length) % links.length].focus(); }
    });

    Array.prototype.forEach.call(links, function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var target = link.getAttribute('data-lang') === 'de' ? 'de' : 'en';
        store(target);
        setOpen(false);
        if (target !== pageLang) { go(target, false); }
      });
    });
  });
})();
