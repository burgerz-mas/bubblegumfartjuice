/* bubblegum fart juice — scroll mascot
   Starts big up top, shrinks and waddles along the bottom as you scroll.
   Swaps between two drawings so the lettering never reads backwards. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- elements ---------- */
  var layer = document.createElement('div');
  layer.className = 'fx-layer';
  document.body.appendChild(layer);

  var mascot = document.createElement('div');
  mascot.className = 'mascot';
  mascot.innerHTML =
    '<span class="mascot-inner">' +
      '<img class="face-r" src="img/front.png" alt="Bubblegum Fart Juice mascot">' +
      '<img class="face-l hidden" src="img/front-flipped.png" alt="">' +
    '</span>';
  document.body.appendChild(mascot);

  var inner = mascot.querySelector('.mascot-inner');
  var faceR = mascot.querySelector('.face-r');
  var faceL = mascot.querySelector('.face-l');

  /* ---------- sound (Web Audio, far more reliable than <audio>) ---------- */
  var soundOn = true;
  var actx = null;
  var buffers = {};
  var SRC = {
    medium:      'sfx/medium.mp3',
    twofer:      'sfx/2for1.mp3',
    shortnsweet: 'sfx/shortnsweet.mp3'
  };

  function ctx() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    return actx;
  }

  // data: URIs get decoded in-memory. fetch() is blocked on data: URIs
  // inside sandboxed frames, which is what silently killed the sound.
  function toArrayBuffer(dataUri) {
    var b64 = dataUri.slice(dataUri.indexOf(',') + 1);
    var bin = atob(b64);
    var len = bin.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  function decodeInto(name, arrayBuf) {
    var c = ctx();
    if (!c) return;
    c.decodeAudioData(arrayBuf, function (decoded) {
      buffers[name] = decoded;
    }, function () { /* undecodable, play() will no-op */ });
  }

  function loadAll() {
    var c = ctx();
    if (!c) return;
    Object.keys(SRC).forEach(function (name) {
      var url = SRC[name];
      if (url.indexOf('data:') === 0) {
        try { decodeInto(name, toArrayBuffer(url)); } catch (e) {}
        return;
      }
      fetch(url)
        .then(function (r) { return r.arrayBuffer(); })
        .then(function (buf) { decodeInto(name, buf); })
        .catch(function () {});
    });
  }

  // last-resort fallback if Web Audio decoding isn't available
  var tags = {};
  function tagPlay(name) {
    var t = tags[name];
    if (!t) {
      t = new Audio(SRC[name]);
      t.preload = 'auto';
      t.volume = 0.9;
      tags[name] = t;
    }
    try {
      t.currentTime = 0;
      var r = t.play();
      if (r && r.catch) r.catch(function () {});
    } catch (e) {}
  }

  function play(name) {
    if (!soundOn) return;
    var c = ctx();
    if (!c || !buffers[name]) { tagPlay(name); return; }
    if (c.state === 'suspended') c.resume();
    var s = c.createBufferSource();
    s.buffer = buffers[name];
    var g = c.createGain();
    g.gain.value = 0.9;
    s.connect(g);
    g.connect(c.destination);
    s.start(0);
  }

  // browsers keep the context suspended until a real interaction
  function unlock() {
    var c = ctx();
    if (c && c.state === 'suspended') c.resume();
  }
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, unlock, { passive: true });
  });

  loadAll();

  var toggle = document.createElement('button');
  toggle.className = 'link';
  toggle.type = 'button';
  toggle.textContent = 'sound: on';
  toggle.setAttribute('aria-pressed', 'true');
  toggle.addEventListener('click', function () {
    soundOn = !soundOn;
    toggle.textContent = 'sound: ' + (soundOn ? 'on' : 'off');
    toggle.setAttribute('aria-pressed', String(soundOn));
    unlock();
    if (soundOn) play('medium');          // audible confirmation it works
  });
  var nav = document.querySelector('nav');
  if (nav) nav.appendChild(toggle);

  /* ---------- gas ---------- */
  function puff(x, y, count) {
    if (reduced) return;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'puff';
      var size = 16 + Math.random() * 26;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = (x - size / 2) + 'px';
      p.style.top = (y - size / 2) + 'px';
      p.style.setProperty('--dx', (Math.random() * 90 - 45) + 'px');
      p.style.setProperty('--dy', (-40 - Math.random() * 70) + 'px');
      p.style.animationDelay = (i * 55) + 'ms';
      layer.appendChild(p);
      (function (el, d) {
        setTimeout(function () { el.remove(); }, 1100 + d);
      })(p, i * 55);
    }
  }

  function rip(sound, count) {
    var r = mascot.getBoundingClientRect();
    puff(r.left + r.width * 0.5, r.top + r.height * 0.86, count || 3);
    play(sound || 'medium');
  }

  function hop() {
    if (reduced) return;
    inner.classList.remove('gag-hop');
    void inner.offsetWidth;        // restart the animation
    inner.classList.add('gag-hop');
    setTimeout(function () { inner.classList.remove('gag-hop'); }, 600);
  }

  mascot.addEventListener('click', function () {
    hop();
    rip('twofer', 6);
  });

  /* ---------- scroll choreography ---------- */
  var HERO_MAX  = 330;
  var WALK_SIZE = 106;
  var TRAVEL    = 500;    // px of scroll to fully shrink
  var PERIOD    = 1400;   // px of scroll per walk lap

  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var lastFartAt = 0;
  var bottomDone = false;
  var queued = false;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function frame() {
    queued = false;
    var s = window.pageYOffset || document.documentElement.scrollTop;
    var p = clamp(s / TRAVEL, 0, 1);

    var heroSize = Math.min(HERO_MAX, vw * 0.76);
    var size = heroSize + (WALK_SIZE - heroSize) * p;

    // travels right, turns at the edge, travels back
    var u = (s % PERIOD) / PERIOD;
    var tri = u < 0.5 ? u * 2 : 2 - u * 2;
    var walkX = 16 + tri * Math.max(0, vw - size - 32);
    var heroX = (vw - size) / 2;
    var x = heroX + (walkX - heroX) * p;

    var heroY = 104;
    var walkY = vh - size - 24;
    var y = heroY + (walkY - heroY) * p;

    var bob    = Math.sin(s / 38) * 9 * p;
    var rot    = Math.sin(s / 55) * 6 * p;
    var squash = 1 + Math.sin(s / 38) * 0.05 * p;

    // swap drawings instead of mirroring, so the lettering stays readable
    var goingLeft = (p > 0.5 && u >= 0.5);
    faceR.classList.toggle('hidden', goingLeft);
    faceL.classList.toggle('hidden', !goingLeft);

    mascot.style.width = size + 'px';
    mascot.style.transform = reduced
      ? 'translate3d(' + x + 'px,' + y + 'px,0)'
      : 'translate3d(' + x + 'px,' + (y + bob) + 'px,0) ' +
        'rotate(' + rot + 'deg) scaleY(' + squash + ')';

    // one out every so often while walking
    if (p > 0.55 && Math.abs(s - lastFartAt) > 320) {
      lastFartAt = s;
      if (Math.random() < 0.55) rip('medium', 3);
    }

    // the payoff at the very bottom
    var docH = document.documentElement.scrollHeight;
    var atBottom = (s + vh) >= (docH - 6);
    if (atBottom && !bottomDone) {
      bottomDone = true;
      rip('shortnsweet', 7);
    } else if (!atBottom && (s + vh) < (docH - 160)) {
      bottomDone = false;      // rearm once they scroll back up
    }
  }

  function onScroll() {
    if (!queued) { queued = true; requestAnimationFrame(frame); }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    vw = window.innerWidth; vh = window.innerHeight; onScroll();
  });

  /* ---------- fart on nav clicks ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var r = a.getBoundingClientRect();
    puff(r.left + r.width / 2, r.top + r.height / 2, 4);
    rip('medium', 3);
  });

  frame();
})();
