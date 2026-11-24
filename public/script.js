/**
 * Ahmad Web & Automation — Clean Light Pastel Studio Interactions
 * Three.js 3D Soft Violet/Blue Dots Canvas, Lenis Smooth Scroll, GSAP ScrollTrigger
 * 6-Scene Light Pastel Background Crossfade, WhatsApp Direct Connect & AI Assistant
 */

const STUDIO_CONFIG = {
  name: "Muhammad Ahmad",
  studio: "Ahmad Web & Automation",
  location: "Bahria Town, Lahore, Pakistan",
  whatsappDisplay: "+92 309 4206637",
  whatsappNumber: "923094206637",
  email: "Ahmadlifa0225@gmail.com"
};

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  // ==========================================================================
  // 1. Luxury Preloader
  // ==========================================================================
  const preloader = document.getElementById('preloader');
  const preloaderCount = document.getElementById('preloaderCount');

  if (preloader) {
    let count = 0;
    const interval = setInterval(() => {
      count += Math.floor(Math.random() * 10) + 5;
      if (count >= 100) {
        count = 100;
        clearInterval(interval);
        setTimeout(() => {
          preloader.classList.add('loaded');
        }, 150);
      }
      if (preloaderCount) {
        preloaderCount.textContent = count + '%';
      }
    }, 20);
  }

  // ==========================================================================
  // 2. Lenis Smooth Inertial Scroll
  // ==========================================================================
  let lenis = null;
  if (typeof window.Lenis !== 'undefined' && !prefersReducedMotion) {
    lenis = new window.Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95
    });
    window.lenis = lenis;

    if (typeof window.ScrollTrigger !== 'undefined' && typeof window.gsap !== 'undefined') {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  // ==========================================================================
  // 3. Scroll Progress Bar
  // ==========================================================================
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    if (docHeight > 0 && scrollProgressBar) {
      const progress = (scrollY / docHeight) * 100;
      scrollProgressBar.style.width = progress + '%';
    }
  }, { passive: true });

  // ==========================================================================
  // 4. Desktop Cursor Spotlight
  // ==========================================================================
  const cursorSpotlight = document.getElementById('cursorSpotlight');
  if (cursorSpotlight && !prefersReducedMotion && window.innerWidth > 900) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;
    let isMoving = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isMoving) {
        isMoving = true;
        requestAnimationFrame(animateSpotlight);
      }
    }, { passive: true });

    function animateSpotlight() {
      curX += (mouseX - curX) * 0.12;
      curY += (mouseY - curY) * 0.12;
      cursorSpotlight.style.transform = 'translate(' + curX.toFixed(1) + 'px, ' + curY.toFixed(1) + 'px) translate(-50%, -50%)';

      if (Math.abs(mouseX - curX) > 0.2 || Math.abs(mouseY - curY) > 0.2) {
        requestAnimationFrame(animateSpotlight);
      } else {
        isMoving = false;
      }
    }
  }

  // ==========================================================================
  // 5. Three.js Interactive 3D Soft Violet/Blue Dots Canvas (#hero-canvas)
  // Recolor: soft violet (#7C6CF0), soft blue (#60A5FA), tiny amber (#FFB36B)
  // ==========================================================================
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas && typeof window.THREE !== 'undefined' && !prefersReducedMotion) {
    try {
      const scene = new window.THREE.Scene();
      const camera = new window.THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 1000);
      camera.position.z = 180;

      const renderer = new window.THREE.WebGLRenderer({
        canvas: heroCanvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // 300 Particles Distributed in Sphere
      const particleCount = 300;
      const geometry = new window.THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      const colorViolet = new window.THREE.Color(0x7C6CF0);
      const colorBlue = new window.THREE.Color(0x60A5FA);
      const colorAmber = new window.THREE.Color(0xFFB36B);

      for (let i = 0; i < particleCount; i++) {
        const radius = 60 + Math.random() * 55;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        // 55% violet, 35% blue, 10% amber
        const rand = Math.random();
        const mixedColor = rand < 0.55 ? colorViolet : (rand < 0.90 ? colorBlue : colorAmber);
        colors[i * 3] = mixedColor.r;
        colors[i * 3 + 1] = mixedColor.g;
        colors[i * 3 + 2] = mixedColor.b;
      }

      geometry.setAttribute('position', new window.THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new window.THREE.BufferAttribute(colors, 3));

      // Circular Soft Glow Alpha Texture
      const particleCanvas = document.createElement('canvas');
      particleCanvas.width = 32;
      particleCanvas.height = 32;
      const pCtx = particleCanvas.getContext('2d');
      const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      pGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      pGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
      pGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      pCtx.fillStyle = pGrad;
      pCtx.fillRect(0, 0, 32, 32);
      const particleTexture = new window.THREE.CanvasTexture(particleCanvas);

      // Point Cloud
      const pointMaterial = new window.THREE.PointsMaterial({
        size: 3.4,
        map: particleTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.88,
        blending: window.THREE.NormalBlending,
        depthWrite: false
      });
      const pointCloud = new window.THREE.Points(geometry, pointMaterial);
      scene.add(pointCloud);

      // Soft Violet Connecting Lines
      const lineMaterial = new window.THREE.LineBasicMaterial({
        color: 0x7C6CF0,
        transparent: true,
        opacity: 0.14,
        blending: window.THREE.NormalBlending
      });
      const lineGeometry = new window.THREE.BufferGeometry();
      const linePositions = new Float32Array(particleCount * particleCount * 3);
      lineGeometry.setAttribute('position', new window.THREE.BufferAttribute(linePositions, 3));
      const lineMesh = new window.THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(lineMesh);

      // Mouse Parallax
      let targetRotX = 0;
      let targetRotY = 0;
      let windowHalfX = window.innerWidth / 2;
      let windowHalfY = window.innerHeight / 2;

      window.addEventListener('mousemove', (e) => {
        targetRotX = (e.clientX - windowHalfX) * 0.00045;
        targetRotY = (e.clientY - windowHalfY) * 0.00045;
      }, { passive: true });

      window.addEventListener('resize', () => {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      function render3D() {
        requestAnimationFrame(render3D);

        pointCloud.rotation.y += 0.0016 + (targetRotX - pointCloud.rotation.y) * 0.04;
        pointCloud.rotation.x += 0.0010 + (targetRotY - pointCloud.rotation.x) * 0.04;
        lineMesh.rotation.copy(pointCloud.rotation);

        let vertexIndex = 0;
        const posArr = geometry.attributes.position.array;
        const linePosArr = lineGeometry.attributes.position.array;
        const maxDist = 34;

        for (let i = 0; i < particleCount; i += 2) {
          for (let j = i + 1; j < particleCount; j += 2) {
            const dx = posArr[i * 3] - posArr[j * 3];
            const dy = posArr[i * 3 + 1] - posArr[j * 3 + 1];
            const dz = posArr[i * 3 + 2] - posArr[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < maxDist && vertexIndex < 1200) {
              linePosArr[vertexIndex++] = posArr[i * 3];
              linePosArr[vertexIndex++] = posArr[i * 3 + 1];
              linePosArr[vertexIndex++] = posArr[i * 3 + 2];
              linePosArr[vertexIndex++] = posArr[j * 3];
              linePosArr[vertexIndex++] = posArr[j * 3 + 1];
              linePosArr[vertexIndex++] = posArr[j * 3 + 2];
            }
          }
        }
        lineGeometry.setDrawRange(0, vertexIndex);
        lineGeometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
      }
      render3D();
    } catch (e) {
      console.warn('Three.js canvas setup fallback:', e);
    }
  }

  // ==========================================================================
  // 6. Fixed 6-Scene Light Pastel Scroll-Driven Background Crossfade Engine
  // ==========================================================================
  const sceneElements = [
    document.getElementById('scene1'),
    document.getElementById('scene2'),
    document.getElementById('scene3'),
    document.getElementById('scene4'),
    document.getElementById('scene5'),
    document.getElementById('scene6')
  ].filter(Boolean);

  let activeSceneIdx = 0;

  function switchScene(nextIdx) {
    if (nextIdx === activeSceneIdx || nextIdx < 0 || nextIdx >= sceneElements.length) return;
    const prevScene = sceneElements[activeSceneIdx];
    const nextScene = sceneElements[nextIdx];

    if (typeof window.gsap !== 'undefined' && !prefersReducedMotion) {
      window.gsap.to(prevScene, {
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
        overwrite: true,
        onComplete: () => {
          prevScene.classList.remove('is-active');
        }
      });
      nextScene.classList.add('is-active');
      window.gsap.fromTo(nextScene, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.9, ease: 'power2.out', overwrite: true }
      );
    } else {
      prevScene.classList.remove('is-active');
      nextScene.classList.add('is-active');
    }
    activeSceneIdx = nextIdx;
  }

  // Register ScrollTriggers for the 6 scenes (~40% in view)
  if (typeof window.ScrollTrigger !== 'undefined' && sceneElements.length === 6) {
    window.ScrollTrigger.create({
      trigger: '#services',
      start: 'top 60%',
      onEnter: () => switchScene(1),
      onLeaveBack: () => switchScene(0)
    });

    window.ScrollTrigger.create({
      trigger: '#how-it-works',
      start: 'top 60%',
      onEnter: () => switchScene(2),
      onLeaveBack: () => switchScene(1)
    });

    window.ScrollTrigger.create({
      trigger: '#work',
      start: 'top 60%',
      onEnter: () => switchScene(3),
      onLeaveBack: () => switchScene(2)
    });

    window.ScrollTrigger.create({
      trigger: '#why-me',
      start: 'top 60%',
      onEnter: () => switchScene(4),
      onLeaveBack: () => switchScene(3)
    });

    window.ScrollTrigger.create({
      trigger: '#contact',
      start: 'top 60%',
      onEnter: () => switchScene(5),
      onLeaveBack: () => switchScene(4)
    });
  }

  // ==========================================================================
  // 7. Living Star Dust Canvas & Mouse Parallax Shift (Max 15px)
  // ==========================================================================
  const bgScenesViewport = document.getElementById('bgScenesViewport');
  const bgDustCanvas = document.getElementById('bgDustCanvas');

  // Mouse Parallax Shift (Clamped strictly to max 15px)
  if (bgScenesViewport && !prefersReducedMotion && window.innerWidth > 900) {
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let mouseAnimFrame = null;

    window.addEventListener('mousemove', (e) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      targetX = Math.max(-15, Math.min(15, ((e.clientX - halfW) / halfW) * 15));
      targetY = Math.max(-15, Math.min(15, ((e.clientY - halfH) / halfH) * 15));

      if (!mouseAnimFrame) {
        mouseAnimFrame = requestAnimationFrame(updateMouseShift);
      }
    }, { passive: true });

    function updateMouseShift() {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      bgScenesViewport.style.transform = 'translate3d(' + curX.toFixed(2) + 'px, ' + curY.toFixed(2) + 'px, 0)';

      if (Math.abs(targetX - curX) > 0.05 || Math.abs(targetY - curY) > 0.05) {
        mouseAnimFrame = requestAnimationFrame(updateMouseShift);
      } else {
        mouseAnimFrame = null;
      }
    }
  }

  // Pastel Star Dust (Lightweight: soft violet, blue, pink, amber particles)
  if (bgDustCanvas) {
    const ctx = bgDustCanvas.getContext('2d');
    let width = bgDustCanvas.width = window.innerWidth;
    let height = bgDustCanvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = bgDustCanvas.width = window.innerWidth;
      height = bgDustCanvas.height = window.innerHeight;
    }, { passive: true });

    const particleCount = 65;
    const particles = [];
    const colors = [
      'rgba(124, 108, 240, ',   // Soft violet
      'rgba(96, 165, 250, ',    // Soft blue
      'rgba(224, 86, 193, ',    // Pink-lilac
      'rgba(255, 179, 107, '    // Warm amber
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.8 + 0.8,
        baseAlpha: Math.random() * 0.35 + 0.15,
        speedY: Math.random() * 0.3 + 0.12,
        wobbleSpeed: Math.random() * 0.02 + 0.008,
        wobbleOffset: Math.random() * Math.PI * 2,
        colorBase: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    if (!prefersReducedMotion) {
      let dustFrame = 0;
      function renderDust() {
        dustFrame++;
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particleCount; i++) {
          const p = particles[i];
          p.y -= p.speedY;
          p.x += Math.sin(dustFrame * p.wobbleSpeed + p.wobbleOffset) * 0.22;

          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          const currentAlpha = p.baseAlpha * (0.8 + 0.2 * Math.sin(dustFrame * 0.04 + p.wobbleOffset));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.colorBase + currentAlpha.toFixed(2) + ')';
          ctx.fill();
        }

        requestAnimationFrame(renderDust);
      }
      renderDust();
    } else {
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.colorBase + p.baseAlpha.toFixed(2) + ')';
        ctx.fill();
      }
    }
  }

  // ==========================================================================
  // 8. Mobile Navigation Drawer
  // ==========================================================================
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');

  function setMobileMenu(open) {
    if (!mobileToggle || !mobileDrawer) return;
    mobileDrawer.classList.toggle('open', open);
    mobileToggle.setAttribute('aria-expanded', String(open));
    mobileToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.contains('open');
      setMobileMenu(!isOpen);
    });

    mobileDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setMobileMenu(false));
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('open')) {
        setMobileMenu(false);
        mobileToggle.focus();
      }
    });
  }

  // ==========================================================================
  // 9. Contact Form — Direct WhatsApp Connect
  // ==========================================================================
  const contactForm = document.getElementById('projectInquiryForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (document.getElementById('inquiryName')?.value || '').trim();
      const contactInfo = (document.getElementById('inquiryContact')?.value || '').trim();
      const message = (document.getElementById('inquiryMessage')?.value || '').trim();

      if (!name) {
        if (formStatus) formStatus.textContent = 'Please enter your name.';
        return;
      }

      let formattedText = 'Assalam o Alaikum Ahmad,\n\nI am contacting you from Ahmad Web & Automation regarding a project:\n';
      formattedText += '• Name: ' + name + '\n';
      if (contactInfo) formattedText += '• WhatsApp/Email: ' + contactInfo + '\n';
      if (message) formattedText += '• Message: ' + message + '\n';

      const waUrl = 'https://wa.me/' + STUDIO_CONFIG.whatsappNumber + '?text=' + encodeURIComponent(formattedText);

      if (formStatus) {
        formStatus.textContent = 'Opening WhatsApp with your project brief...';
      }

      window.open(waUrl, '_blank', 'noopener,noreferrer');
    });
  }

  // ==========================================================================
  // 10. Back to Top Action
  // ==========================================================================
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.1 });
      } else {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      }
    });
  }

  // ==========================================================================
  // PART 1: Brand Logo Bounce & Smooth Scroll to #home
  // ==========================================================================
  const logoElements = document.querySelectorAll('.brand-link');
  logoElements.forEach(logoLink => {
    logoLink.addEventListener('click', (e) => {
      const wrap = logoLink.querySelector('.brand-logo-wrap');
      if (wrap && !prefersReducedMotion) {
        wrap.classList.remove('bouncing');
        void wrap.offsetWidth; // trigger reflow
        wrap.classList.add('bouncing');
        setTimeout(() => wrap.classList.remove('bouncing'), 300);
      }
      if (logoLink.getAttribute('href') === '#home') {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(0, { duration: 1.1 });
        } else {
          window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        }
      }
    });
  });

  // ==========================================================================
  // PART 2: CTA Box & Hero Button Smooth Scroll to #ai-chat
  // ==========================================================================
  const ctaAiBox = document.getElementById('ctaAiBox');
  const ctaAiBtn = document.getElementById('ctaAiBtn');
  const heroAiChatBtn = document.getElementById('heroAiChatBtn');
  const aiChatSection = document.getElementById('ai-chat');

  function scrollToAiChat(e) {
    if (e) e.preventDefault();
    if (aiChatSection) {
      if (lenis) {
        lenis.scrollTo(aiChatSection, { duration: 1.1, offset: -80 });
      } else {
        aiChatSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
      setTimeout(() => {
        const input = document.getElementById('chatInput');
        if (input) input.focus();
      }, 500);
    }
  }

  if (ctaAiBox) {
    ctaAiBox.addEventListener('click', (e) => {
      if (e.target.closest('#ctaAiBtn')) return;
      scrollToAiChat(e);
    });
    ctaAiBox.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        scrollToAiChat(e);
      }
    });
  }

  if (ctaAiBtn) {
    ctaAiBtn.addEventListener('click', scrollToAiChat);
  }

  if (heroAiChatBtn) {
    heroAiChatBtn.addEventListener('click', scrollToAiChat);
  }

  // ==========================================================================
  // PART 2: Interactive AI Chat Assistant (Client-Side)
  // ==========================================================================
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const chatTypingIndicator = document.getElementById('chatTypingIndicator');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatChips = document.querySelectorAll('.chat-chip');

  const chatHistory = []; // max 6 messages: { role: 'user'|'model', text: '...' }

  // Allowed Emojis filter: only 😊, 🙂, ❤️, ⭐
  const ALLOWED_EMOJIS = ['😊', '🙂', '❤️', '⭐'];

  function cleanAssistantText(text) {
    if (!text) return '';
    // Strip raw markdown symbols
    let clean = text
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/`([^`]+)`/g, '$1');

    // Emoji filter: remove any emoji NOT in ALLOWED_EMOJIS
    clean = clean.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/gu, (m) => {
      return ALLOWED_EMOJIS.includes(m) ? m : '';
    });

    // Enforce at most ONE emoji in total
    let emojiSeen = 0;
    clean = clean.replace(/([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]|😊|🙂|❤️|⭐)/gu, (m) => {
      if (ALLOWED_EMOJIS.includes(m)) {
        emojiSeen++;
        return emojiSeen <= 1 ? m : '';
      }
      return '';
    });

    return clean.trim();
  }

  // Convert plain URLs to clickable links safely
  function linkify(text) {
    const esc = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return esc.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  function appendChatMessage(role, text) {
    if (!chatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg chat-msg-' + (role === 'user' ? 'user' : 'assistant');
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'chat-bubble';

    if (role === 'user') {
      bubbleDiv.textContent = text;
    } else {
      bubbleDiv.innerHTML = linkify(cleanAssistantText(text));
    }

    msgDiv.appendChild(bubbleDiv);
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function handleUserChatSubmit(messageText) {
    const text = (messageText || (chatInput ? chatInput.value : '')).trim().slice(0, 400);
    if (!text) return;

    if (chatInput) chatInput.value = '';
    if (chatSendBtn) chatSendBtn.disabled = true;

    // Render user message
    appendChatMessage('user', text);

    // Show typing indicator
    if (chatTypingIndicator) {
      chatTypingIndicator.style.display = 'inline-flex';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatHistory.slice(-6)
        })
      });

      const data = await response.json();
      const reply = data.reply || "The demo is not connected yet. Please message Ahmad on WhatsApp.";

      if (chatTypingIndicator) chatTypingIndicator.style.display = 'none';

      appendChatMessage('assistant', reply);

      // Save history
      chatHistory.push({ role: 'user', text: text });
      chatHistory.push({ role: 'model', text: reply });
      if (chatHistory.length > 6) {
        chatHistory.splice(0, chatHistory.length - 6);
      }
    } catch (err) {
      console.warn('Chat request failed:', err);
      if (chatTypingIndicator) chatTypingIndicator.style.display = 'none';
      appendChatMessage('assistant', 'The demo is not connected yet. Please message Ahmad on WhatsApp: https://wa.me/923094206637 😊');
    } finally {
      if (chatSendBtn) chatSendBtn.disabled = false;
      if (chatInput) chatInput.focus();
    }
  }

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleUserChatSubmit();
    });
  }

  // Quick Chips Click
  chatChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const msg = chip.getAttribute('data-msg');
      if (msg) {
        handleUserChatSubmit(msg);
      }
    });
  });
});
