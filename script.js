(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PAGES = [['index.html', 'Home'], ['blogs.html', 'Blog'], ['members.html', 'Members'], ['about.html', 'About']];

  // Highlight the current page in the nav
  const current = location.pathname.split('/').pop() || 'index.html';
  $$('nav a').forEach(a => {
    if (a.getAttribute('href') === current) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); }
  });

  // Visitor counter (stored in this browser only)
  const counter = $('#visitor-count');
  if (counter) {
    let n = 1337;
    try {
      const saved = parseInt(localStorage.getItem('forceArchives.visits'), 10);
      if (!isNaN(saved)) n = saved;
      n += 1;
      localStorage.setItem('forceArchives.visits', n);
    } catch (e) { /* storage blocked: keep default */ }
    counter.innerHTML = String(n).padStart(6, '0').split('').map(d => '<span>' + d + '</span>').join('');
    counter.setAttribute('role', 'img');
    counter.setAttribute('aria-label', 'Visitor number ' + n);
  }

  // Taskbar with Start menu and clock
  const bar = document.createElement('div');
  bar.className = 'taskbar';
  bar.innerHTML = '<button type="button" class="start-btn" aria-haspopup="true" aria-expanded="false">Start</button>' +
    '<div class="start-menu" hidden>' + PAGES.map(p => '<a href="' + p[0] + '">' + p[1] + '</a>').join('') + '</div>' +
    '<div class="clock"></div>';
  document.body.appendChild(bar);
  const startBtn = $('.start-btn', bar), menu = $('.start-menu', bar), clock = $('.clock', bar);
  const setMenu = open => { menu.hidden = !open; startBtn.setAttribute('aria-expanded', open); };
  startBtn.addEventListener('click', e => { e.stopPropagation(); setMenu(menu.hidden); });
  document.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  const tick = () => { clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
  tick(); setInterval(tick, 10000);

  // Members page: search, sort, collapse, animated stat bars, image fallback
  const list = $('.characters');
  if (!list) return;
  const cards = $$('.character-card', list);
  const search = $('#member-search'), sortBy = $('#member-sort'), count = $('#member-count'), empty = $('#member-empty');
  const nameOf = c => $('.card-name', c).textContent;
  const statOf = (c, key) => {
    const row = $$('.stat', c).find(r => $('.stat-name', r).textContent === key);
    return row ? parseInt($('.stat-fill', row).dataset.value, 10) : 0;
  };

  $$('.stat-fill').forEach(f => {
    f.dataset.value = parseInt(f.style.width, 10);
    if (!reduceMotion) {
      f.style.width = '0%';
      requestAnimationFrame(() => requestAnimationFrame(() => { f.style.width = f.dataset.value + '%'; }));
    }
  });

  $$('.character-img img').forEach(img => {
    const fallback = () => {
      const p = document.createElement('div');
      p.className = 'placeholder';
      p.textContent = img.alt.split(/\s|-/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
      img.replaceWith(p);
    };
    if (img.complete && img.naturalWidth === 0) fallback();
    else img.addEventListener('error', fallback);
  });

  function update() {
    const q = search.value.trim().toLowerCase(), key = sortBy.value;
    const ordered = cards.slice();
    if (key === 'name') ordered.sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
    else if (key !== 'roster') ordered.sort((a, b) => statOf(b, key) - statOf(a, key));
    let shown = 0;
    ordered.forEach(c => {
      const match = !q || c.textContent.toLowerCase().includes(q);
      c.hidden = !match;
      if (match) shown++;
      list.appendChild(c);
    });
    count.textContent = 'Showing ' + shown + ' of ' + cards.length + ' members';
    empty.hidden = shown > 0;
  }
  search.addEventListener('input', update);
  sortBy.addEventListener('change', update);

  function setCollapsed(card, collapsed) {
    const btn = $('.tb-btn', card), name = nameOf(card);
    $('.card-body', card).hidden = collapsed;
    btn.setAttribute('aria-expanded', !collapsed);
    btn.setAttribute('aria-label', (collapsed ? 'Expand ' : 'Collapse ') + name);
    btn.textContent = collapsed ? '+' : '_';
  }
  list.addEventListener('click', e => {
    const btn = e.target.closest('.tb-btn');
    if (btn) { const card = btn.closest('.character-card'); setCollapsed(card, !$('.card-body', card).hidden); }
  });
  $('#collapse-all').addEventListener('click', () => cards.forEach(c => setCollapsed(c, true)));
  $('#expand-all').addEventListener('click', () => cards.forEach(c => setCollapsed(c, false)));
  update();
})();
