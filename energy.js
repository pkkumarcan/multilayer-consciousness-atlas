// ==============================================================================
// Consciousness Atlas - 3D Holographic Energy Map Engine (Three.js)
// ==============================================================================

import { state, COLOR_MAP, SPINAL_CENTERS } from './state.js';

const THREE = window.THREE;
const OrbitControls = THREE.OrbitControls;

let scene, camera, renderer, controls;
let hotspots = [];
let energyParticles = [];
let isInitialized = false;
let animationFrameId = null;

// Module-level animation loop
function animate() {
  animationFrameId = requestAnimationFrame(animate);
  
  // Idle rotation of scene to highlight 3D structure
  scene.rotation.y += 0.0015;

  // Pulse hotspots glow smoothly
  const time = Date.now() * 0.003;
  hotspots.forEach(h => {
    const baseScale = h.userData.baseScale;
    const pulse = 1 + 0.15 * Math.sin(time + h.userData.level);
    h.scale.set(baseScale * pulse, baseScale * pulse, baseScale * pulse);
  });

  // Animate energy particles rising along spine
  animateEnergy(time);

  controls.update();
  renderer.render(scene, camera);
}

export function pause3DMapAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

export function init3DMap() {
  const container = document.getElementById('energy-canvas-container');
  if (!container) return;

  if (isInitialized) {
    // Handle container resize checks
    const width = container.clientWidth;
    const height = container.clientHeight || 500;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    // Resume animation loop if it was paused
    if (!animationFrameId) {
      animate();
    }
    return;
  }

  isInitialized = true;

  const width = container.clientWidth;
  const height = container.clientHeight || 500;

  // 1. Scene & Camera Setup
  scene = new THREE.Scene();
  scene.background = null; 

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 3, 20); 

  // 2. WebGL Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // 3. Orbit Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 + 0.1; // Restrict panning below "ground"
  controls.minDistance = 5;
  controls.maxDistance = 35;
  controls.target.set(0, 3, 0); // Focus orbital anchor at chest height

  // 4. Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xc4a96a, 0.8);
  dirLight1.position.set(5, 10, 7);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x7f77dd, 0.4);
  dirLight2.position.set(-5, -5, -5);
  scene.add(dirLight2);

  // 5. Abstract Wireframe Body Outline
  createWireframeBody();

  // 6. Glowing Hotspots (18 Chakras)
  createHotspots();

  // 7. Rising Energy Particles
  createEnergyParticles();

  // 8. Raycasting Click Handlers
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  renderer.domElement.addEventListener('click', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(hotspots);

    if (intersects.length > 0) {
      const clickedSphere = intersects[0].object;
      const level = clickedSphere.userData.level;
      
      // Update details panel
      update3DSidebar(level);

      // Focus camera on the hotspot
      focusOnHotspot(level);
    }
  });

  // 9. Start Animation Loop
  animate();

  // Handle Resize
  window.addEventListener('resize', () => {
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight || 500;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
}

function createWireframeBody() {
  const bodyGroup = new THREE.Group();
  
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x1d9e75,
    wireframe: true,
    transparent: true,
    opacity: 0.07
  });
  
  const spineMat = new THREE.MeshBasicMaterial({
    color: 0xc4a96a,
    wireframe: true,
    transparent: true,
    opacity: 0.22
  });

  // Head
  const headGeo = new THREE.SphereGeometry(1.2, 12, 12);
  const head = new THREE.Mesh(headGeo, wireMat);
  head.position.y = 5.5;
  bodyGroup.add(head);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.8, 8, 1, true);
  const neck = new THREE.Mesh(neckGeo, wireMat);
  neck.position.y = 4.4;
  bodyGroup.add(neck);

  // Torso
  const chestGeo = new THREE.CylinderGeometry(1.6, 1.1, 3.2, 10, 4, true);
  const chest = new THREE.Mesh(chestGeo, wireMat);
  chest.position.y = 2.4;
  bodyGroup.add(chest);

  // Pelvis
  const pelvisGeo = new THREE.CylinderGeometry(1.1, 1.3, 1.4, 8, 2, true);
  const pelvis = new THREE.Mesh(pelvisGeo, wireMat);
  pelvis.position.y = 0.1;
  bodyGroup.add(pelvis);

  // Left Arm
  const lArmGeo = new THREE.CylinderGeometry(0.3, 0.2, 3.8, 8, 2, true);
  const lArm = new THREE.Mesh(lArmGeo, wireMat);
  lArm.position.set(-1.8, 1.8, 0);
  lArm.rotation.z = Math.PI / 12;
  bodyGroup.add(lArm);

  // Right Arm
  const rArmGeo = new THREE.CylinderGeometry(0.3, 0.2, 3.8, 8, 2, true);
  const rArm = new THREE.Mesh(rArmGeo, wireMat);
  rArm.position.set(1.8, 1.8, 0);
  rArm.rotation.z = -Math.PI / 12;
  bodyGroup.add(rArm);

  // Left Leg
  const lLegGeo = new THREE.CylinderGeometry(0.5, 0.3, 5.0, 8, 3, true);
  const lLeg = new THREE.Mesh(lLegGeo, wireMat);
  lLeg.position.set(-0.7, -3.0, 0);
  bodyGroup.add(lLeg);

  // Right Leg
  const rLegGeo = new THREE.CylinderGeometry(0.5, 0.3, 5.0, 8, 3, true);
  const rLeg = new THREE.Mesh(rLegGeo, wireMat);
  rLeg.position.set(0.7, -3.0, 0);
  bodyGroup.add(rLeg);

  // Central Sushumna Nadi Axis (Spinal Channel)
  const spineGeo = new THREE.CylinderGeometry(0.05, 0.05, 11, 8, 1);
  const spine = new THREE.Mesh(spineGeo, spineMat);
  spine.position.y = 0.5;
  bodyGroup.add(spine);

  scene.add(bodyGroup);
}

function createHotspots() {
  const yCoordinates = {
    1: -5.0,
    2: -3.5,
    3: -1.8,
    4: 0.5,
    5: 2.5,
    6: 4.5,
    7: 5.5,
    8: 6.8,
    9: 8.0,
    10: 9.2,
    11: 10.4,
    12: 11.6,
    13: 12.8,
    14: 14.0,
    15: 15.2,
    16: 16.4,
    17: 17.6,
    18: 18.8
  };

  const colors = {
    1: 0xa32d2d, 
    2: 0xd66025, 
    3: 0xdfc221, 
    4: 0x2c7fb8, 
    5: 0xeceae4, 
    6: 0x7f77dd, 
    7: 0xc4a96a, 
    8: 0x7f77dd, 
    9: 0x1f9e89, 
    10: 0x3a3a3a, 
    11: 0xd66025, 
    12: 0x0f6e56, 
    13: 0x0f6e56,
    14: 0x0f6e56,
    15: 0xc4a96a, 
    16: 0x3a3a3a,
    17: 0x3a3a3a,
    18: 0xc4a96a
  };

  for (let i = 1; i <= 18; i++) {
    const y = yCoordinates[i];
    const colorHex = colors[i] || 0xc4a96a;
    const isPhysical = i <= 7;
    const radius = isPhysical ? 0.35 : 0.28;

    const hotspotGeo = new THREE.SphereGeometry(radius, 16, 16);
    const hotspotMat = new THREE.MeshPhongMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.9,
      shininess: 100
    });

    const sphere = new THREE.Mesh(hotspotGeo, hotspotMat);
    sphere.position.set(0, y, 0);
    sphere.userData = {
      level: i,
      baseScale: 1,
      yPos: y,
      color: colorHex
    };

    scene.add(sphere);
    hotspots.push(sphere);
  }
}

function createEnergyParticles() {
  const particleCount = 45;
  const geo = new THREE.SphereGeometry(0.065, 8, 8);
  
  for (let i = 0; i < particleCount; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xa32d2d, 
      transparent: true,
      opacity: 0.85
    });
    
    const p = new THREE.Mesh(geo, mat);
    
    const initialY = -5.0 + (i / particleCount) * 23.8; 
    p.position.set(0, initialY, 0);
    p.userData = {
      speed: 0.035 + Math.random() * 0.03,
      angleOffset: Math.random() * Math.PI * 2
    };
    
    scene.add(p);
    energyParticles.push(p);
  }
}

function animateEnergy(time) {
  energyParticles.forEach(p => {
    p.position.y += p.userData.speed;
    
    if (p.position.y > 18.8) {
      p.position.y = -5.0;
      p.userData.speed = 0.035 + Math.random() * 0.03;
    }
    
    // Helical spiral wrap winding upwards around spine
    const spiralRadius = 0.24 * (1 - (p.position.y + 5) / 26); 
    const angle = p.position.y * 1.6 + p.userData.angleOffset;
    p.position.x = spiralRadius * Math.sin(angle);
    p.position.z = spiralRadius * Math.cos(angle);
    
    // Transition color relative to the spiritual boundaries
    let rColor = 0xa32d2d; 
    if (p.position.y >= 5.0 && p.position.y < 6.8) {
      rColor = 0x7f77dd; 
    } else if (p.position.y >= 6.8 && p.position.y < 11.6) {
      rColor = 0xdfc221; 
    } else if (p.position.y >= 11.6) {
      rColor = 0x0f6e56; 
    }
    
    p.material.color.setHex(rColor);
  });
}

export function focusOnHotspot(level) {
  const targetSphere = hotspots.find(h => h.userData.level === level);
  if (!targetSphere) return;

  const yTarget = targetSphere.position.y;
  
  // Smooth glide focus transition
  const duration = 750; 
  const startCameraY = camera.position.y;
  const startTargetY = controls.target.y;
  const startTime = performance.now();

  function glide(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    
    camera.position.y = startCameraY + (yTarget + 2.5 - startCameraY) * ease;
    controls.target.y = startTargetY + (yTarget - startTargetY) * ease;
    
    if (progress < 1) {
      requestAnimationFrame(glide);
    }
  }
  requestAnimationFrame(glide);
}

export function update3DSidebar(level) {
  const sidebar = document.getElementById('energy-sidebar-content');
  if (!sidebar) return;

  const floor = state.floorsDB[`floor_${level}`];
  if (!floor) {
    sidebar.innerHTML = `
      <div style="text-align: center; color: var(--muted); padding-top: 6rem; font-style: italic;">
        Level ${level} Data Scaffolding...
      </div>
    `;
    return;
  }

  const rawColor = floor.canonical.petals?.color || 'white';
  const activeColor = COLOR_MAP[rawColor.toLowerCase()] || rawColor;

  sidebar.innerHTML = `
    <div style="animation: fadeUp 0.3s ease forwards;">
      <div class="energy-detail-title" style="color: ${activeColor};">${floor.canonical_name}</div>
      <div class="energy-detail-subtitle">${floor.sanskrit_name}</div>
      
      <div class="energy-detail-row">
        <span class="energy-detail-label">Level Scale</span>
        <span class="energy-detail-value">Floor ${level} / 18</span>
      </div>
      <div class="energy-detail-row">
        <span class="energy-detail-label">Cosmic Realm</span>
        <span class="energy-detail-value" style="color: ${activeColor}; font-weight: 600;">${floor.classification.realm}</span>
      </div>
      <div class="energy-detail-row">
        <span class="energy-detail-label">Presiding Lord</span>
        <span class="energy-detail-value"><strong>${floor.canonical.ruler}</strong></span>
      </div>
      <div class="energy-detail-row">
        <span class="energy-detail-label">Esoteric Sound</span>
        <span class="energy-detail-value">${floor.canonical.sound.split('(')[0]}</span>
      </div>
      <div class="energy-detail-row">
        <span class="energy-detail-label">Seed Mantra</span>
        <span class="energy-detail-value" style="color: ${activeColor}; font-family: var(--font-serif); font-size: 15px; font-weight: 600;">${floor.canonical.mantra || 'None'}</span>
      </div>
      <div class="energy-detail-row">
        <span class="energy-detail-label">Anatomical Center</span>
        <span class="energy-detail-value" style="font-size: 11px;">${SPINAL_CENTERS[level] || 'Transcendent Axis'}</span>
      </div>
      <div class="energy-detail-row">
        <span class="energy-detail-label">Brain Region</span>
        <span class="energy-detail-value" style="font-size: 11px;">${floor.science?.neuroscience?.regions?.[0] || 'Transcendent'}</span>
      </div>

      <div class="energy-teachings-box">
        <strong>Presiding Description &amp; Union:</strong>
        <p style="margin-top: 6px; font-size: 12.5px; line-height: 1.5; color: #a4a29c;">
          ${floor.canonical.teachings ? floor.canonical.teachings.split('.')[0] + '.' : 'Accessing higher causal states of attributeless spiritual absorption.'}
        </p>
      </div>

      <button class="energy-go-btn" style="width: 100%;" onclick="selectFloor(${level})">Go to Floor view</button>
    </div>
  `;
}
