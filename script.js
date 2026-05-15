/* ============================================================
   Spark landing — interactivity
   - Three.js heart particle field in the hero
   - IntersectionObserver-driven reveal animations
   - Scroll-driven parallax on tagged elements
   - Count-up animation on stats once they enter the viewport
   - DOM-only floating hearts in the Smart Match section
   ============================================================ */

(function () {
  'use strict';

  /* --------------------------------------------------------
     Reduced-motion respect — short-circuit anything fancy.
     Users who set the OS preference get a clean static page;
     content stays accessible.
     -------------------------------------------------------- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------
     Footer year stamp — small, but every time you forget it
     someone notices.
     -------------------------------------------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* --------------------------------------------------------
     Reveal-on-scroll — adds .is-visible to .reveal elements
     when they enter the viewport. CSS handles the actual
     fade + slide. One-shot per element so we don't replay
     animations every scroll-back.
     -------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    // Fallback: just show everything.
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* --------------------------------------------------------
     Parallax — translates [data-parallax] elements vertically
     based on scroll position. Coefficient is the "speed"
     relative to the page (positive = slower than scroll,
     negative = opposite direction, both feel "depthy").
     rAF-throttled so we never block the scroll thread.
     -------------------------------------------------------- */
  const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
  if (parallaxEls.length && !prefersReducedMotion) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const vh = window.innerHeight;
        parallaxEls.forEach((el) => {
          const rect = el.getBoundingClientRect();
          // Only translate while the element is actually near the
          // viewport — saves the cost of styling off-screen nodes.
          if (rect.bottom < -200 || rect.top > vh + 200) return;
          const coef = parseFloat(el.dataset.parallax) || 0.1;
          const offset = (rect.top + rect.height / 2 - vh / 2) * coef * -1;
          el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        });
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* --------------------------------------------------------
     Count-up stats — animates [data-count] from 0 to the
     target when the stat block enters the viewport. Suffix
     ("k+") displays after the number; intermediate values
     are formatted with thousands separators.
     -------------------------------------------------------- */
  const countEls = document.querySelectorAll('[data-count]');
  const formatNum = (n, suffix) => {
    if (suffix === 'k+') {
      // Display thousands as "Xk+" once we cross 1k.
      const k = Math.floor(n / 1000);
      return k > 0 ? `${k}k+` : String(Math.floor(n));
    }
    return Math.floor(n).toLocaleString('en-US');
  };
  if ('IntersectionObserver' in window && countEls.length && !prefersReducedMotion) {
    const countIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || '';
          const duration = 1600;
          const start = performance.now();
          const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            // Ease-out cubic — fast at first, settles into the final value.
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = formatNum(target * eased, suffix);
            if (t < 1) requestAnimationFrame(tick);
            else el.textContent = suffix === 'k+'
              ? `${Math.floor(target / 1000)}k+`
              : target.toLocaleString('en-US');
          };
          requestAnimationFrame(tick);
          countIo.unobserve(el);
        });
      },
      { threshold: 0.4 },
    );
    countEls.forEach((el) => countIo.observe(el));
  } else {
    countEls.forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      el.textContent = suffix === 'k+'
        ? `${Math.floor(target / 1000)}k+`
        : target.toLocaleString('en-US');
    });
  }

  /* --------------------------------------------------------
     Smart Match — DOM-only floating hearts. Cheaper than
     spinning up another Three.js scene in the middle of the
     page. Each heart spawns at the bottom-left of the gap
     between the two phones and drifts up with a slight horizontal
     wobble. Capped at 14 hearts on screen at once.
     -------------------------------------------------------- */
  const heartsHost = document.getElementById('smart-hearts');
  if (heartsHost && !prefersReducedMotion) {
    const MAX_HEARTS = 14;
    const SPAWN_INTERVAL_MS = 700;
    const HEART_LIFETIME_MS = 5500;
    let alive = 0;

    // Pause spawn when the section isn't on screen — no point
    // animating hidden DOM nodes.
    let visible = false;
    const visibilityIo = new IntersectionObserver(
      (entries) => entries.forEach((e) => { visible = e.isIntersecting; }),
      { threshold: 0.1 },
    );
    visibilityIo.observe(heartsHost);

    const spawn = () => {
      if (!visible || alive >= MAX_HEARTS) return;
      alive++;
      const heart = document.createElement('span');
      heart.textContent = '♥';
      const startX = 30 + Math.random() * (heartsHost.clientWidth - 60);
      const driftX = (Math.random() - 0.5) * 60;
      const size = 14 + Math.random() * 18;
      const opacity = 0.55 + Math.random() * 0.35;
      const duration = HEART_LIFETIME_MS - 1000 + Math.random() * 2000;
      heart.style.cssText = `
        position: absolute;
        left: ${startX}px;
        bottom: -10px;
        font-size: ${size}px;
        color: #fd297b;
        opacity: 0;
        text-shadow: 0 4px 12px rgba(253, 41, 123, 0.4);
        pointer-events: none;
        will-change: transform, opacity;
        animation: heartRise ${duration}ms ease-out forwards;
        --drift: ${driftX}px;
        --peak-opacity: ${opacity};
      `;
      heartsHost.appendChild(heart);
      setTimeout(() => {
        heart.remove();
        alive--;
      }, duration);
    };

    setInterval(spawn, SPAWN_INTERVAL_MS);

    // Inject the keyframes once. Putting it in JS keeps the CSS
    // file uncluttered with single-use animations.
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      @keyframes heartRise {
        0%   { transform: translate(0, 0) scale(0.5); opacity: 0; }
        15%  { opacity: var(--peak-opacity); transform: translate(0, -10px) scale(1); }
        85%  { opacity: var(--peak-opacity); }
        100% { transform: translate(var(--drift), -360px) scale(0.6); opacity: 0; }
      }
    `;
    document.head.appendChild(styleTag);
  }

  /* --------------------------------------------------------
     Watch-intro stub — placeholder click handler so the button
     feels reactive even before a real video URL is wired in.
     Replace with a modal / external link when you have a real
     intro video to show.
     -------------------------------------------------------- */
  const watchBtn = document.getElementById('watchIntro');
  if (watchBtn) {
    watchBtn.addEventListener('click', () => {
      console.info('[spark-landing] intro-video CTA tapped — wire to real video.');
    });
  }

  /* --------------------------------------------------------
     THREE.JS HERO PARTICLE FIELD
     A drifting cloud of small heart sprites in the hero
     background. Parallax-feel via per-particle z-depth and
     the camera's slow orbital sway. Renders at full DPR up
     to 2x; bounded above that to keep mobile GPUs happy.
     -------------------------------------------------------- */
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas && typeof THREE !== 'undefined' && !prefersReducedMotion) {
    initHeroScene(heroCanvas);
  }

  function initHeroScene(canvas) {
    const scene = new THREE.Scene();

    const heroEl = canvas.parentElement;
    const initialW = heroEl.clientWidth;
    const initialH = heroEl.clientHeight;

    const camera = new THREE.PerspectiveCamera(70, initialW / initialH, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initialW, initialH, false);

    // Pre-rasterise a heart sprite into a small canvas → upload
    // once as a texture. Way cheaper than custom shaders, and
    // renders the same on every device.
    const heartTex = makeHeartTexture();

    const PARTICLE_COUNT = 140;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes     = new Float32Array(PARTICLE_COUNT);
    // Per-particle velocity + phase so each heart drifts
    // independently. Stored on a parallel Float32Array (not
    // BufferAttribute) because we mutate them per-frame.
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const phases     = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * 90;
      positions[i3 + 1] = (Math.random() - 0.5) * 60;
      positions[i3 + 2] = (Math.random() - 0.5) * 60;
      sizes[i]          = 1.5 + Math.random() * 3.5;

      velocities[i3]     = (Math.random() - 0.5) * 0.04;
      velocities[i3 + 1] = 0.04 + Math.random() * 0.06; // upward drift
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      map: heartTex,
      size: 4,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: new THREE.Color('#fd297b'),
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Pointer-tracked subtle camera sway. The canvas is
    // pointer-events:none so the listener has to live on the
    // hero parent or the window.
    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (ev) => {
      const x = ev.clientX || (ev.touches && ev.touches[0] && ev.touches[0].clientX) || 0;
      const y = ev.clientY || (ev.touches && ev.touches[0] && ev.touches[0].clientY) || 0;
      pointerX = (x / window.innerWidth) * 2 - 1;
      pointerY = (y / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    // Resize handler — re-fits the canvas to the hero box on
    // window changes (rotation, dev-tools open, etc.). Debounced
    // implicitly by the resize event itself; rAF-batched for
    // good measure.
    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        const w = heroEl.clientWidth;
        const h = heroEl.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      });
    };
    window.addEventListener('resize', onResize);

    // Pause render when hero is off-screen — at the bottom of a
    // long page the GPU shouldn't be drawing 140 invisible hearts.
    let heroVisible = true;
    const heroIo = new IntersectionObserver(
      (entries) => entries.forEach((e) => { heroVisible = e.isIntersecting; }),
      { threshold: 0 },
    );
    heroIo.observe(heroEl);

    let frame = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      if (!heroVisible) return;
      frame++;

      const posAttr = geometry.attributes.position;
      const arr = posAttr.array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        // Drift up, with a sine wobble on X for organic motion.
        arr[i3]     += velocities[i3]     + Math.sin(frame * 0.005 + phases[i]) * 0.02;
        arr[i3 + 1] += velocities[i3 + 1];
        arr[i3 + 2] += velocities[i3 + 2];

        // Wrap: when a heart drifts off the top, respawn at the
        // bottom with a new X. Avoids growing the bounds infinitely
        // and keeps the cloud density visually constant.
        if (arr[i3 + 1] > 35) {
          arr[i3]     = (Math.random() - 0.5) * 90;
          arr[i3 + 1] = -35;
          arr[i3 + 2] = (Math.random() - 0.5) * 60;
        }
      }
      posAttr.needsUpdate = true;

      // Camera ease toward the pointer — gentle (0.04) so it
      // never feels twitchy.
      camera.position.x += (pointerX * 4 - camera.position.x) * 0.04;
      camera.position.y += (-pointerY * 4 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();
  }

  /* --------------------------------------------------------
     Build a heart sprite texture procedurally. Two arcs +
     a triangle tip, soft-glow stroke, transparent background.
     Reused as the texture for every Three.js point — one
     texture upload, hundreds of particles.
     -------------------------------------------------------- */
  function makeHeartTexture() {
    const size = 64;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');

    ctx.translate(size / 2, size / 2);
    const s = size * 0.36;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.85);
    ctx.bezierCurveTo( s * 1.3, s * 0.1,  s * 0.9, -s * 0.95,  0, -s * 0.25);
    ctx.bezierCurveTo(-s * 0.9, -s * 0.95, -s * 1.3, s * 0.1,  0,  s * 0.85);
    ctx.closePath();

    // Radial fill makes the sprite look slightly luminous when
    // additively blended in the scene.
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, s);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.5, 'rgba(253, 41, 123, 0.85)');
    grad.addColorStop(1, 'rgba(253, 41, 123, 0)');
    ctx.fillStyle = grad;
    ctx.fill();

    const tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }
})();
