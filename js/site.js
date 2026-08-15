(function () {
  var path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.topnav a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(function (el) { io.observe(el); });
})();

(function () {
  var lb = document.getElementById('lightbox');
  if (!lb) return;
  var lbImg = document.getElementById('lightbox-img');
  var lbCaption = document.getElementById('lightbox-caption');
  var closeBtn = lb.querySelector('.lb-close');

  function openLightbox(src, alt, caption) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    lbCaption.textContent = caption || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lb.classList.remove('open');
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.shot .media img').forEach(function (img) {
    img.addEventListener('click', function () {
      var fig = img.closest('.shot');
      var cap = fig ? fig.querySelector('figcaption') : null;
      openLightbox(img.currentSrc || img.src, img.alt, cap ? cap.textContent : '');
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
})();

(function () {
  var canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  } catch (e) {
    return;
  }
  if (!renderer) return;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  function readColor(varName, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    try { return new THREE.Color(v || fallback); } catch (e) { return new THREE.Color(fallback); }
  }

  var bgColor = readColor('--bg', '#0b1210');
  var accentColor = readColor('--accent', '#e0993f');
  var signalColor = readColor('--signal', '#5fe0c4');
  renderer.setClearColor(bgColor, 1);

  var group = new THREE.Group();
  scene.add(group);

  var COUNT = 220;
  var RADIUS = 6.5;
  var positions = new Float32Array(COUNT * 3);
  for (var i = 0; i < COUNT; i++) {
    var r = RADIUS * Math.cbrt(Math.random() * 0.6 + 0.4);
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  var pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var pointMat = new THREE.PointsMaterial({ color: signalColor, size: 0.06, transparent: true, opacity: 0.8, sizeAttenuation: true });
  var points = new THREE.Points(pointGeo, pointMat);
  group.add(points);

  var linePositions = [];
  var THRESH = 1.5;
  for (var a = 0; a < COUNT; a++) {
    for (var b = a + 1; b < COUNT; b++) {
      var dx = positions[a * 3] - positions[b * 3];
      var dy = positions[a * 3 + 1] - positions[b * 3 + 1];
      var dz = positions[a * 3 + 2] - positions[b * 3 + 2];
      var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < THRESH) {
        linePositions.push(positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]);
        linePositions.push(positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]);
      }
    }
  }
  var lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
  var lineMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.12 });
  var lines = new THREE.LineSegments(lineGeo, lineMat);
  group.add(lines);

  var mouseX = 0, mouseY = 0, curRotX = 0, curRotY = 0;
  window.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
  }, { passive: true });

  var scrollFrac = 0;
  function updateScrollFrac() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    scrollFrac = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }
  window.addEventListener('scroll', updateScrollFrac, { passive: true });

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateScrollFrac();
  });

  function syncTheme() {
    bgColor = readColor('--bg', '#0b1210');
    accentColor = readColor('--accent', '#e0993f');
    signalColor = readColor('--signal', '#5fe0c4');
    renderer.setClearColor(bgColor, 1);
    pointMat.color.copy(signalColor);
    lineMat.color.copy(accentColor);
  }
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', syncTheme);
  }
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  var clock = new THREE.Clock();

  function frame() {
    var t = clock.getElapsedTime();
    curRotX += (mouseY * 0.35 - curRotX) * 0.04;
    curRotY += (mouseX * 0.45 - curRotY) * 0.04;
    group.rotation.x = curRotX + scrollFrac * 0.55;
    group.rotation.y = t * 0.025 + curRotY;
    pointMat.opacity = 0.62 + Math.sin(t * 0.6) * 0.14;
    renderer.render(scene, camera);
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  frame();
})();
