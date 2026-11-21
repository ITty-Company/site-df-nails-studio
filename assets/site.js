/* D.F. Nails Studio — ontwerpvoorstel ITty Company */
(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = function () { return innerWidth < 900; };
  function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(t) { t = cl(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function ss(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function sg(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }

  /* ---------- Lenis ---------- */
  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var el = document.querySelector(id); if (!el) return;
      e.preventDefault(); closeMenu();
      var y = el.getBoundingClientRect().top + scrollY + (el.dataset.off ? innerHeight * parseFloat(el.dataset.off) : 0);
      if (lenis) lenis.scrollTo(y, { duration: 1.6 }); else scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- page transition curtain ---------- */
  var ORDER = { 'index.html': 0, 'behandelingen.html': 1, 'over-ons.html': 2, 'contact.html': 3 };
  var NAMES = { 'index.html': 'home.', 'behandelingen.html': 'behandelingen.', 'over-ons.html': 'over ons.', 'contact.html': 'contact.' };
  var here = location.pathname.split('/').pop() || 'index.html';
  var cur = document.getElementById('curtain');
  if (cur) {
    var nameEl = cur.querySelector('b');
    setTimeout(function () { cur.classList.add('out'); cur.classList.remove('show'); }, reduced ? 0 : 420);
    document.querySelectorAll('a[href$=".html"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
        var href = a.getAttribute('href'); if (href === here) { e.preventDefault(); closeMenu(); return; }
        e.preventDefault(); closeMenu();
        var rev = (ORDER[href] || 0) < (ORDER[here] || 0);
        nameEl.textContent = NAMES[href] || '';
        cur.className = 'curtain go' + (rev ? ' rev' : ''); void cur.offsetWidth; cur.classList.add('run');
        if (!mobile()) document.body.classList.add('leaving');
        setTimeout(function () {
          var f = cur.querySelector('.f'); f.style.animation = 'none'; void f.offsetWidth; f.style.animation = '';
          cur.classList.add('show');
        }, reduced ? 0 : 620);
        setTimeout(function () { location.href = href; }, reduced ? 0 : 900);
      });
    });
    addEventListener('pageshow', function (e) { if (e.persisted) { document.body.classList.remove('leaving'); cur.className = 'curtain out'; } });
  }

  /* ---------- nav + mobile menu ---------- */
  var nav = document.getElementById('nav'), burger = nav.querySelector('.nav__burger'), mm = document.getElementById('mmenu');
  function closeMenu() { if (!mm || mm.hidden) return; mm.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Menu openen'); document.body.style.overflow = ''; if (lenis) lenis.start(); }
  burger.addEventListener('click', function () {
    var open = mm.hidden; mm.hidden = !open; burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    document.body.style.overflow = open ? 'hidden' : ''; if (lenis) { open ? lenis.stop() : lenis.start(); }
  });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- split headings into words ---------- */
  function splitWords(h, cls) {
    var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var w = document.createElement('span'); w.className = 'w';
            if (cls) { w.textContent = t; } else { var inner = document.createElement('span'); inner.textContent = t; inner.style.setProperty('--i', i); w.appendChild(inner); }
            i++; frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    })(h);
  }
  var rev = [].slice.call(document.querySelectorAll('.reveal'));
  document.querySelectorAll('.split').forEach(function (h) { splitWords(h); rev.push(h); });
  function reveals() {
    var h = innerHeight;
    rev = rev.filter(function (el) { var r = el.getBoundingClientRect(); if (r.top < h * 0.9 && r.bottom > 0) { el.classList.add('in'); return false; } return true; });
  }

  /* ---------- hero tab bar ---------- */
  var bar = document.getElementById('tabbar'), ti = 0;
  if (bar) [].forEach.call(bar.parentNode.querySelectorAll('a'), function (a, k) {
    a.addEventListener('pointerenter', function () { bar.style.transform = 'translateX(' + k * 100 + '%)'; });
    a.addEventListener('focus', function () { bar.style.transform = 'translateX(' + k * 100 + '%)'; });
  });

  /* ---------- cursor glow on cards ---------- */
  document.querySelectorAll('.gcard,.stats li').forEach(function (c) {
    c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px'); });
  });

  /* ---------- pointer (smoothed) ---------- */
  var mx = 0, my = 0, sx = 0, sy = 0;
  addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });

  /* ---------- particles ---------- */
  var fxList = [];
  function FX(cv) {
    var ctx = cv.getContext('2d'), kind = cv.dataset.fx, P = [], B = [], W = 0, H = 0, vis = false;
    var dpr = Math.min(devicePixelRatio || 1, 2) * (mobile() ? .6 : 1);
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function spawn(init) {
      var hot = Math.random() < (kind === 'sparks' ? .1 : 1 / 12);
      if (kind === 'sparks') return { x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: .7 + Math.random() * 1.9, vy: -(.35 + Math.random() * .9), vx: -.2 + Math.random() * .4, ph: Math.random() * 6.28, c: hot ? '255,116,72' : '244,228,218' };
      return { x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: .5 + Math.random() * 1.9, vy: -(.12 + Math.random() * .35), vx: -.12 + Math.random() * .24, ph: Math.random() * 6.28, c: hot ? '255,116,72' : '244,228,218' };
    }
    size();
    var n = Math.round(W * H / (kind === 'sparks' ? 11000 : 15000) * (mobile() ? .5 : 1));
    for (var i = 0; i < n; i++) P.push(spawn(true));
    addEventListener('resize', size);
    new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(cv);
    var t = 0;
    (function frame() {
      requestAnimationFrame(frame); if (!vis || reduced) return; t += .016;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        p.y += p.vy; p.x += p.vx + Math.sin(t * .8 + p.ph) * .15;
        if (p.y < -10) P[i] = spawn(false);
        var al = .3 + .35 * Math.sin(t * 2 + p.ph);
        ctx.fillStyle = 'rgba(' + p.c + ',' + al.toFixed(2) + ')'; ctx.shadowColor = 'rgba(' + p.c + ',.9)'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      }
      for (var j = B.length - 1; j >= 0; j--) {
        var b = B[j]; b.life -= .012;
        if (b.life <= 0) { B.splice(j, 1); continue; }
        if (b.ring) {
          b.rr += 1.1; ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,116,72,' + (b.life * .5).toFixed(2) + ')'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.ellipse(b.x, b.y, b.rr, b.rr * .32, 0, 0, 6.28); ctx.stroke(); continue;
        }
        b.vy += b.g; b.x += b.vx; b.y += b.vy;
        ctx.fillStyle = 'rgba(' + b.c + ',' + (b.life * .9).toFixed(2) + ')'; ctx.shadowColor = 'rgba(' + b.c + ',1)'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.28); ctx.fill();
      }
    })();
    return {
      el: cv,
      burst: function (x, y, type) {
        if (reduced) return;
        var m = mobile() ? .5 : 1;
        if (type === 'ripple') { for (var k = 0; k < 4; k++) B.push({ ring: 1, x: x, y: y, rr: 6 + k * 14, life: 1 - k * .12 }); return; }
        var cnt = Math.round((type === 'dust' ? 70 : 28) * m);
        for (var q = 0; q < cnt; q++) {
          var a = Math.random() * 6.28, s = type === 'dust' ? Math.random() * 1.6 : .5 + Math.random() * 2.2;
          B.push({ x: x + (Math.random() - .5) * 30, y: y + (Math.random() - .5) * 16, vx: Math.cos(a) * s, vy: type === 'drops' ? -Math.random() * 2 : Math.sin(a) * s - .4,
            g: type === 'dust' ? .02 : .07, r: type === 'drops' ? 1.6 + Math.random() * 2.4 : .6 + Math.random() * 1.6, life: .8 + Math.random() * .4,
            c: type === 'dust' ? '244,228,218' : '255,116,72' });
        }
      }
    };
  }
  document.querySelectorAll('canvas.fx').forEach(function (c) { fxList.push(FX(c)); });

  /* ---------- scroll parallax on photo sections ---------- */
  var pars = [].slice.call(document.querySelectorAll('[data-par]'));
  function parallax() {
    pars.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var d = (r.top + r.height / 2 - innerHeight / 2) * -parseFloat(el.dataset.par);
      el.style.transform = 'translate3d(' + (sx * -18).toFixed(1) + 'px,' + (d + sy * -12).toFixed(1) + 'px,0) scale(1.14)';
    });
  }

  /* =========================================================
     HOME STORY ENGINE
     ========================================================= */
  var storyFrame = function () {};
  var story = document.querySelector('.story');
  if (story) (function () {
    var stage = story.querySelector('.stage'), frames = stage.querySelector('.frames'), bgs = stage.querySelector('.bgs');
    var chaps = [].slice.call(story.querySelectorAll('.chap'));
    var kfs = [].slice.call(frames.querySelectorAll('.kf'));
    var bgImgs = [].slice.call(bgs.children);
    var words = [].slice.call(stage.querySelectorAll('.bigword span'));
    var dots = [].slice.call(stage.querySelectorAll('.sdots i'));
    var cnt = stage.querySelector('.counter b'), capEl = stage.querySelector('.cap');
    var fx = fxList.filter(function (f) { return f.el.closest('.stage'); })[0];
    var IW = 1344, IH = 752;
    var geo = {};
    function measure() {
      var w = frames.clientWidth, h = frames.clientHeight, s = Math.max(w / IW, h / IH), dw = IW * s, dh = IH * s;
      var px = mobile() ? .52 : .64;
      geo = { w: w, h: h, s: s, ox: (w - dw) * px, oy: (h - dh) * .5, dw: dw, dh: dh };
      /* place nail overlays (tint ellipses, vorm outline) */
      stage.querySelectorAll('[data-nails]').forEach(function (t) {
        var list = t.dataset.nails.split(';');
        t.innerHTML = '';
        list.forEach(function (n) {
          var v = n.split(',').map(Number), i = document.createElement('i');
          i.style.left = (geo.ox + v[0] * dw) + 'px'; i.style.top = (geo.oy + v[1] * dh) + 'px';
          i.style.width = v[2] * dw + 'px'; i.style.height = v[3] * dh + 'px'; i.style.setProperty('--r', (v[4] || 0) + 'deg');
          t.appendChild(i);
        });
      });
      var vo = stage.querySelector('.vorm-o');
      stage.querySelectorAll('[data-ats]').forEach(function (sv) {
        sv.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        sv.innerHTML = sv.dataset.ats.split(';').map(function (n) {
          var a = n.split(',').map(Number);
          return '<g transform="translate(' + (geo.ox + a[0] * dw).toFixed(1) + ',' + (geo.oy + a[1] * dh).toFixed(1) + ') rotate(' + a[3] + ') scale(' + (a[2] * dw / 40).toFixed(3) + ')"><path vector-effect="non-scaling-stroke" d="M-10,18 L-10,-12 C-10,-30 -4,-44 0,-52 C4,-44 10,-30 10,-12 L10,18"/></g>';
        }).join('');
      });
      if (vo) { var a = vo.dataset.at.split(',').map(Number); vo.setAttribute('viewBox', '0 0 ' + w + ' ' + h); vo.querySelector('g').setAttribute('transform', 'translate(' + (geo.ox + a[0] * dw) + ',' + (geo.oy + a[1] * dh) + ') rotate(' + a[3] + ') scale(' + (a[2] * dw / 40) + ')'); }
    }
    function pt(c) { var v = (c.dataset.pt || '.5,.62').split(',').map(Number); return [geo.ox + v[0] * geo.dw, geo.oy + v[1] * geo.dh]; }
    function soft(dir, e) { var a = (e * 125 - 25).toFixed(2), b = (e * 125).toFixed(2); return 'linear-gradient(' + dir + ',#000 ' + a + '%,transparent ' + b + '%)'; }
    var maskFn = {
      circle: function (e, p) { var R = e * Math.hypot(geo.w, geo.h) * 1.05; return 'radial-gradient(circle at ' + p[0].toFixed(0) + 'px ' + p[1].toFixed(0) + 'px,#000 ' + R.toFixed(0) + 'px,transparent ' + (R + 70).toFixed(0) + 'px)'; },
      dip: function (e, p) { var q = cl((e - .45) / .55), R = q * Math.hypot(geo.w, geo.h) * 1.05; return q <= 0 ? 'linear-gradient(transparent,transparent)' : 'radial-gradient(circle at ' + p[0].toFixed(0) + 'px ' + p[1].toFixed(0) + 'px,#000 ' + R.toFixed(0) + 'px,transparent ' + (R + 30).toFixed(0) + 'px)'; },
      drop: function (e) { return soft('180deg', e); },
      water: function (e) { return soft('0deg', e); },
      stroke: function (e) { return soft('90deg', e); },
      wedge: function (e) { return soft('118deg', e); },
      wedgeR: function (e) { return soft('242deg', e); }
    };
    function setMask(el, v) { el.style.webkitMaskImage = v; el.style.maskImage = v; }
    var last = -1, lastBg = '';
    function frameFn() {
      var vh = innerHeight, i, n = chaps.length, active = 0, T = [], fi = chaps.length - 1;
      for (i = 0; i < n; i++) {
        var r = chaps[i].getBoundingClientRect();
        T[i] = i === 0 ? 1 : cl((vh * 0.92 - r.top) / (vh * 0.62));
        if (i > 0 && T[i] > .5) active = i;
      }
      /* frame layers */
      for (i = 1; i < n; i++) {
        var e = ease(T[i]), m = chaps[i].dataset.mask || 'circle';
        setMask(kfs[i], e <= 0 || e >= 1 ? 'none' : maskFn[m](e, pt(chaps[i])));
      }
      for (i = 0; i < n; i++) {
        var vis = (i === 0 || T[i] > 0) && (i === n - 1 || T[i + 1] < 1);
        kfs[i].style.visibility = vis ? 'visible' : 'hidden';
      }
      /* backgrounds: layers revealed by a circular wave from the nail */
      var bgReveal = {};
      chaps.forEach(function (c, k) { var b = c.dataset.bg; if (!(b in bgReveal)) bgReveal[b] = k === 0 ? 1 : ease(T[k]); });
      bgImgs.forEach(function (im, k) {
        var e2 = bgReveal[im.dataset.bg] || 0;
        setMask(im, k === 0 || e2 >= 1 || e2 <= 0 ? 'none' : maskFn.circle(e2, pt(chaps[active])));
        im.style.visibility = e2 <= 0 && k ? 'hidden' : 'visible';
      });
      /* camera: hero fly-in + flash, ken burns per chapter */
      var h1 = T[1], fly = Math.sin(Math.PI * cl(h1));
      var rHero = chaps[0].getBoundingClientRect();
      var ho = 1 - cl(-rHero.top / (vh * .45));
      var cr = chaps[active].getBoundingClientRect(), local = cl((vh - cr.top) / (cr.height + vh));
      var p0 = pt(chaps[active] === chaps[0] ? chaps[0] : chaps[active]);
      stage.style.setProperty('--ox', p0[0].toFixed(0) + 'px'); stage.style.setProperty('--oy', p0[1].toFixed(0) + 'px');
      frames.style.setProperty('--ox', p0[0].toFixed(0) + 'px'); frames.style.setProperty('--oy', p0[1].toFixed(0) + 'px');
      var z = 1 + .2 * fly + .045 * local;
      frames.style.setProperty('--fz', z.toFixed(4));
      frames.style.setProperty('--fr', ((active % 2 ? -.6 : .6) * local).toFixed(3) + 'deg');
      stage.style.setProperty('--flash', (Math.max(0, 1 - Math.abs(h1 - .5) / .14) * .85).toFixed(3));
      stage.style.setProperty('--kb', (1.0 + .06 * local).toFixed(4));
      chaps[0].style.setProperty('--ho', ho.toFixed(3));
      stage.style.setProperty('--ui', cl((T[1] - .3) / .4).toFixed(3));
      /* hero: keep the text column clear (desktop), ease back to the shared anchor */
      var hx = mobile() ? 0 : ho;
      frames.style.setProperty('--hx', (hx * geo.w * .12).toFixed(1) + 'px');
      frames.style.setProperty('--fz', (z * (1 - .05 * hx)).toFixed(4));
      /* pedicure: dip through the jade base, then a ripple wave out of the toe */
      var wi = chaps.findIndex(function (c) { return c.dataset.mask === 'dip'; });
      if (wi > 0) {
        stage.style.setProperty('--water', (ease(T[wi]) * (1 - ease(T[wi + 1] || 0)) * .9).toFixed(3));
        stage.style.setProperty('--dip', (Math.sin(Math.PI * cl(T[wi] / .9)) * .92).toFixed(3));
      }
      /* finale grows out of the door */
      var tf = chaps[fi].hasAttribute('data-final') ? ease(T[fi]) : 0;
      stage.style.setProperty('--fin', tf.toFixed(3));
      stage.style.setProperty('--ui', (cl((T[1] - .3) / .4) * (1 - tf)).toFixed(3));
      /* end of story: short fade (35vh) into the footer */
      var sr = story.getBoundingClientRect();
      stage.style.setProperty('--fo', cl(1 - (sr.bottom - vh) / (vh * .35)).toFixed(3));
      if (active !== last) {
        var prev = last; last = active;
        words.forEach(function (w, k) { w.classList.toggle('on', k === active); });
        dots.forEach(function (d, k) { d.classList.toggle('on', k === active - 1); });
        if (cnt) cnt.textContent = active && active < 8 ? active + ' / 7' : '';
        if (capEl) capEl.style.opacity = '1';
        if (fx && prev >= 0 && active > prev) {
          var p = pt(chaps[active]), b = chaps[active].dataset.burst;
          if (b) fx.burst(p[0], p[1], b);
        }
      }
    }
    measure();
    addEventListener('resize', function () { measure(); frameFn(); });
    storyFrame = frameFn;
    /* mouse parallax: frame ±6px, background ±12px */
    (function loop() {
      if (!reduced && !mobile()) {
        frames.style.setProperty('--fx', (sx * -12).toFixed(1) + 'px'); frames.style.setProperty('--fy', (sy * -12).toFixed(1) + 'px');
        bgs.style.setProperty('--bx', (sx * -24).toFixed(1) + 'px'); bgs.style.setProperty('--by', (sy * -24).toFixed(1) + 'px');
      }
      requestAnimationFrame(loop);
    })();

    /* interactive: kies je vorm */
    var vo = stage.querySelector('.vorm-o');
    document.querySelectorAll('.shapes button').forEach(function (b, k, all) {
      b.addEventListener('click', function () {
        all.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        if (!vo) return;
        vo.querySelector('path').setAttribute('d', b.dataset.d);
        vo.classList.remove('on'); void vo.getBoundingClientRect(); vo.classList.add('on');
      });
    });
    /* interactive: kleurproef */
    var tint = stage.querySelector('.tint');
    document.querySelectorAll('.swatches button').forEach(function (b, k, all) {
      b.addEventListener('click', function () {
        all.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        if (!tint) return;
        tint.style.setProperty('--c', b.dataset.c);
        tint.classList.toggle('on', b.dataset.c !== 'none');
      });
    });
    /* mobile: lees verder */
    story.querySelectorAll('.more').forEach(function (b) {
      b.addEventListener('click', function () { b.closest('.panel').classList.add('open'); b.setAttribute('aria-expanded', 'true'); });
    });
    stage.querySelectorAll('img').forEach(function (im) { im.loading = 'eager'; });
  })();

  /* ---------- BIAB | Acryl switch ---------- */
  document.querySelectorAll('.seg').forEach(function (seg) {
    var btns = seg.querySelectorAll('button'), box = document.getElementById(seg.dataset.for);
    btns.forEach(function (b, k) {
      b.addEventListener('click', function () {
        seg.dataset.v = k; btns.forEach(function (x, j) { x.setAttribute('aria-pressed', String(j === k)); });
        box.querySelectorAll('p').forEach(function (p, j) { p.hidden = j !== k; });
        var st = document.querySelector('.stage');
        if (st) {
          st.classList.toggle('acryl', k === 1);
          var kc = st.querySelector('.kcap'); if (kc) kc.textContent = k === 1 ? 'Acryl — verlengd en in vorm gebracht (illustratie)' : 'BIAB — opbouwlaag over je eigen nagel';
        }
      });
    });
  });

  /* ---------- Behandelingen: pinned horizontal ribbon ---------- */
  var ribbon = document.querySelector('.ribbon'), ribFn = function () {};
  if (ribbon) {
    var row = ribbon.querySelector('.ribbon__row');
    ribFn = function () {
      if (mobile()) { row.style.transform = ''; return; }
      var r = ribbon.getBoundingClientRect(), span = ribbon.offsetHeight - innerHeight, p = cl(-r.top / span);
      var q = p * 2, k = Math.floor(q), f = q - k, eased = k + ease(cl((f - .2) / .6));
      if (k >= 2) eased = 2;
      row.style.transform = 'translate3d(' + (-eased * innerWidth).toFixed(1) + 'px,0,0)';
      ribbon.style.setProperty('--rp', p.toFixed(3));
    };
  }

  /* ---------- Over ons: ink words + process line ---------- */
  var inks = [].slice.call(document.querySelectorAll('.ink'));
  inks.forEach(function (p) { splitWords(p, true); });
  function inkFn() {
    inks.forEach(function (p) {
      var r = p.getBoundingClientRect(), ws = p.querySelectorAll('.w');
      var t = cl((innerHeight * .85 - r.top) / (r.height + innerHeight * .35)), lit = Math.round(t * ws.length);
      ws.forEach(function (w, k) { w.classList.toggle('lit', k < lit); });
    });
  }
  var pline = document.querySelector('.pline'), plFn = function () {};
  if (pline) {
    var dl = pline.querySelector('line.draw'), dot = pline.querySelector('.pdot'), lis = pline.querySelectorAll('li');
    plFn = function () {
      var r = pline.getBoundingClientRect(), t = cl((innerHeight * .6 - r.top) / r.height), y = t * r.height;
      dl.setAttribute('y2', (t * 100).toFixed(2) + '%'); dot.style.top = y.toFixed(1) + 'px';
      lis.forEach(function (li) { li.classList.toggle('on', li.offsetTop <= y + 10); });
    };
  }

  /* ---------- badge hides when the footer is in view ---------- */
  var foot = document.querySelector('.foot');
  if (foot && 'IntersectionObserver' in window) new IntersectionObserver(function (en) { document.body.classList.toggle('footin', en[0].isIntersecting); }).observe(foot);

  /* ---------- main tick ---------- */
  function tick() {
    nav.classList.toggle('solid', scrollY > 40);
    reveals(); storyFrame(); parallax(); ribFn(); inkFn(); plFn();
  }
  (function loop() {
    sx += (mx - sx) * .06; sy += (my - sy) * .06;
    if (!reduced && Math.abs(mx - sx) + Math.abs(my - sy) > .0005) parallax();
    requestAnimationFrame(loop);
  })();
  if (lenis) lenis.on('scroll', tick);
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', tick);
  tick(); setTimeout(tick, 300);
})();
