/* Sypho Technologies website behaviour
   Theme, menu, hero, scroll effects, module showcase (pinned scroll), deployment explorer, enquiry builder. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- Year, theme, menu ---------- */
  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
  var themeBtn = $('#theme');
  function themeLabel() { themeBtn.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); }
  themeLabel();
  themeBtn.addEventListener('click', function () {
    var t = root.dataset.theme === 'dark' ? 'light' : 'dark'; root.dataset.theme = t; themeLabel();
    try { localStorage.setItem('sypho-theme', t); } catch (e) {}
  });
  var menu = $('#menu'), menuBtn = $('#menuBtn');
  function closeMenu() { menu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () { var o = menu.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', function (e) { if (!e.target.closest('#nav')) closeMenu(); });

  /* ---------- Hero slideshow (never pauses) and live sample tracker ---------- */
  var slides = $$('.slide'), dots = $('#dots'), cur = 0, timer;
  function show(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, j) { s.classList.toggle('on', j === cur); s.setAttribute('aria-hidden', j !== cur); });
    $$('button', dots).forEach(function (d, j) { d.setAttribute('aria-current', j === cur); });
  }
  function play() { clearInterval(timer); if (!reduce) timer = setInterval(function () { show(cur + 1); }, 5500); }
  slides.forEach(function (_, i) {
    var d = document.createElement('button'); d.type = 'button'; d.setAttribute('aria-label', 'Show picture ' + (i + 1));
    d.addEventListener('click', function () { show(i); play(); }); dots.appendChild(d);
  });
  show(0); play();

  var states = ['Collected', 'Login and barcode', 'Preparation', 'Analysis', 'QC review', 'Approved', 'Certificate issued'];
  var bars = $$('#liveBars i'), st = $('#liveState'), sid = $('#liveId'), li = 0, ids = ['AU-0417', 'AU-0418', 'AU-0419', 'AU-0420'], idn = 0;
  function liveTick() {
    bars.forEach(function (b, j) { b.classList.toggle('on', j <= li); });
    st.textContent = states[li];
    li++; if (li >= states.length) { li = 0; idn = (idn + 1) % ids.length; setTimeout(function () { sid.textContent = 'Sample ' + ids[idn]; }, 900); }
  }
  liveTick(); if (!reduce) setInterval(liveTick, 1300);

  /* ---------- Hero glow follows the pointer ---------- */
  var hero = $('.hero');
  if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px'); hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* ---------- Scroll: progress bar, nav shadow, back to top ---------- */
  var prog = $('#prog'), navEl = $('#nav'), totop = $('#totop'), ticking = false;
  function onScroll() {
    var h = root.scrollHeight - root.clientHeight;
    prog.style.transform = 'scaleX(' + (h > 0 ? root.scrollTop / h : 0) + ')';
    navEl.classList.toggle('scrolled', scrollY > 8);
    totop.classList.toggle('show', scrollY > 900);
    suiteUpdate(); stepsUpdate();
    ticking = false;
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', function () { onScroll(); });
  totop.addEventListener('click', function () { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- Scroll spy ---------- */
  var links = $$('.menu a[href^="#"]');
  var spy = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(function (s) { spy.observe(s); });

  /* ---------- Module showcase ---------- */
  var track = $('#suiteTrack'), stage = $('#stage'), mods = $$('.mod'), navBtns = $$('#suiteList button'), list = $('#suiteList'), countNow = $('#countNow');
  var N = mods.length, active = -1, flowTimer = null, desktopMq = matchMedia('(min-width: 900px)');
  function runFlow(mod) {
    clearInterval(flowTimer);
    $$('.flow').forEach(function (f) { $$('li', f).forEach(function (x) { x.className = ''; }); });
    var items = $$('.flow li', mod), k = 0;
    if (reduce) { items.forEach(function (x) { x.classList.add('done'); }); return; }
    function step() {
      items.forEach(function (x, j) { x.className = j < k ? 'done' : (j === k ? 'now' : ''); });
      k++; if (k > items.length + 1) k = 0;
      if (k === items.length + 1) items.forEach(function (x) { x.className = 'done'; });
    }
    step(); flowTimer = setInterval(step, 850);
  }
  function setActive(i, fromScroll) {
    if (i === active) return;
    active = i;
    mods.forEach(function (m, j) { m.classList.toggle('on', j === i); });
    navBtns.forEach(function (b, j) { b.setAttribute('aria-current', j === i); });
    countNow.textContent = ('0' + (i + 1)).slice(-2);
    list.style.setProperty('--p', N > 1 ? i / (N - 1) : 0);
    runFlow(mods[i]);
    if (!desktopMq.matches) {
      var b = navBtns[i]; if (b && fromScroll) list.scrollTo({ left: b.offsetLeft - 24, behavior: 'smooth' });
    }
  }
  function suiteUpdate() {
    if (!track) return;
    if (desktopMq.matches) {
      var r = track.getBoundingClientRect(), total = track.offsetHeight - innerHeight;
      var p = clamp(-r.top / (total > 0 ? total : 1), 0, 0.9999);
      setActive(Math.floor(p * N), true);
    }
  }
  // Mobile and tablet: the modules are a swipeable carousel
  var swipeTick = false;
  stage.addEventListener('scroll', function () {
    if (desktopMq.matches || swipeTick) return; swipeTick = true;
    requestAnimationFrame(function () {
      var c = stage.scrollLeft + stage.clientWidth / 2, best = 0, bd = 1e9;
      mods.forEach(function (m, j) { var d = Math.abs(m.offsetLeft + m.offsetWidth / 2 - c); if (d < bd) { bd = d; best = j; } });
      setActive(best, true); swipeTick = false;
    });
  }, { passive: true });
  navBtns.forEach(function (b, i) {
    b.addEventListener('click', function () {
      if (desktopMq.matches) {
        var total = track.offsetHeight - innerHeight, top = track.getBoundingClientRect().top + scrollY;
        scrollTo({ top: top + total * ((i + 0.5) / N), behavior: reduce ? 'auto' : 'smooth' });
      } else {
        stage.scrollTo({ left: mods[i].offsetLeft - (stage.clientWidth - mods[i].offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      }
    });
  });
  desktopMq.addEventListener('change', function () { active = -1; setActive(0); suiteUpdate(); });
  setActive(0);

  /* ---------- Process timeline fills as you scroll ---------- */
  var steps = $('#steps'), stepItems = $$('#steps li');
  function stepsUpdate() {
    if (!steps) return;
    var r = steps.getBoundingClientRect(), vh = innerHeight;
    var p = clamp((vh * 0.78 - r.top) / (r.height + vh * 0.25), 0, 1);
    steps.style.setProperty('--p', p.toFixed(3));
    stepItems.forEach(function (li, j) { li.classList.toggle('on', p >= j / (stepItems.length - 1) - 0.02 && p > 0.02); });
  }

  /* ---------- Deployment explorer ---------- */
  var depTexts = {
    onprem: ['On-premise', 'Deployed on local servers with LAN or intranet access.', 'internal labs with strict data security requirements.'],
    cloud: ['Cloud-based', 'Secure cloud infrastructure, accessible from anywhere.', 'commercial labs with remote clients.'],
    hybrid: ['Hybrid', 'A combination of on-premise and cloud.', 'laboratories that want local security plus Customer Portal access.']
  };
  var depSvg = $('#depSvg'), depTabs = $$('#depTabs button'), depText = $('#depText');
  depTabs.forEach(function (b) {
    b.addEventListener('click', function () {
      var m = b.getAttribute('data-mode'); depSvg.setAttribute('data-mode', m);
      depTabs.forEach(function (x) { x.setAttribute('aria-selected', x === b); });
      var t = depTexts[m]; depText.innerHTML = '<h3>' + t[0] + '</h3><p>' + t[1] + '</p><p><strong>Best for:</strong> ' + t[2] + '</p>';
    });
  });

  /* ---------- Reveal on scroll ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; el.classList.add('in'); io.unobserve(el);
        setTimeout(function () { el.classList.remove('reveal', 'rv-l', 'rv-r', 'rv-z', 'in'); el.style.transitionDelay = ''; }, 1700);
      });
    }, { threshold: 0.12 });
    var add = function (sel, variant) {
      $$(sel).forEach(function (el) {
        el.classList.add('reveal'); if (variant) el.classList.add(variant);
        var i = Array.prototype.indexOf.call(el.parentElement.children, el);
        el.style.transitionDelay = Math.min(i * 90, 540) + 'ms';
        void el.offsetWidth; io.observe(el);
      });
    };
    add('.head'); add('.about-top > p');
    add('.mv article:first-child', 'rv-l'); add('.mv article:last-child', 'rv-r');
    add('.values li'); add('.tile', 'rv-z'); add('.card', 'rv-z'); add('.std div'); add('.cmp article', 'rv-z');
    add('.stat', 'rv-z'); add('.rcard', 'rv-z'); add('.faq details'); add('.cinfo li', 'rv-l'); add('.builder', 'rv-r');
  }

  /* ---------- Count-up numbers ---------- */
  var co = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      var t = e.target, m = t.textContent.match(/^(\d+)(%?)$/); if (!m || reduce) return;
      var end = +m[1], sfx = m[2], t0 = performance.now(), from = end > 100 ? end - 60 : 0;
      (function f(n) {
        var k = Math.min((n - t0) / 1400, 1);
        t.textContent = Math.round(from + (end - from) * (1 - Math.pow(1 - k, 3))) + sfx;
        if (k < 1) requestAnimationFrame(f);
      })(t0);
    });
  }, { threshold: 0.6 });
  $$('.stat strong').forEach(function (el) { co.observe(el); });

  /* ---------- Tilt on solution tiles (mouse devices only) ---------- */
  if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    $$('.tile').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--rx', ((.5 - y) * 6).toFixed(2) + 'deg'); c.style.setProperty('--ry', ((x - .5) * 8).toFixed(2) + 'deg');
      });
      c.addEventListener('pointerleave', function () { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- Enquiry builder ---------- */
  var gInterest = $('#gInterest'), gMods = $('#gMods'), gDeploy = $('#gDeploy'), gModsWrap = $('#gModsWrap'), sum = $('#sum');
  var form = $('#enq'), note = $('#note'), TO = 'maxwell@syphotechnologies.com', WA = '263783168285';
  function pressed(g) { return $$('.chip[aria-pressed="true"]', g).map(function (c) { return c.getAttribute('data-v'); }); }
  function chipFor(g, v) { return $$('.chip', g).filter(function (c) { return c.getAttribute('data-v') === v; })[0]; }
  function setChip(g, v, on) { var c = chipFor(g, v); if (c) c.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  function selection() {
    var i = pressed(gInterest), m = pressed(gMods), d = pressed(gDeploy), parts = [];
    if (i.length) parts.push('Interested in: ' + i.join('; '));
    if (m.length && i.indexOf('SYPHO LIMS') > -1) parts.push('LIMS modules: ' + m.join(', '));
    if (d.length) parts.push('Deployment: ' + d.join(', '));
    return parts;
  }
  function refresh() {
    var showMods = pressed(gInterest).indexOf('SYPHO LIMS') > -1; gModsWrap.hidden = !showMods;
    $$('.dv').forEach(function (d) { var v = pressed($('#' + d.getAttribute('data-for'))); d.textContent = v.length ? (v.length > 1 ? v.length + ' selected' : v[0]) : 'Select'; });
    var p = selection(); sum.innerHTML = 'Your selection: <b>' + (p.length ? p.join(' | ').replace(/</g, '&lt;') : 'nothing yet') + '</b>';
  }
  [gInterest, gMods, gDeploy].forEach(function (g) {
    g.addEventListener('click', function (e) {
      var c = e.target.closest('.chip'); if (!c) return;
      var on = c.getAttribute('aria-pressed') !== 'true';
      if (g === gDeploy) $$('.chip', g).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      c.setAttribute('aria-pressed', on ? 'true' : 'false'); refresh();
      if (g === gDeploy) { var dd = g.closest('details'); if (dd) dd.open = false; }
    });
  });
  function pick(interest, modNames) {
    if (interest) setChip(gInterest, interest, true);
    (modNames || []).forEach(function (m) { setChip(gMods, m, true); });
    refresh();
  }
  $$('.tile[data-interest]').forEach(function (t) {
    t.addEventListener('click', function () { pick(t.getAttribute('data-interest'), (t.getAttribute('data-mods') || '').split(',').filter(Boolean)); });
  });
  $$('.ask').forEach(function (b) {
    b.addEventListener('click', function () {
      pick('SYPHO LIMS', [b.getAttribute('data-mod')]);
      $('#contact').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  function body() {
    var f = form, lines = ['Name: ' + f.name.value, 'Organisation: ' + (f.org.value || '-'), 'Email: ' + f.email.value, 'Phone: ' + (f.phone.value || '-')];
    return lines.concat(selection(), ['', f.msg.value]).join('\n');
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var first = pressed(gInterest)[0] || 'General';
    location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent('Enquiry: ' + first) + '&body=' + encodeURIComponent(body());
    note.textContent = 'Your email app should open. If it does not, write to ' + TO + '.';
  });
  $('#waSend').addEventListener('click', function () {
    if (!form.name.value.trim() || !form.msg.value.trim()) {
      note.textContent = 'Add your name and a short message first, then choose Send on WhatsApp.';
      (form.name.value.trim() ? form.msg : form.name).focus(); return;
    }
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent('Hello Sypho Technologies,\n' + body()), '_blank', 'noopener');
    note.textContent = 'WhatsApp is opening with your message.';
  });
  refresh();

  onScroll();
})();
