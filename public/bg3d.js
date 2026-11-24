/**
 * Ahmad Web & Automation — 3D "AI Agency" Background Layer
 * Procedural WebGL layer sitting behind sections after Hero.
 * Driven by GSAP ScrollTrigger + Lenis smooth scroll on a unified clock.
 */

// =============================================================================
// EASY TWEAK SETTINGS (Adjust colors, speeds, brightness & particles here)
// =============================================================================
const CONFIG_3D = {
  // Palette: Pearl white, violet, pink, and warm amber glow
  COLORS: {
    pearl: 0xF4F0FF,           // Main glossy pearl material
    violet: 0x7C6CF0,          // Accent violet for tubes, emissive rims & lights
    pink: 0xE056C1,            // Accent pink for reflections & blooms
    amber: 0xFFB36B,           // Warm amber glow for cores, pulses & sunrise
    amberGlow: 0xFFA048,       // Intense amber emissive core
    lavenderLight: 0xEDEBFF,   // Ambient hemisphere ground tone
    bgFog: 0xEDEBFF            // Soft atmospheric distance fog
  },

  // Motion & Speed (Multipliers; set lower for gentler motion, higher for faster)
  SPEED: {
    idle: 1.0,                 // Base rotation speed multiplier (0.10 to 0.25 rad/s)
    pulses: 1.0,               // Speed of glowing data pulses traveling along tubes
    parallax: 0.05,            // Mouse parallax lerp smoothness factor
    maxParallax: 0.40          // Maximum mouse parallax shift in 3D units
  },

  // Particle Counts (Lightweight, well under triangle budgets)
  PARTICLE_COUNT: {
    dust: 120,                 // Shared dust particles along camera path
    calmField: 1200,           // Scene 4 calm space particle field (desktop)
    calmFieldMobile: 450       // Scene 4 calm space particle field (mobile)
  },

  // Device Pixel Ratio caps for high-DPI screens
  DPR_MAX: {
    desktop: 1.75,
    mobile: 1.25
  },

  // Soft readability veil opacity (0.25 to 0.40) over the 3D layer
  VEIL_OPACITY: 0.32,

  // Scene Brightness & Light Intensities
  BRIGHTNESS: {
    exposure: 1.05,            // ACESFilmic tone mapping exposure
    hemisphere: 0.90,          // Ambient hemisphere light (white & lavender)
    directional: 1.10,         // Main soft key directional light
    amberPoint: 1.40,          // Warm amber point light
    pinkPoint: 1.20            // Soft pink point light
  }
};

(function init3DBackground() {
  'use strict';

  // 1. Hardware & Capability Checks
  if (typeof window === 'undefined' || !window.THREE) return;

  const isMobile = window.innerWidth < 768;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Skip 3D if WebGL is unavailable or low-spec device (<= 2 CPU threads)
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
    console.info('3D Background skipped: low concurrency device fallback.');
    return;
  }

  // Check WebGL support
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      console.info('3D Background skipped: WebGL unsupported.');
      return;
    }
  } catch (e) {
    return;
  }

  // Defer initialization until browser idle / first paint complete
  const scheduleInit = window.requestIdleCallback || function (cb) { setTimeout(cb, 120); };
  scheduleInit(setupScene);

  function setupScene() {
    const canvas = document.getElementById('bg3dCanvas');
    const veil = document.getElementById('bg3dVeil');
    if (!canvas) return;

    // Apply veil opacity from config
    if (veil) {
      veil.style.setProperty('--veil-opacity', CONFIG_3D.VEIL_OPACITY);
    }

    // -------------------------------------------------------------------------
    // 2. Renderer Setup
    // -------------------------------------------------------------------------
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (err) {
      console.warn('WebGLRenderer init failed:', err);
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = CONFIG_3D.BRIGHTNESS.exposure;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = false;

    const maxDpr = isMobile ? CONFIG_3D.DPR_MAX.mobile : CONFIG_3D.DPR_MAX.desktop;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // -------------------------------------------------------------------------
    // 3. Scene & Camera Setup
    // -------------------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(CONFIG_3D.COLORS.bgFog, 12, 45);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 80);
    camera.position.set(0, 0.5, 14);

    // -------------------------------------------------------------------------
    // 4. Procedural Environment Map (PMREMGenerator for soft pearl reflections)
    // -------------------------------------------------------------------------
    try {
      const envCanvas = document.createElement('canvas');
      envCanvas.width = 128;
      envCanvas.height = 64;
      const envCtx = envCanvas.getContext('2d');
      const envGrad = envCtx.createLinearGradient(0, 0, 0, 64);
      envGrad.addColorStop(0, '#FFFFFF');
      envGrad.addColorStop(0.35, '#F6F3FF');
      envGrad.addColorStop(0.7, '#ECE7FE');
      envGrad.addColorStop(1, '#F8EEFB');
      envCtx.fillStyle = envGrad;
      envCtx.fillRect(0, 0, 128, 64);

      // Warm radial spot on top left
      const spot1 = envCtx.createRadialGradient(32, 20, 0, 32, 20, 36);
      spot1.addColorStop(0, 'rgba(255, 215, 175, 0.55)');
      spot1.addColorStop(1, 'rgba(255, 215, 175, 0)');
      envCtx.fillStyle = spot1;
      envCtx.fillRect(0, 0, 64, 64);

      // Pink radial spot on bottom right
      const spot2 = envCtx.createRadialGradient(96, 42, 0, 96, 42, 38);
      spot2.addColorStop(0, 'rgba(224, 86, 193, 0.35)');
      spot2.addColorStop(1, 'rgba(224, 86, 193, 0)');
      envCtx.fillStyle = spot2;
      envCtx.fillRect(64, 0, 64, 64);

      const envTexture = new THREE.CanvasTexture(envCanvas);
      envTexture.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      scene.environment = pmrem.fromEquirectangular(envTexture).texture;
      pmrem.dispose();
      envTexture.dispose();
    } catch (e) {
      // Fallback gracefully without procedural envMap
    }

    // -------------------------------------------------------------------------
    // 5. Lighting
    // -------------------------------------------------------------------------
    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, CONFIG_3D.COLORS.lavenderLight, CONFIG_3D.BRIGHTNESS.hemisphere);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xFFFFFF, CONFIG_3D.BRIGHTNESS.directional);
    dirLight.position.set(5, 12, 8);
    scene.add(dirLight);

    const amberLight = new THREE.PointLight(CONFIG_3D.COLORS.amber, CONFIG_3D.BRIGHTNESS.amberPoint, 35, 1.8);
    amberLight.position.set(-6, 3, 4);
    scene.add(amberLight);

    const pinkLight = new THREE.PointLight(CONFIG_3D.COLORS.pink, CONFIG_3D.BRIGHTNESS.pinkPoint, 35, 1.8);
    pinkLight.position.set(6, -2, -14);
    scene.add(pinkLight);

    // -------------------------------------------------------------------------
    // 6. Materials
    // -------------------------------------------------------------------------
    // Shared Pearl Material (MeshPhysicalMaterial with clearcoat & iridescence)
    const pearlMaterial = new THREE.MeshPhysicalMaterial({
      color: CONFIG_3D.COLORS.pearl,
      roughness: 0.18,
      metalness: 0.10,
      clearcoat: 1.0,
      clearcoatRoughness: 0.15,
      iridescence: 0.60,
      iridescenceIOR: 1.30,
      transparent: true,
      opacity: 0.98
    });

    // Amber glowing core material
    const amberGlowMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG_3D.COLORS.amberGlow,
      transparent: true,
      opacity: 0.85
    });

    // Soft glass panel material
    const glassPanelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      roughness: 0.14,
      metalness: 0.05,
      clearcoat: 0.95,
      clearcoatRoughness: 0.10,
      transparent: true,
      opacity: 0.50,
      emissive: CONFIG_3D.COLORS.violet,
      emissiveIntensity: 0.12
    });

    // -------------------------------------------------------------------------
    // 7. Circular Soft Glow Texture for Particles
    // -------------------------------------------------------------------------
    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = 32;
    dotCanvas.height = 32;
    const dotCtx = dotCanvas.getContext('2d');
    const dotGrad = dotCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    dotGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    dotGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.7)');
    dotGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    dotCtx.fillStyle = dotGrad;
    dotCtx.fillRect(0, 0, 32, 32);
    const particleTexture = new THREE.CanvasTexture(dotCanvas);

    // -------------------------------------------------------------------------
    // 8. The 5 Scenes (Positioned along the scroll path)
    // -------------------------------------------------------------------------
    const sceneGroups = [];

    // Helper: Mark base opacity on children so easing in/out works cleanly
    function registerSceneGroup(group, pCenter, pRange) {
      group.userData = { pCenter, pRange };
      group.traverse(child => {
        if (child.isMesh && child.material) {
          child.userData.baseOpacity = child.material.opacity !== undefined ? child.material.opacity : 1.0;
        }
      });
      scene.add(group);
      sceneGroups.push(group);
      return group;
    }

    // -------------------------------------------------------------------------
    // SCENE 1: Services (p ~ 0.08 - 0.22) "Orbit"
    // Left-offset pearl orb (radius 1.4) + glowing amber core + 3 rotating rings
    // -------------------------------------------------------------------------
    const group1 = new THREE.Group();
    group1.position.set(-4.2, 0.4, 7.5);

    // Pearl central orb
    const orbGeom = new THREE.SphereGeometry(1.4, 32, 32);
    const orbMesh = new THREE.Mesh(orbGeom, pearlMaterial);
    group1.add(orbMesh);

    // Internal soft amber glowing core
    const coreGeom = new THREE.SphereGeometry(0.95, 24, 24);
    const coreMesh = new THREE.Mesh(coreGeom, amberGlowMaterial);
    group1.add(coreMesh);

    // 3 thin tilted torus rings
    const ring1Geom = new THREE.TorusGeometry(2.25, 0.032, 16, 72);
    const ring2Geom = new THREE.TorusGeometry(2.55, 0.030, 16, 72);
    const ring3Geom = new THREE.TorusGeometry(2.85, 0.026, 16, 72);

    const ringMat1 = pearlMaterial.clone();
    ringMat1.color = new THREE.Color(0xF9F7FF);
    const ringMat2 = pearlMaterial.clone();
    ringMat2.color = new THREE.Color(0xDFD8FC);
    const ringMat3 = pearlMaterial.clone();
    ringMat3.color = new THREE.Color(0xFBEAF6);

    const ring1 = new THREE.Mesh(ring1Geom, ringMat1);
    ring1.rotation.set(0.65, 0.25, 0.45);
    const ring2 = new THREE.Mesh(ring2Geom, ringMat2);
    ring2.rotation.set(-0.55, 0.70, 0.20);
    const ring3 = new THREE.Mesh(ring3Geom, ringMat3);
    ring3.rotation.set(0.35, -0.65, -0.30);

    // Tiny satellites on rings
    const satGeom = new THREE.SphereGeometry(0.14, 16, 16);
    const sat1 = new THREE.Mesh(satGeom, pearlMaterial);
    sat1.position.set(2.25, 0, 0);
    ring1.add(sat1);

    const sat2 = new THREE.Mesh(satGeom, pearlMaterial);
    sat2.position.set(-2.55, 0, 0);
    ring2.add(sat2);

    const sat3 = new THREE.Mesh(satGeom, pearlMaterial);
    sat3.position.set(0, 2.85, 0);
    ring3.add(sat3);

    group1.add(ring1);
    group1.add(ring2);
    group1.add(ring3);

    // Small framing pearl sphere on top right
    const miniSatellite = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 24), pearlMaterial);
    miniSatellite.position.set(8.8, 1.4, 0.8);
    group1.add(miniSatellite);

    registerSceneGroup(group1, 0.15, 0.14);

    // -------------------------------------------------------------------------
    // SCENE 2: How It Works (p ~ 0.22 - 0.42) "Workflow"
    // 4 pearl nodes connected by thin glowing tubes in a gentle arc, with amber pulses
    // -------------------------------------------------------------------------
    const group2 = new THREE.Group();
    group2.position.set(0, -0.6, 1.5);

    // Gentle arc curve connecting 4 nodes
    const arcPoints = [
      new THREE.Vector3(-4.4, 1.3, 0),
      new THREE.Vector3(-1.8, -0.7, 0.2),
      new THREE.Vector3(1.8, -0.7, 0.2),
      new THREE.Vector3(4.4, 1.3, 0)
    ];
    const workflowCurve = new THREE.CatmullRomCurve3(arcPoints);

    // Glowing tube geometry
    const tubeGeom = new THREE.TubeGeometry(workflowCurve, 64, 0.045, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: CONFIG_3D.COLORS.violet,
      emissive: CONFIG_3D.COLORS.violet,
      emissiveIntensity: 0.55,
      roughness: 0.3,
      transparent: true,
      opacity: 0.78
    });
    const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
    group2.add(tubeMesh);

    // 4 Pearl Spheres at the node points
    const nodeSphereGeom = new THREE.SphereGeometry(0.32, 24, 24);
    arcPoints.forEach(pt => {
      const nodeSphere = new THREE.Mesh(nodeSphereGeom, pearlMaterial);
      nodeSphere.position.copy(pt);
      group2.add(nodeSphere);
    });

    // Tiny amber pulses that continuously travel along the tubes
    const pulseCount = isMobile ? 2 : 4;
    const pulseMeshes = [];
    const pulseGeom = new THREE.SphereGeometry(0.11, 14, 14);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: CONFIG_3D.COLORS.amberGlow
    });

    for (let i = 0; i < pulseCount; i++) {
      const pulseMesh = new THREE.Mesh(pulseGeom, pulseMat);
      group2.add(pulseMesh);
      pulseMeshes.push(pulseMesh);
    }

    registerSceneGroup(group2, 0.32, 0.14);

    // -------------------------------------------------------------------------
    // SCENE 3: Work (p ~ 0.42 - 0.62) "Floating Panels"
    // 3 rounded translucent white panels at different depths/tilts + faint grid floor
    // -------------------------------------------------------------------------
    const group3 = new THREE.Group();
    group3.position.set(0, 0, -9.0);

    // Helper: Procedural rounded rectangle shape
    function createRoundedRectShape(w, h, r) {
      const s = new THREE.Shape();
      const x = -w / 2;
      const y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }

    const panelShape1 = createRoundedRectShape(2.2, 3.0, 0.28);
    const panelShape2 = createRoundedRectShape(2.0, 2.7, 0.26);
    const panelShape3 = createRoundedRectShape(1.6, 2.2, 0.22);

    const extrudeSettings = {
      depth: 0.04,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02
    };

    const panelGeom1 = new THREE.ExtrudeGeometry(panelShape1, extrudeSettings);
    const panelGeom2 = new THREE.ExtrudeGeometry(panelShape2, extrudeSettings);
    const panelGeom3 = new THREE.ExtrudeGeometry(panelShape3, extrudeSettings);

    const panel1 = new THREE.Mesh(panelGeom1, glassPanelMaterial);
    panel1.position.set(-4.3, 0.1, 0.5);
    panel1.rotation.set(-0.12, 0.22, 0.06);

    const panel2 = new THREE.Mesh(panelGeom2, glassPanelMaterial);
    panel2.position.set(4.1, 0.7, -0.6);
    panel2.rotation.set(0.14, -0.28, -0.07);

    const panel3 = new THREE.Mesh(panelGeom3, glassPanelMaterial);
    panel3.position.set(4.8, -1.1, -1.8);
    panel3.rotation.set(-0.18, -0.20, 0.10);

    // Subtle decorative accents on panels (mirrors reference mockup cards)
    const accentCubeGeom = new THREE.BoxGeometry(0.24, 0.24, 0.08);
    const accentCubeMat = new THREE.MeshStandardMaterial({
      color: CONFIG_3D.COLORS.violet,
      roughness: 0.2,
      emissive: CONFIG_3D.COLORS.violet,
      emissiveIntensity: 0.3
    });

    const cube1 = new THREE.Mesh(accentCubeGeom, accentCubeMat);
    cube1.position.set(-0.75, 1.15, 0.04);
    panel1.add(cube1);

    const cube2 = new THREE.Mesh(accentCubeGeom, accentCubeMat);
    cube2.position.set(-0.65, 1.0, 0.04);
    panel2.add(cube2);

    const cube3 = new THREE.Mesh(accentCubeGeom, accentCubeMat);
    cube3.position.set(-0.50, 0.8, 0.04);
    panel3.add(cube3);

    group3.add(panel1);
    group3.add(panel2);
    group3.add(panel3);

    // Faint grid floor beneath panels
    const gridHelper = new THREE.GridHelper(16, 16, CONFIG_3D.COLORS.violet, 0xD4CBFC);
    gridHelper.position.set(0, -2.8, -0.5);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.22;
    group3.add(gridHelper);

    registerSceneGroup(group3, 0.52, 0.14);

    // -------------------------------------------------------------------------
    // SCENE 4: Why Me + FAQ (p ~ 0.62 - 0.82) "Calm Space"
    // Iridescent pearl torus knot + soft drifting particles
    // -------------------------------------------------------------------------
    const group4 = new THREE.Group();
    group4.position.set(0, 0, -19.5);

    // Iridescent pearl torus knot placed on the right
    const knotGeom = new THREE.TorusKnotGeometry(1.35, 0.38, 96, 18, 2, 3);
    const knotMesh = new THREE.Mesh(knotGeom, pearlMaterial);
    knotMesh.position.set(4.0, 0.1, 0);
    knotMesh.rotation.set(0.4, 0.3, 0.2);
    group4.add(knotMesh);

    // Soft calm particle field (lavender, pink, and white points)
    const calmCount = isMobile ? CONFIG_3D.PARTICLE_COUNT.calmFieldMobile : CONFIG_3D.PARTICLE_COUNT.calmField;
    const calmGeom = new THREE.BufferGeometry();
    const calmPositions = new Float32Array(calmCount * 3);
    const calmColors = new Float32Array(calmCount * 3);

    const colWhite = new THREE.Color(0xFFFFFF);
    const colLavender = new THREE.Color(0xCEC6FC);
    const colPink = new THREE.Color(0xF5C7EB);

    for (let i = 0; i < calmCount; i++) {
      calmPositions[i * 3] = (Math.random() - 0.5) * 14;
      calmPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      calmPositions[i * 3 + 2] = (Math.random() - 0.5) * 9;

      const r = Math.random();
      const c = r < 0.45 ? colWhite : (r < 0.75 ? colLavender : colPink);
      calmColors[i * 3] = c.r;
      calmColors[i * 3 + 1] = c.g;
      calmColors[i * 3 + 2] = c.b;
    }

    calmGeom.setAttribute('position', new THREE.BufferAttribute(calmPositions, 3));
    calmGeom.setAttribute('color', new THREE.BufferAttribute(calmColors, 3));

    const calmMat = new THREE.PointsMaterial({
      size: 0.16,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    const calmPoints = new THREE.Points(calmGeom, calmMat);
    group4.add(calmPoints);

    registerSceneGroup(group4, 0.72, 0.14);

    // -------------------------------------------------------------------------
    // SCENE 5: Contact + Footer (p ~ 0.82 - 1.0) "Sunrise"
    // Large glowing amber-pink orb rising on the horizon + expanding ripple rings
    // -------------------------------------------------------------------------
    const group5 = new THREE.Group();
    group5.position.set(0, -3.8, -34.0);

    // Rising sunrise orb
    const sunriseGeom = new THREE.SphereGeometry(3.6, 32, 32);
    const sunriseMat = new THREE.MeshStandardMaterial({
      color: 0xFFCA8B,
      emissive: 0xFF9E58,
      emissiveIntensity: 0.75,
      roughness: 0.35,
      transparent: true,
      opacity: 0.95
    });
    const sunriseMesh = new THREE.Mesh(sunriseGeom, sunriseMat);
    group5.add(sunriseMesh);

    // Soft concentric ripple rings expanding on the horizon
    const ringMeshes = [];
    const ringRadii = [4.4, 5.3, 6.3, 7.4];
    ringRadii.forEach((rad, idx) => {
      const rippleGeom = new THREE.RingGeometry(rad, rad + 0.06, 64);
      const rippleMat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? CONFIG_3D.COLORS.amber : CONFIG_3D.COLORS.pink,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35 - idx * 0.06
      });
      const rippleMesh = new THREE.Mesh(rippleGeom, rippleMat);
      rippleMesh.rotation.x = -Math.PI / 2;
      group5.add(rippleMesh);
      ringMeshes.push({ mesh: rippleMesh, baseRadius: rad, baseOpacity: rippleMat.opacity });
    });

    registerSceneGroup(group5, 0.92, 0.14);

    // -------------------------------------------------------------------------
    // 9. Shared Path Dust Particle System (Along entire camera flight path)
    // -------------------------------------------------------------------------
    const dustCount = CONFIG_3D.PARTICLE_COUNT.dust;
    const dustGeom = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    const dustCol1 = new THREE.Color(0xFFFFFF);
    const dustCol2 = new THREE.Color(0xE3DEFC);
    const dustCol3 = new THREE.Color(0xFFE2C4);

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 12;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      dustPositions[i * 3 + 2] = 13 - Math.random() * 45; // spans z = 13 to z = -32

      const r = Math.random();
      const col = r < 0.5 ? dustCol1 : (r < 0.8 ? dustCol2 : dustCol3);
      dustColors[i * 3] = col.r;
      dustColors[i * 3 + 1] = col.g;
      dustColors[i * 3 + 2] = col.b;
    }

    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeom.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 0.12,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const dustParticles = new THREE.Points(dustGeom, dustMat);
    scene.add(dustParticles);

    // -------------------------------------------------------------------------
    // 10. Camera S-Curve Definition (8 Control Points, z = 14 to z = -30)
    // -------------------------------------------------------------------------
    const cameraCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.00, 0.50, 14.0),     // p = 0.00 (Hero bottom boundary)
      new THREE.Vector3(0.35, 0.20, 8.5),      // p = 0.14 (Services)
      new THREE.Vector3(-0.30, -0.25, 2.0),    // p = 0.28 (How it works)
      new THREE.Vector3(0.40, 0.25, -4.5),     // p = 0.42 (Transition to Work)
      new THREE.Vector3(-0.35, -0.10, -11.0),  // p = 0.56 (Work)
      new THREE.Vector3(0.30, 0.30, -17.5),    // p = 0.70 (Why me)
      new THREE.Vector3(-0.20, 0.15, -24.0),   // p = 0.84 (FAQ & AI Chat)
      new THREE.Vector3(0.00, -0.20, -30.0)    // p = 1.00 (Contact & Footer)
    ]);

    // -------------------------------------------------------------------------
    // 11. Mouse Parallax (Desktop Only)
    // -------------------------------------------------------------------------
    let mouseTargetX = 0;
    let mouseTargetY = 0;
    let mouseCurrentX = 0;
    let mouseCurrentY = 0;

    if (!isMobile && !prefersReducedMotion) {
      window.addEventListener('mousemove', (e) => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        mouseTargetX = nx * CONFIG_3D.SPEED.maxParallax;
        mouseTargetY = -ny * CONFIG_3D.SPEED.maxParallax;
      }, { passive: true });
    }

    // -------------------------------------------------------------------------
    // 12. Visibility & Render Loop Controller
    // -------------------------------------------------------------------------
    let isRendering = false;
    let isTabVisible = !document.hidden;
    let canvasOpacity = 0;
    let targetProgress = 0;
    let currentProgress = 0;
    let pulseOffset = 0;
    let lastTime = performance.now();

    function checkRenderLoop() {
      const shouldRender = isTabVisible && canvasOpacity > 0.005;
      if (shouldRender && !isRendering) {
        isRendering = true;
        lastTime = performance.now();
        requestAnimationFrame(renderLoop);
      } else if (!shouldRender && isRendering) {
        isRendering = false;
      }
    }

    document.addEventListener('visibilitychange', () => {
      isTabVisible = !document.hidden;
      checkRenderLoop();
    });

    // -------------------------------------------------------------------------
    // 13. GSAP ScrollTrigger Integration
    // -------------------------------------------------------------------------
    if (typeof window.ScrollTrigger !== 'undefined') {
      // Fade in 3D canvas & veil as hero scrolls away
      window.ScrollTrigger.create({
        trigger: '#home',
        start: 'bottom 85%',
        end: 'bottom 20%',
        scrub: true,
        onUpdate: (self) => {
          canvasOpacity = self.progress;
          canvas.style.opacity = canvasOpacity.toFixed(3);
          if (veil) {
            veil.style.opacity = (canvasOpacity * CONFIG_3D.VEIL_OPACITY).toFixed(3);
          }
          checkRenderLoop();
        }
      });

      // Camera flight progress (p = 0 to 1) over all sections after hero
      window.ScrollTrigger.create({
        trigger: '#services',
        endTrigger: 'footer',
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => {
          targetProgress = self.progress;
          if (prefersReducedMotion) {
            currentProgress = targetProgress;
            updateCameraAndScenes(0);
            renderer.render(scene, camera);
          }
        }
      });
    }

    // -------------------------------------------------------------------------
    // 14. Camera & Scene Group Interpolation
    // -------------------------------------------------------------------------
    function updateCameraAndScenes(delta) {
      if (!prefersReducedMotion) {
        currentProgress += (targetProgress - currentProgress) * 0.12;
      }

      const pClamped = Math.max(0, Math.min(1, currentProgress));

      // Camera Position on S-Curve
      const curvePt = cameraCurve.getPointAt(pClamped);

      // Mouse Parallax Lerp
      if (!isMobile && !prefersReducedMotion) {
        mouseCurrentX += (mouseTargetX - mouseCurrentX) * CONFIG_3D.SPEED.parallax;
        mouseCurrentY += (mouseTargetY - mouseCurrentY) * CONFIG_3D.SPEED.parallax;
      } else {
        mouseCurrentX = 0;
        mouseCurrentY = 0;
      }

      camera.position.set(
        curvePt.x + mouseCurrentX,
        curvePt.y + mouseCurrentY,
        curvePt.z
      );

      // Look slightly forward along the path
      const lookAtP = Math.min(pClamped + 0.035, 1.0);
      const lookTarget = cameraCurve.getPointAt(lookAtP);
      camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z);

      // Easing in/out per scene group based on distance to camera
      sceneGroups.forEach(grp => {
        const dist = Math.abs(pClamped - grp.userData.pCenter);
        let weight = 1 - Math.min(dist / grp.userData.pRange, 1);
        // Smoothstep easing
        weight = weight * weight * (3 - 2 * weight);

        grp.scale.setScalar(0.85 + 0.15 * weight);

        grp.traverse(child => {
          if (child.isMesh && child.material && child.userData.baseOpacity !== undefined) {
            child.material.opacity = child.userData.baseOpacity * (0.05 + 0.95 * weight);
          }
        });
      });
    }

    // -------------------------------------------------------------------------
    // 15. Animation Render Loop
    // -------------------------------------------------------------------------
    function renderLoop(time) {
      if (!isRendering) return;

      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const idleSpeed = CONFIG_3D.SPEED.idle;

      if (!prefersReducedMotion) {
        // Scene 1: Orbit idle rotation
        ring1.rotation.z += 0.18 * idleSpeed * delta;
        ring2.rotation.y += 0.15 * idleSpeed * delta;
        ring3.rotation.x += 0.12 * idleSpeed * delta;
        orbMesh.rotation.y += 0.08 * idleSpeed * delta;

        // Scene 2: Workflow data pulses
        pulseOffset += 0.22 * CONFIG_3D.SPEED.pulses * delta;
        pulseMeshes.forEach((pulse, idx) => {
          const t = (pulseOffset + idx / pulseCount) % 1;
          const pt = workflowCurve.getPointAt(t);
          pulse.position.copy(pt);
        });

        // Scene 3: Work panels gentle floating bob
        const bob = Math.sin(time * 0.0015);
        panel1.position.y = 0.1 + bob * 0.08;
        panel2.position.y = 0.7 - bob * 0.08;
        panel3.position.y = -1.1 + bob * 0.05;

        // Scene 4: Calm space knot rotation & particle drift
        knotMesh.rotation.x += 0.12 * idleSpeed * delta;
        knotMesh.rotation.y += 0.16 * idleSpeed * delta;
        calmPoints.rotation.y += 0.03 * idleSpeed * delta;

        // Scene 5: Sunrise ripple rings slow expansion
        ringMeshes.forEach((item, i) => {
          const cycle = ((time * 0.0004 + i * 0.25) % 1);
          item.mesh.scale.setScalar(1 + cycle * 0.35);
          item.mesh.material.opacity = item.baseOpacity * (1 - cycle);
        });

        // Shared dust slow drift
        dustParticles.rotation.y += 0.015 * idleSpeed * delta;
      }

      updateCameraAndScenes(delta);
      renderer.render(scene, camera);

      if (isRendering) {
        requestAnimationFrame(renderLoop);
      }
    }

    // -------------------------------------------------------------------------
    // 16. Window Resize Handling
    // -------------------------------------------------------------------------
    function onResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      const dpr = (width < 768) ? CONFIG_3D.DPR_MAX.mobile : CONFIG_3D.DPR_MAX.desktop;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dpr));
      renderer.setSize(width, height);
    }

    window.addEventListener('resize', onResize, { passive: true });

    // Initial check
    checkRenderLoop();
  }
})();
