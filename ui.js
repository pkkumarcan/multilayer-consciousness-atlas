import { state, COLOR_MAP, SPINAL_CENTERS } from './state.js';
import { playCurrentSound, stopCurrentSound, isAudioPlaying, getCurrentPlayingFloor, setSynthesizerVolume } from './audio.js';
import { init3DMap, pause3DMapAnimation } from './energy.js';
import { setupGraph } from './graph.js';

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderGatewayCard(floorData) {
  const gw = floorData.gateway_experience;
  if (!gw || !gw.tapes) return '';
  
  const CONFIDENCE_COLORS = {
    "Very Strong":  { bg: "#0d2b1a", border: "#22c55e", badge: "#16a34a", text: "#4ade80" },
    "Strong":       { bg: "#0d1f2b", border: "#3b82f6", badge: "#1d4ed8", text: "#60a5fa" },
    "Approximate":  { bg: "#2b1f0d", border: "#f59e0b", badge: "#b45309", text: "#fbbf24" },
    "Speculative":  { bg: "#2b0d0d", border: "#ef4444", badge: "#b91c1c", text: "#f87171" },
  };

  const confBadge = (conf) => {
    const c = CONFIDENCE_COLORS[conf] || CONFIDENCE_COLORS["Approximate"];
    return `<span style="
      display:inline-block; padding:2px 8px; border-radius:4px;
      background:${c.badge}; color:#fff; font-size:10px;
      font-family: monospace; letter-spacing:0.05em; font-weight:600;
    ">${escapeHTML(conf)}</span>`;
  };

  const rowsHtml = gw.tapes.map(t => {
    const c = CONFIDENCE_COLORS[t.confidence] || CONFIDENCE_COLORS["Approximate"];
    return `
      <tr style="border-bottom:1px solid #1e2a1e; background:${c.bg};">
        <td style="padding:6px 8px; color:#94a3b8; font-size:11px; white-space:nowrap;">#${t.tape_num}</td>
        <td style="padding:6px 8px; color:#e2e8f0; font-size:12px; font-weight:500;">${escapeHTML(t.name)}</td>
        <td style="padding:6px 8px; color:#94a3b8; font-size:11px; white-space:nowrap;">${escapeHTML(t.wave.replace("Wave ", "W").split("–")[0].trim())}</td>
        <td style="padding:6px 8px; color:#60a5fa; font-size:11px; white-space:nowrap;">${escapeHTML(t.focus)}</td>
        <td style="padding:6px 8px; color:#c4b5fd; font-size:11px;">${escapeHTML(t.state)}</td>
        <td style="padding:6px 8px; color:#f0abfc; font-size:11px; white-space:nowrap;">${escapeHTML(t.brainwave)}</td>
        <td style="padding:6px 8px; color:#86efac; font-size:11px; white-space:nowrap;">${escapeHTML(t.hz)}</td>
        <td style="padding:6px 8px;">${confBadge(t.confidence)}</td>
      </tr>
      <tr style="background:${c.bg};">
        <td></td>
        <td colspan="7" style="padding:0 8px 8px 8px; color:#94a3b8; font-size:11px; font-style:italic; line-height:1.5;">
          ${escapeHTML(t.description)}
        </td>
      </tr>
    `;
  }).join('');

  const mapLimitHtml = gw.map_limit_note ? `
    <div style="
      margin-top:16px; padding:12px 14px;
      background:#1a0d0d; border-left:3px solid #ef4444;
      border-radius:0 6px 6px 0; font-size:12px; color:#fca5a5; line-height:1.6;
    ">
      <strong style="color:#ef4444;">⚠ Monroe's Map Limit:</strong>
      <span style="margin-left:6px;">${escapeHTML(gw.map_limit_note)}</span>
    </div>
  ` : '';

  const noTapesHtml = gw.tapes.length === 0 ? `
    <div style="
      padding:20px; text-align:center; color:#6b7280; font-style:italic; font-size:13px;
    ">
      No Gateway Experience tapes are mapped to this floor.<br>
      Monroe's system does not provide a path into this realm.
    </div>
  ` : '';

  return `
      <!-- Card Header -->
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:20px;">🎧</span>
          <div>
            <div style="color:#4ade80; font-size:13px; font-weight:600; letter-spacing:0.05em;">
              GATEWAY EXPERIENCE / MONROE INSTITUTE
            </div>
            <div style="color:#6b7280; font-size:11px; margin-top:2px;">
              ${escapeHTML(gw.epistemic_label)}
            </div>
          </div>
        </div>
        <div style="
          background:#052e16; border:1px solid #16a34a; border-radius:20px;
          padding:3px 12px; color:#4ade80; font-size:11px; font-weight:600;
        ">
          ${gw.tape_count} tape${gw.tape_count !== 1 ? 's' : ''}
        </div>
      </div>

      <!-- Divider -->
      <div style="height:1px; background: linear-gradient(90deg, #22c55e44, transparent); margin:12px 0;"></div>

      <!-- Tapes Table -->
      ${gw.tapes.length > 0 ? `
      <div style="overflow-x:auto; border-radius:6px; border:1px solid #1e3a2e;">
        <table style="width:100%; border-collapse:collapse; font-family:'DM Sans', sans-serif;">
          <thead>
            <tr style="background:#0d2318;">
              <th style="padding:8px; color:#6b7280; font-size:10px; text-align:left; font-weight:500;">#</th>
              <th style="padding:8px; color:#6b7280; font-size:10px; text-align:left; font-weight:500;">TAPE NAME</th>
              <th style="padding:8px; color:#6b7280; font-size:10px; text-align:left; font-weight:500;">WAVE</th>
              <th style="padding:8px; color:#6b7280; font-size:10px; text-align:left; font-weight:500;">FOCUS</th>
              <th style="padding:8px; color:#6b7280; font-size:10px; text-align:left; font-weight:500;">STATE</th>
              <th style="padding:8px; color:#6b7280; font-size:10px; text-align:left; font-weight:500;">BRAINWAVE</th>
              <th style="padding:8px; color:#6b7280; font-size:10px; text-align:left; font-weight:500;">Hz RANGE</th>
              <th style="padding:8px; color:#6b7280; font-size:10px; text-align:left; font-weight:500;">CONFIDENCE</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>` : noTapesHtml}

      <!-- Bridge Note -->
      <div style="
        margin-top:16px; padding:14px 16px;
        background:#0d1f12; border-left:3px solid #22c55e;
        border-radius:0 6px 6px 0; font-size:12px; color:#bbf7d0; line-height:1.7;
      ">
        <strong style="color:#4ade80; display:block; margin-bottom:6px;">⊕ Bridge Note</strong>
        ${escapeHTML(gw.bridge_note)}
      </div>

      ${mapLimitHtml}
  `;
}

export function switchView(viewName) {
  state.activeView = viewName;
  
  // Resource cleanups when navigating away from tabs
  if (viewName !== 'energy') {
    pause3DMapAnimation();
  }
  if (viewName === 'floor') {
    const floorData = state.floorsDB[`floor_${state.activeFloor}`];
    if (floorData) {
      initBreathingGuide(floorData.canonical.mantra || floorData.canonical.recitation);
    }
  } else {
    stopBreathingGuide();
  }

  if (viewName === 'graph') {
    lazyLoadGraph();
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
    
    // Quick match logic for the tab names
    const btnText = btn.textContent.toLowerCase();
    if (viewName === 'floor' && btnText.includes('floor')) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    } else if (viewName === 'matrix' && btnText.includes('matrix')) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    } else if (viewName === 'graph' && btnText.includes('graph')) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    } else if (viewName === 'sound' && btnText.includes('sound')) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    } else if (viewName === 'gallery' && (btnText.includes('gallery') || btnText.includes('cosmic') || btnText.includes('map'))) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    } else if (viewName === 'energy' && (btnText.includes('energy') || btnText.includes('3d'))) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    }
  });

  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  
  const targetPanel = document.getElementById(`view-${viewName}`);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }

  if (viewName === 'energy') {
    // Dynamic dynamic initialization on frame render
    setTimeout(init3DMap, 50);
  }

  if (viewName !== 'search') {
    document.getElementById('searchInput').value = '';
  }

  // Update browser URL hash in real-time
  updateHash();
}

function updateHash() {
  // Bypasses programmatic hash updates during routing to prevent infinite loops
  if (state.isRouting) return;

  let newHash = '';
  if (state.activeView === 'floor') {
    newHash = `#/floor/${state.activeFloor}`;
  } else {
    newHash = `#/view/${state.activeView}`;
  }
  if (window.location.hash !== newHash) {
    window.location.hash = newHash;
  }
}

export function selectFloor(floorNum) {
  if (floorNum < 1 || floorNum > 18) return;
  
  // Guard against selecting disabled/scaffolded floors
  const btn = document.getElementById(`btn-${floorNum}`);
  if (btn && btn.classList.contains('disabled-floor')) {
    return;
  }

  state.activeFloor = floorNum;

  document.querySelectorAll('.floor-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
  });
  
  const activeBtn = document.getElementById(`btn-${floorNum}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-pressed', 'true');
    activeBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  const floorData = state.floorsDB[`floor_${floorNum}`];
  if (floorData) {
    renderFloorDetails(floorData);
  } else {
    renderPlaceholderFloor(floorNum);
  }

  switchView('floor');
}

function renderFloorDetails(floor) {
  // Reset the accordion master toggle button state
  const toggleBtn = document.getElementById('accordion-toggle-btn');
  if (toggleBtn) {
    toggleBtn.textContent = 'Expand All';
    toggleBtn.setAttribute('aria-label', 'Expand all comparative lenses');
  }

  document.getElementById('detail-num').textContent = floor.classification.level;
  document.getElementById('detail-title').textContent = floor.canonical_name;
  document.getElementById('detail-sanskrit').textContent = floor.sanskrit_name;

  const progressPct = (floor.classification.level / 18) * 100;
  document.getElementById('detail-progress').style.width = `${progressPct}%`;

  const chipsContainer = document.getElementById('detail-chips');
  chipsContainer.innerHTML = '';
  
  const chips = [
    { label: 'Petals', val: floor.canonical.petals ? `${floor.canonical.petals.count} (${floor.canonical.petals.color})` : null },
    { label: 'Element', val: (() => {
        const geom = floor.canonical.geometry || '';
        if (geom.includes('representing') && geom.includes('element')) {
          return geom.split('representing')[1].split('element')[0].trim();
        }
        return 'Cosmic';
      })()
    },
    { label: 'Deity/Ruler', val: floor.canonical.ruler },
    { label: 'Mantra', val: floor.canonical.mantra },
    { label: 'Recitation', val: floor.canonical.recitation },
    { label: 'Sound', val: floor.canonical.sound },
    { label: 'Consorts', val: floor.canonical.consorts },
    { label: 'Function', val: floor.canonical.function }
  ];

  chips.forEach(c => {
    if (c.val) {
      const el = document.createElement('div');
      el.className = 'chip';
      el.innerHTML = `${escapeHTML(c.label)}: <strong>${escapeHTML(c.val)}</strong>`;
      chipsContainer.appendChild(el);
    }
  });

  // Render Premium Sacred Geometry Infographic Dashboard
  const count = floor.canonical.petals?.count || 0;
  const rawColor = floor.canonical.petals?.color || 'white';
  const activeColor = COLOR_MAP[rawColor.toLowerCase()] || rawColor;

  const defsSvg = `
    <defs>
      <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${activeColor}" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#070709" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="petalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${activeColor}" stop-opacity="0.55" />
        <stop offset="100%" stop-color="${activeColor}" stop-opacity="0.03" />
      </linearGradient>
      <linearGradient id="sunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#c4a96a" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#c4a96a" stop-opacity="0.05" />
      </linearGradient>
    </defs>
  `;

  let petalsSvg = '';
  if (count > 0) {
    if (count >= 1000) {
      // Premium dense radiating mandala geometry for infinite/massive spiritual fields (e.g. Levels 7, 12, 13, etc.)
      // Draw concentric layers of petals with varying scale, count, and opacity to avoid crashing while looking extremely detailed
      const layers = [
        { scale: 1.0, opacity: 0.25, count: 64 },
        { scale: 0.85, opacity: 0.45, count: 48 },
        { scale: 0.7, opacity: 0.6, count: 36 },
        { scale: 0.5, opacity: 0.85, count: 24 }
      ];
      
      layers.forEach((layer) => {
        const layerCount = layer.count;
        for (let i = 0; i < layerCount; i++) {
          const rotation = (i * 360) / layerCount + (layer.scale * 15);
          petalsSvg += `<path d="M 150 150 C 120 80, 135 40, 150 40 C 165 40, 180 80, 150 150" fill="url(#petalGrad)" stroke="${activeColor}" stroke-width="0.75" opacity="${layer.opacity}" transform="translate(150, 150) scale(${layer.scale}) translate(-150, -150) rotate(${rotation}, 150, 150)" />`;
        }
      });
      
      // Celestial radiating overlays to enhance the sacred geometry feel
      petalsSvg += `
        <circle cx="150" cy="150" r="120" fill="none" stroke="${activeColor}" stroke-dasharray="1,5" stroke-width="1.5" opacity="0.4" />
        <circle cx="150" cy="150" r="95" fill="none" stroke="${activeColor}" stroke-dasharray="4,4" stroke-width="1" opacity="0.3" />
      `;
    } else {
      // Normal petal loop for lower levels (up to 999 petals, e.g. 2, 4, 6, 8, 12, 16, 88)
      for (let i = 0; i < count; i++) {
        const rotation = (i * 360) / count;
        petalsSvg += `<path d="M 150 150 C 120 80, 135 40, 150 40 C 165 40, 180 80, 150 150" fill="url(#petalGrad)" stroke="${activeColor}" stroke-width="1" opacity="0.75" transform="rotate(${rotation}, 150, 150)" />`;
      }
    }
  } else {
    const rayCount = 48;
    for (let i = 0; i < rayCount; i++) {
      const rotation = (i * 360) / rayCount;
      petalsSvg += `<line x1="150" y1="150" x2="150" y2="35" stroke="url(#sunGrad)" stroke-dasharray="2,4" stroke-width="1.5" transform="rotate(${rotation}, 150, 150)" opacity="0.6" />`;
    }
    petalsSvg += `
      <circle cx="150" cy="150" r="105" fill="none" stroke="${activeColor}" stroke-dasharray="8,4" stroke-width="1" opacity="0.3" />
      <circle cx="150" cy="150" r="75" fill="none" stroke="${activeColor}" stroke-dasharray="4,2" stroke-width="1" opacity="0.5" />
    `;
  }

  const centralCircleRadius = count > 100 ? 25 : 35;
  const centerSvg = `
    <circle cx="150" cy="150" r="${centralCircleRadius}" fill="#0d0d12" stroke="${activeColor}" stroke-width="2" style="filter: drop-shadow(0 0 10px ${activeColor});" />
    <text x="150" y="156" font-family="var(--font-serif)" font-size="${count > 100 ? '14px' : '18px'}" fill="var(--text)" text-anchor="middle" font-weight="400">${escapeHTML(floor.canonical.recitation) || floor.classification.level}</text>
  `;

  // Mappings
  const physicalMapping = SPINAL_CENTERS[floor.classification.level] || 'Transcendent Spinal Axis';

  // Sensory Waveform
  let waveBars = '';
  const soundLower = (floor.canonical.sound || '').toLowerCase();
  const isSilence = soundLower.includes('silence') || soundLower.includes('quiet');
  const isThunder = soundLower.includes('thunder') || soundLower.includes('mridang');
  const isBee = soundLower.includes('bee') || soundLower.includes('buzz');
  const isFlute = soundLower.includes('flute') || soundLower.includes('bansuri');
  const isBell = soundLower.includes('bell') || soundLower.includes('gong');

  for (let j = 0; j < 24; j++) {
    let height = 4;
    if (isSilence) {
      height = 2;
    } else if (isThunder) {
      height = [20, 45, 10, 30, 40, 5, 25, 48, 15, 30, 45, 8, 38, 22, 10, 48, 12, 28, 42, 6, 20, 44, 15, 5][j % 24];
    } else if (isBee) {
      height = (j % 2 === 0) ? 22 : 8;
    } else if (isFlute) {
      height = Math.round(18 + 14 * Math.sin((j * Math.PI) / 6));
    } else if (isBell) {
      height = Math.round(10 + 20 * Math.exp(- (j % 8) / 3));
    } else {
      height = Math.round(15 + 10 * Math.sin((j * Math.PI) / 4));
    }
    waveBars += `<rect x="${j * 7 + 7}" y="${25 - height/2}" width="3.5" height="${height}" rx="1.75" fill="${activeColor}" opacity="${isSilence ? 0.25 : 0.85}" />`;
  }

  // Gauge HTML
  const realms = ['Pinda', 'Brahmanda', 'Dayal Desh', 'Secret'];
  const activeRealm = floor.classification.realm;
  const realmIndex = realms.indexOf(activeRealm);
  let realmStepsHtml = '';
  
  realms.forEach((r, idx) => {
    const isPassed = idx <= realmIndex;
    const isActive = idx === realmIndex;
    let colorClass = '';
    if (r === 'Pinda') colorClass = 'var(--color-pinda)';
    else if (r === 'Brahmanda') colorClass = 'var(--color-brahmanda)';
    else if (r === 'Dayal Desh') colorClass = 'var(--color-dayal)';
    else if (r === 'Secret') colorClass = 'var(--accent)';
    
    realmStepsHtml += `
      <div class="gauge-step ${isPassed ? 'passed' : ''} ${isActive ? 'active' : ''}" style="--step-color: ${colorClass}">
        <span class="step-dot"></span>
        <span class="step-name">${r === 'Secret' ? 'Nameless Peak' : r}</span>
      </div>
    `;
  });

  const level = floor.classification.level;
  let esotericArtHtml = '';
  if (level >= 1 && level <= 12) {
    const imgName = `assets/images/floor-${String(level).padStart(2, '0')}.png`;

    esotericArtHtml = `
      <div class="esoteric-art-frame" style="--glow-color: ${activeColor}55;">
        <img src="${imgName}" alt="Esoteric Art of ${escapeHTML(floor.canonical_name)}" class="esoteric-img" id="esotericImg">
      </div>
      <div class="visualizer-caption">Esoteric Painting (${level}${level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th'} Level) · <span style="color: var(--accent); font-weight: 500;">🔍 Zoom Artwork</span></div>
    `;
  } else {
    esotericArtHtml = `
      <div class="esoteric-art-frame">
        <div class="esoteric-placeholder">
          <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z"/></svg>
          <strong>Traditional Art Under Research</strong>
          <span style="opacity:0.65; display:block; padding:0 1rem; line-height:1.4; margin-top:4px;">Tracing primary manuscripts for authenticated visual depictions of Level ${level} realms.</span>
        </div>
      </div>
      <div class="visualizer-caption">Level ${level} Cosmic Painting</div>
    `;
  }

  const heroContainer = document.getElementById('floor-hero-visualizer');
  if (heroContainer) {
    heroContainer.innerHTML = `
      <div class="esoteric-hero-wrapper" ${level <= 12 ? 'onclick="openLightbox(\'art\')"' : ''} style="${level <= 12 ? 'cursor: zoom-in;' : ''} width: 100%; display: flex; flex-direction: column; align-items: center;">
        ${esotericArtHtml}
      </div>
    `;
  }

  const infoContainer = document.getElementById('floor-infographic');
  if (infoContainer) {
    infoContainer.innerHTML = `
      <div class="mapping-dashboard">
        
        <!-- Left Column -->
        <div class="dashboard-col">
          <div class="dashboard-section-title">Cosmic Ascension Scale</div>
          <div class="realm-gauge-container">
            ${realmStepsHtml}
          </div>

          <div class="dashboard-section-title" style="margin-top: 1.8rem;">Physio-Spiritual Mapping</div>
          <table class="dashboard-table">
            <tr>
              <th>Spiritual Axis</th>
              <td>Level ${floor.classification.level} / 18 · ${floor.classification.realm}</td>
            </tr>
            <tr>
              <th>Governing Ruler</th>
              <td><strong>${floor.canonical.ruler}</strong></td>
            </tr>
            <tr>
              <th>Anatomical Center</th>
              <td>${physicalMapping}</td>
            </tr>
            <tr>
              <th>Core Activity</th>
              <td>${floor.canonical.function || 'Spiritual Union'}</td>
            </tr>
          </table>
        </div>

        <!-- Right Column -->
        <div class="dashboard-col">
          <div class="dashboard-section-title">Sensory &amp; Geometric Fields</div>
          
          <div class="sensory-grid-three">
            <!-- 1. Sacred Yantra Widget -->
            <div class="sensory-widget glass yantra-widget" onclick="openLightbox('yantra')" style="cursor: zoom-in; height: 160px; justify-content: space-between;">
              <div class="widget-header">Sacred Yantra</div>
              <div class="yantra-svg-container" style="display: flex; align-items: center; justify-content: center; height: 90px; width: 100%;">
                <svg viewBox="0 0 300 300" class="lotus-svg" style="max-height: 90px; width: auto;">
                  ${defsSvg}
                  <circle cx="150" cy="150" r="140" fill="url(#bgGlow)" stroke="${activeColor}" stroke-dasharray="3,5" stroke-width="0.75" opacity="0.35" />
                  <g class="lotus-group" style="--glow-color: ${activeColor};">
                    ${petalsSvg}
                  </g>
                  ${centerSvg}
                </svg>
              </div>
              <div class="widget-label">${count > 0 ? `${count} Petals` : 'Mandala'} · <span style="color: var(--accent);">🔍 Zoom</span></div>
            </div>

            <!-- 2. Acoustic Current Widget -->
            <div class="sensory-widget glass" style="height: 160px; justify-content: space-between;">
              <div class="widget-header">Acoustic Current</div>
              <div style="display: flex; align-items: center; justify-content: center; height: 90px; width: 100%;">
                <svg viewBox="0 0 180 50" class="sound-wave-svg" style="max-height: 80px; width: 100%;">
                  ${waveBars}
                </svg>
              </div>
              <div class="widget-label" title="${floor.canonical.sound}">${floor.canonical.sound.split('(')[0]}</div>
            </div>

            <!-- 3. Inner Light Field Widget -->
            <div class="sensory-widget glass" style="height: 160px; justify-content: space-between;">
              <div class="widget-header">Inner Light Field</div>
              <div style="display: flex; align-items: center; justify-content: center; height: 90px; width: 100%;">
                <div class="light-swatch-box" style="background: radial-gradient(circle at center, ${activeColor} 0%, rgba(7,7,9,0.7) 100%); height: 75px; width: 100%;">
                  <span class="light-swatch-glow" style="background-color: ${activeColor}; box-shadow: 0 0 15px ${activeColor};"></span>
                </div>
              </div>
              <div class="widget-label" title="${floor.canonical.light || 'Nameless White Current'}">${floor.canonical.light ? floor.canonical.light.split('representing')[0].split(',')[0] : 'Formless Light'}</div>
            </div>
          </div>

          <!-- Ambient Sound Current Synthesizer -->
          <div class="audio-widget glass" style="margin-top: 1.5rem;">
            <div class="audio-control-left">
              <button class="audio-play-btn" id="audio-play-btn" onclick="toggleAudioSynthesizer(${floor.classification.level})" title="Play Audio Synthesizer">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <div class="audio-info">
                <div class="audio-status-label" id="audio-status-label">Ambient Sound Current</div>
                <div class="audio-title-label">${floor.canonical.sound.split('(')[0]}</div>
              </div>
            </div>
            <div class="audio-vol-slider-container">
              <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
              <input type="range" class="vol-slider" id="audio-volume-slider" min="0" max="1" step="0.05" value="0.5" oninput="changeSynthesizerVolume(this.value)">
            </div>
          </div>

          <!-- Pranayama Breath Guide -->
          <div class="breathing-widget glass" style="margin-top: 1.5rem;">
            <div class="breath-circle-container">
              <div class="breath-circle-outer"></div>
              <div class="breath-circle" id="breath-circle">SO</div>
            </div>
            <div class="breath-info-pane">
              <div class="breath-label" id="breath-state-label">PRANAYAMA: INHALE</div>
              <div class="breath-instruction" id="breath-instruction">Inhale slowly and fill your lungs...</div>
              <div class="breath-mantra-tip">Chant mentally: <strong>${floor.canonical.mantra || floor.canonical.recitation || 'SO HUNG'}</strong></div>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  const cardsContainer = document.getElementById('detail-cards');
  cardsContainer.innerHTML = '';

  if (floor.canonical.teachings) {
    const escapedTeachings = escapeHTML(floor.canonical.teachings).replace(/\n/g, '<br>');
    const escapedRuler = escapeHTML(floor.canonical.ruler);
    const escapedConsorts = escapeHTML(floor.canonical.consorts);
    const escapedQuote = escapeHTML(floor.canonical.teachings.split('.')[0]);
    createCard(cardsContainer, 'saksena', 'Saksena Core Account', `
      <p>${escapedTeachings}</p>
      ${floor.canonical.consorts ? `<div class="sub-section-head">Ruler &amp; Powers</div><p>Governed by <strong>${escapedRuler}</strong> with consorts/forces: <strong>${escapedConsorts}</strong>.</p>` : ''}
      <blockquote>"${escapedQuote}."</blockquote>
      <div class="citation">— Dr. H.N. Saksena, The Secret of Realisation, Chapter II</div>
    `, true);
  }

  if (floor.comparative) {
    const traditionLabels = {
      sikhism: 'Sikhism &amp; Gurbani',
      sufism: 'Sufi Lataif',
      hindu_tantra: 'Hindu Tantra &amp; Kundalini',
      vedic: 'Vedas &amp; Upanishads',
      buddhism: 'Tibetan Buddhism',
      taoism: 'Taoist Alchemy',
      kabbalah: 'Kabbalistic Tree of Life',
      gnosticism: 'Gnostic Pleroma',
      jainism: 'Jain Preksha Dhyana'
    };

    for (let trad in floor.comparative) {
      const data = floor.comparative[trad];
      if (data && data.term) {
        createCard(cardsContainer, trad, traditionLabels[trad] || trad, `
          <strong>${escapeHTML(data.term)}</strong>
          <p style="margin-top:0.8rem;">${escapeHTML(data.description).replace(/\n/g, '<br>')}</p>
        `, true);
      }
    }
  }

  if (floor.science && floor.science.neuroscience) {
    const neuro = floor.science.neuroscience;
    let scienceHtml = `
      <p>${escapeHTML(neuro.description).replace(/\n/g, '<br>')}</p>
      ${neuro.regions ? `<div class="sub-section-head">Correlating Brain Regions</div><p>${escapeHTML(neuro.regions.join(', '))}</p>` : ''}
      ${neuro.networks ? `<div class="sub-section-head">Neural Networks</div><p>${escapeHTML(neuro.networks.join(', '))}</p>` : ''}
      <div class="sub-section-head">Correlation Certainty Rating</div>
      <p>Certainty confidence is marked as: <strong>${escapeHTML(neuro.confidence)}</strong></p>
    `;
    
    if (floor.science.endocrinology && floor.science.endocrinology.description) {
      scienceHtml += `<div class="sub-section-head">Endocrinology</div><p>${escapeHTML(floor.science.endocrinology.description)}</p>`;
    }
    if (floor.science.psychology && floor.science.psychology.description) {
      scienceHtml += `<div class="sub-section-head">Psychology &amp; Ego State</div><p><strong>${escapeHTML(floor.science.psychology.ego_state)}</strong>: ${escapeHTML(floor.science.psychology.description)}</p>`;
    }

    createCard(cardsContainer, 'science', 'Modern Neurobiology &amp; Science', scienceHtml, true);
  }

  if (floor.phenomenology) {
    const phen = floor.phenomenology;
    const phenHtml = `
      <div class="sub-section-head">Waking State / Emotional Tone</div>
      <p>${escapeHTML(phen.emotional_tone)}</p>
      <div class="sub-section-head">Visual Landscape</div>
      <p>${escapeHTML(phen.visual_texture)}</p>
      <div class="sub-section-head">Auditory Landscape</div>
      <p>${escapeHTML(phen.auditory_texture)}</p>
      <div class="sub-section-head">Ego Dissolution / Identity shifts</div>
      <p>${escapeHTML(phen.ego_effect)}</p>
      <div class="sub-section-head">Spiritual Obstacles &amp; Risks</div>
      <p>⚠️ ${escapeHTML(phen.risks)}</p>
      <div class="sub-section-head">Transitions</div>
      <p><strong>Descent/Ascent from below</strong>: ${escapeHTML(phen.transitions.from_previous)}</p>
      <p><strong>Ascension criteria to higher plane</strong>: ${escapeHTML(phen.transitions.to_next)}</p>
    `;
    createCard(cardsContainer, 'science', 'Phenomenological Consciousness Experience', phenHtml, true);
  }

  if (floor.gateway_experience) {
    const gatewayHtml = renderGatewayCard(floor);
    if (gatewayHtml) {
      createCard(cardsContainer, 'gateway', 'Gateway Experience / Monroe Institute', gatewayHtml, true);
    }
  }

  document.getElementById('prev-btn').disabled = floor.classification.level === 1;
  document.getElementById('next-btn').disabled = floor.classification.level === 18;

  // Initialize breathing guide interval and audio UI states on render
  setTimeout(() => {
    initBreathingGuide(floor.canonical.mantra || floor.canonical.recitation);
    const isPlaying = isAudioPlaying();
    const currentFloor = getCurrentPlayingFloor();
    updateAudioUI(floor.classification.level, isPlaying && currentFloor === floor.classification.level);
  }, 50);
}

function renderPlaceholderFloor(floorNum) {
  document.getElementById('detail-num').textContent = floorNum;
  
  const floorNames = {
    7: 'Sahasra-Dal-Kamal',
    9: 'Shoonya / Daswan Dwar',
    10: 'Maha Shoonya',
    11: 'Bhanwar Gufa',
    12: 'Sach Khand / Sat Lok',
    13: 'Alakha Lok',
    14: 'Agama Lok',
    15: 'Akaha Lok / Anami',
    16: 'Secret Stage 16',
    17: 'Secret Stage 17',
    18: 'Secret Stage 18'
  };

  const name = floorNames[floorNum] || `Floor ${floorNum}`;
  document.getElementById('detail-title').textContent = `${name} (Phase 2 - Researching)`;
  document.getElementById('detail-sanskrit').textContent = 'Content and comparative structures are being gathered.';

  const progressPct = (floorNum / 18) * 100;
  document.getElementById('detail-progress').style.width = `${progressPct}%`;

  document.getElementById('detail-chips').innerHTML = '';

  const heroContainer = document.getElementById('floor-hero-visualizer');
  if (heroContainer) {
    heroContainer.innerHTML = `
      <div class="esoteric-hero-wrapper" style="width: 100%;">
        <div class="esoteric-art-frame">
          <div class="esoteric-placeholder">
            <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z"/></svg>
            <strong>Traditional Art Under Research</strong>
            <span style="opacity:0.65; display:block; padding:0 1rem; line-height:1.4; margin-top:4px;">Tracing primary manuscripts for authenticated visual depictions of Level ${floorNum} realms.</span>
          </div>
        </div>
        <div class="visualizer-caption">Level ${floorNum} Cosmic Painting</div>
      </div>
    `;
  }
  
  const cardsContainer = document.getElementById('detail-cards');
  cardsContainer.innerHTML = `
    <div class="card glass">
      <div class="card-head">
        <span class="card-tag tag-saksena">Saksena</span>
        <h3 class="card-title">Phase 2 / 3 Scaffolding</h3>
      </div>
      <div class="card-body">
        <p>This level corresponds to the higher spiritual worlds of <strong>${floorNum <= 12 ? 'Brahmanda (Astral)' : 'Dayal Desh (Pure Spirit)'}</strong>.</p>
        <p>To avoid context window saturation during compilation, this floor is scaffolded as an entity node. Full textual narratives, citations, Gnostic parallels, Sufi Lataif mappings, and neurobiology analysis are scheduled to be integrated systematically in Phase 2.</p>
      </div>
    </div>
  `;

  document.getElementById('prev-btn').disabled = floorNum === 1;
  document.getElementById('next-btn').disabled = floorNum === 18;
}

function createCard(container, category, title, bodyHtml, isCollapsible = false) {
  const card = document.createElement(isCollapsible ? 'details' : 'div');
  card.className = `card glass category-card-${category} ${isCollapsible ? 'collapsible-card' : ''}`;
  card.setAttribute('data-category', category);
  
  if (isCollapsible) {
    card.innerHTML = `
      <summary class="card-head" role="button" aria-expanded="false" tabindex="0">
        <div class="summary-title-wrapper">
          <span class="card-tag tag-${category}">${category.replace('_', ' ')}</span>
          <h3 class="card-title">${title}</h3>
        </div>
        <span class="accordion-arrow">
          <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
        </span>
      </summary>
      <div class="card-body">
        ${bodyHtml}
      </div>
    `;

    // Modern accessibility sync on toggle
    card.addEventListener('toggle', () => {
      const summary = card.querySelector('summary');
      if (summary) {
        summary.setAttribute('aria-expanded', card.open ? 'true' : 'false');
      }
      
      // Dynamic master button sync
      const btn = document.getElementById('accordion-toggle-btn');
      if (btn) {
        const cards = document.querySelectorAll('#detail-cards details.collapsible-card');
        if (cards.length > 0) {
          const allOpen = Array.from(cards).every(card => card.open);
          btn.textContent = allOpen ? 'Collapse All' : 'Expand All';
          btn.setAttribute('aria-label', allOpen ? 'Collapse all comparative lenses' : 'Expand all comparative lenses');
        }
      }
    });
  } else {
    card.setAttribute('tabindex', '0');
    card.innerHTML = `
      <div class="card-head">
        <span class="card-tag tag-${category}">${category.replace('_', ' ')}</span>
        <h3 class="card-title">${title}</h3>
      </div>
      <div class="card-body">
        ${bodyHtml}
      </div>
    `;
  }

  if (state.cardFilters[category] === false) {
    card.style.display = 'none';
  }

  container.appendChild(card);
}

export function toggleCardFilter(category) {
  const checkbox = document.getElementById(`lens-${category}`);
  if (checkbox) {
    state.cardFilters[category] = checkbox.checked;
    
    document.querySelectorAll(`.category-card-${category}`).forEach(card => {
      card.style.display = checkbox.checked ? 'block' : 'none';
    });
  }
}

export function setupMatrix() {
  const tbody = document.getElementById('matrix-tbody');
  tbody.innerHTML = '';

  for (let i = 1; i <= 18; i++) {
    const floor = state.floorsDB[`floor_${i}`];
    const tr = document.createElement('tr');
    tr.setAttribute('tabindex', '0');
    tr.setAttribute('role', 'button');
    tr.setAttribute('aria-label', `Go to Floor ${i}`);
    tr.onclick = () => selectFloor(i);
    tr.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tr.click();
      }
    };
    tr.style.cursor = 'pointer';

    if (floor) {
      const sikh = floor.comparative?.sikhism ? `<strong>${escapeHTML(floor.comparative.sikhism.term)}</strong>` : '<span class="cell-empty">Researching</span>';
      const sufi = floor.comparative?.sufism ? `<strong>${escapeHTML(floor.comparative.sufism.term)}</strong>` : '<span class="cell-empty">Researching</span>';
      const neuro = floor.science?.neuroscience ? `<strong>${escapeHTML(floor.science.neuroscience.regions?.[0] || 'Vagus Nerve')}</strong>${floor.science.neuroscience.networks ? `<br><small style="color:var(--muted)">${escapeHTML(floor.science.neuroscience.networks?.[0] || '')}</small>` : ''}` : '<span class="cell-empty">Researching</span>';
      const vedic = floor.comparative?.vedic ? `<strong>${escapeHTML(floor.comparative.vedic.term)}</strong>` : '<span class="cell-empty">Researching</span>';
      const bud = floor.comparative?.buddhism ? `<strong>${escapeHTML(floor.comparative.buddhism.term)}</strong>` : '<span class="cell-empty">Researching</span>';

      tr.innerHTML = `
        <td class="matrix-floor-cell">${i}. ${escapeHTML(floor.canonical_name.split('/')[0])}</td>
        <td><strong>${escapeHTML(floor.canonical.ruler)}</strong><small style="color:var(--muted)">Sound: ${escapeHTML(floor.canonical.sound.split('(')[0])}</small></td>
        <td>${sikh}</td>
        <td>${sufi}</td>
        <td>${neuro}</td>
        <td>${vedic}</td>
        <td>${bud}</td>
      `;
    } else {
      const placeholderNames = {
        7: 'Sahasra-Dal-Kamal',
        9: 'Shoonya / Daswan Dwar',
        10: 'Maha Shoonya',
        11: 'Bhanwar Gufa',
        12: 'Sach Khand'
      };
      tr.innerHTML = `
        <td class="matrix-floor-cell" style="opacity:0.4">${i}. ${escapeHTML(placeholderNames[i] || `Level ${i}`)}</td>
        <td colspan="6" style="text-align:center; color:var(--muted); font-style:italic; opacity:0.4;">Phase 2 Data Scaffolding</td>
      `;
    }
    tbody.appendChild(tr);
  }
}

export function setupSoundTimeline() {
  const container = document.getElementById('sound-timeline-container');
  if (!container) return;
  container.innerHTML = '';

  // Dynamically compute active sound floors from the compiled database
  const activeSoundFloors = Object.keys(state.floorsDB)
    .filter(key => key.startsWith('floor_'))
    .map(key => state.floorsDB[key])
    .filter(floor => floor && floor.canonical && floor.canonical.sound && !floor.canonical.sound.toLowerCase().includes('researching'))
    .sort((a, b) => a.classification.level - b.classification.level)
    .map(floor => floor.classification.level);

  activeSoundFloors.forEach(num => {
    const floor = state.floorsDB[`floor_${num}`];
    if (floor && floor.canonical.sound) {
      const item = document.createElement('div');
      item.className = 'sound-node glass';
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.onclick = () => selectFloor(num);
      item.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      };
      item.style.cursor = 'pointer';

      item.innerHTML = `
        <div class="sound-marker">${num}</div>
        <div class="sound-content">
          <div class="sound-meta">Level ${num} · ${escapeHTML(floor.canonical_name.split('/')[0])}</div>
          <h3 class="sound-title">${escapeHTML(floor.canonical.sound)}</h3>
          <p style="margin-top:0.4rem; color:var(--muted); font-size:13px;">Recitation: <strong>${escapeHTML(floor.canonical.recitation)}</strong> · Light: <strong>${escapeHTML(floor.canonical.light.split('(')[0])}</strong></p>
        </div>
      `;
      container.appendChild(item);
    }
  });
}

export function toggleVisualizerTab(tabName) {
  const yantraPane = document.getElementById('vis-yantra-pane');
  const artPane = document.getElementById('vis-art-pane');
  const yantraTab = document.getElementById('vis-tab-yantra');
  const artTab = document.getElementById('vis-tab-art');

  if (tabName === 'yantra') {
    if (yantraPane) yantraPane.style.display = 'block';
    if (artPane) artPane.style.display = 'none';
    if (yantraTab) yantraTab.classList.add('active');
    if (artTab) artTab.classList.remove('active');
  } else if (tabName === 'art') {
    if (yantraPane) yantraPane.style.display = 'none';
    if (artPane) artPane.style.display = 'block';
    if (yantraTab) yantraTab.classList.remove('active');
    if (artTab) artTab.classList.add('active');
  }
}

export function setupGallery() {
  const tbody = document.getElementById('gallery-legend-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const textColors = {
    'Pinda': 'var(--color-pinda)',
    'Brahmanda': 'var(--color-brahmanda)',
    'Dayal Desh': 'var(--color-dayal)',
    'Secret': 'var(--accent)'
  };

  for (let i = 1; i <= 18; i++) {
    const floor = state.floorsDB[`floor_${i}`];
    if (!floor) continue;

    const tr = document.createElement('tr');
    tr.setAttribute('tabindex', '0');
    tr.setAttribute('role', 'button');
    tr.setAttribute('aria-label', `Go to Floor ${i}`);
    tr.onclick = () => selectFloor(i);
    tr.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tr.click();
      }
    };

    const realm = floor.classification.realm;
    const hoverBg = COLOR_MAP[realm.toLowerCase()] ? `rgba(${COLOR_MAP[realm.toLowerCase()] === '#a32d2d' ? '163,45,45' : COLOR_MAP[realm.toLowerCase()] === '#7f77dd' ? '127,119,221' : COLOR_MAP[realm.toLowerCase()] === '#0f6e56' ? '15,110,86' : '196,169,106'}, 0.08)` : 'rgba(255, 255, 255, 0.02)';
    const nameColor = textColors[realm] || 'var(--accent)';
    tr.style.setProperty('--row-hover-color', hoverBg);

    tr.innerHTML = `
      <td class="legend-table-level-cell" style="color: ${nameColor}">${i}</td>
      <td style="color: ${nameColor}; font-weight: 500; font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase;">${realm === 'Secret' ? 'Nameless Peak' : escapeHTML(realm)}</td>
      <td><strong>${escapeHTML(floor.canonical_name.split('/')[0])}</strong><br><small style="color: var(--muted); font-size: 10px;">Ruler: ${escapeHTML(floor.canonical.ruler)}</small></td>
    `;
    tbody.appendChild(tr);
  }
  
  // Render and setup Kabbalistic and Sufi vector overlays
  setupGalleryOverlays();
  setupGalleryZoom();
}

export function setupGalleryZoom() {
  const frame = document.getElementById('galleryImageFrame');
  const img = document.getElementById('galleryMainImg');
  if (!frame || !img) return;

  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  function updateTransform() {
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  }

  // Set initial origin and cursor styles
  img.style.transformOrigin = 'center center';
  img.style.transition = 'transform 0.05s ease';
  frame.style.cursor = 'grab';

  frame.onmousedown = (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    frame.style.cursor = 'grabbing';
  };

  window.addEventListener('mouseup', () => {
    isDragging = false;
    if (frame) frame.style.cursor = 'grab';
  });

  frame.onmousemove = (e) => {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    updateTransform();
  };

  frame.onwheel = (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
      zoom *= zoomFactor;
    } else {
      zoom /= zoomFactor;
    }
    zoom = Math.max(1, Math.min(4, zoom));
    if (zoom === 1) {
      panX = 0;
      panY = 0;
    }
    updateTransform();
  };

  // Touch & Pinch support
  let touchStartDist = 0;
  let baseZoom = 1;

  frame.ontouchstart = (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX - panX;
      startY = e.touches[0].clientY - panY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      touchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      baseZoom = zoom;
    }
  };

  frame.ontouchmove = (e) => {
    if (isDragging && e.touches.length === 1) {
      panX = e.touches[0].clientX - startX;
      panY = e.touches[0].clientY - startY;
      updateTransform();
      e.preventDefault();
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist;
      zoom = Math.max(1, Math.min(4, baseZoom * factor));
      if (zoom === 1) {
        panX = 0;
        panY = 0;
      }
      updateTransform();
      e.preventDefault();
    }
  };

  frame.ontouchend = () => {
    isDragging = false;
  };
}

// ── PRANAYAMA BREATHING VISUALIZER LOOP ──
let breathInterval = null;
let breathState = 0; // 0=inhale, 1=hold, 2=exhale, 3=suspend

export function initBreathingGuide(mantra) {
  if (breathInterval) {
    clearInterval(breathInterval);
  }
  
  const circle = document.getElementById('breath-circle');
  const instruction = document.getElementById('breath-instruction');
  const label = document.getElementById('breath-state-label');
  
  if (!circle || !instruction) return;
  
  // Set initial state
  breathState = 0;
  updateBreathState(circle, instruction, label, mantra);
  
  breathInterval = setInterval(() => {
    breathState = (breathState + 1) % 4;
    updateBreathState(circle, instruction, label, mantra);
  }, 4000);
}

function updateBreathState(circle, instruction, label, mantra) {
  if (!circle || !instruction) return;
  
  // Clear classes
  circle.classList.remove('inhale', 'hold', 'exhale', 'suspend');
  
  const formattedMantra = mantra || 'SO HUNG';
  
  switch(breathState) {
    case 0:
      circle.classList.add('inhale');
      circle.textContent = "SO";
      if (label) label.textContent = "PRANAYAMA: INHALE";
      instruction.textContent = "Inhale slowly and fill your lungs...";
      break;
    case 1:
      circle.classList.add('hold');
      circle.textContent = "HOLD";
      if (label) label.textContent = "PRANAYAMA: HOLD";
      instruction.innerHTML = `Hold & focus on: <strong style="color:var(--color-brahmanda);">${formattedMantra}</strong>`;
      break;
    case 2:
      circle.classList.add('exhale');
      circle.textContent = "HUNG";
      if (label) label.textContent = "PRANAYAMA: EXHALE";
      instruction.textContent = "Exhale slowly, releasing all thoughts...";
      break;
    case 3:
      circle.classList.add('suspend');
      circle.textContent = "VOID";
      if (label) label.textContent = "PRANAYAMA: SUSPEND";
      instruction.textContent = "Suspend breath, rest in absolute silence...";
      break;
  }
}

export function stopBreathingGuide() {
  if (breathInterval) {
    clearInterval(breathInterval);
    breathInterval = null;
  }
}

// ── AUDIO CONTROLLER TRIGGERS ──
export function toggleAudioSynthesizer(floorNum) {
  const isPlaying = isAudioPlaying();
  const currentFloor = getCurrentPlayingFloor();
  
  if (isPlaying && currentFloor === floorNum) {
    stopCurrentSound();
    updateAudioUI(floorNum, false);
  } else {
    stopCurrentSound();
    const volSlider = document.getElementById('audio-volume-slider');
    const volume = volSlider ? parseFloat(volSlider.value) : 0.5;
    playCurrentSound(floorNum, volume);
    updateAudioUI(floorNum, true);
  }
}

export function changeSynthesizerVolume(val) {
  const isPlaying = isAudioPlaying();
  const currentFloor = getCurrentPlayingFloor();
  if (isPlaying && currentFloor > 0) {
    setSynthesizerVolume(parseFloat(val));
  }
}

export function updateAudioUI(floorNum, isPlaying) {
  const playBtn = document.getElementById('audio-play-btn');
  const statusLabel = document.getElementById('audio-status-label');
  const waveRects = document.querySelectorAll('.sound-wave-svg rect');

  if (playBtn) {
    if (isPlaying) {
      // Show Stop Icon (a small square in SVG)
      playBtn.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
      `;
      playBtn.title = "Stop Audio Synthesizer";
    } else {
      // Show Play Icon (a small triangle in SVG)
      playBtn.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      `;
      playBtn.title = "Play Audio Synthesizer";
    }
  }

  if (statusLabel) {
    statusLabel.textContent = isPlaying ? "Synthesizing Sound Current..." : "Ambient Sound Current";
  }

  // Waveform animation
  waveRects.forEach(rect => {
    if (isPlaying) {
      rect.classList.add('wave-rect-active');
      // Randomize animation delays and durations for natural organic feel
      rect.style.animationDelay = `${Math.random() * 0.5}s`;
      rect.style.animationDuration = `${0.4 + Math.random() * 0.5}s`;
    } else {
      rect.classList.remove('wave-rect-active');
      rect.style.animationDelay = '';
      rect.style.animationDuration = '';
    }
  });
}

// ── GALLERY TAB SWITCHING ──
export function switchGalleryTab(tabName) {
  const mapPane = document.getElementById('gallery-map-pane');
  const kabbalahPane = document.getElementById('gallery-kabbalah-pane');
  const sufiPane = document.getElementById('gallery-sufi-pane');

  if (mapPane) mapPane.style.display = 'none';
  if (kabbalahPane) kabbalahPane.style.display = 'none';
  if (sufiPane) sufiPane.style.display = 'none';

  const mapTab = document.getElementById('gal-tab-map');
  const kabbalahTab = document.getElementById('gal-tab-kabbalah');
  const sufiTab = document.getElementById('gal-tab-sufi');

  if (mapTab) mapTab.classList.remove('active');
  if (kabbalahTab) kabbalahTab.classList.remove('active');
  if (sufiTab) sufiTab.classList.remove('active');

  const activePane = document.getElementById(`gallery-${tabName}-pane`);
  if (activePane) activePane.style.display = 'block';

  const activeTab = document.getElementById(`gal-tab-${tabName}`);
  if (activeTab) activeTab.classList.add('active');
}

// ── INTERACTIVE KABBALAH & SUFI VECTOR OVERLAYS ──
export function setupGalleryOverlays() {
  const kabbalahContainer = document.getElementById('kabbalah-vector-container');
  const sufiContainer = document.getElementById('sufi-vector-container');
  
  if (!kabbalahContainer || !sufiContainer) return;
  
  // 1. KABBALISTIC TREE OF LIFE SVG
  const sephiroth = [
    { name: 'Kether (Crown)', level: 12, x: 200, y: 50, color: 'var(--color-dayal)' },
    { name: 'Chokmah (Wisdom)', level: 11, x: 300, y: 120, color: 'var(--color-brahmanda)' },
    { name: 'Binah (Understanding)', level: 9, x: 100, y: 120, color: 'var(--color-brahmanda)' },
    { name: 'Chesed (Mercy)', level: 8, x: 300, y: 220, color: 'var(--color-brahmanda)' },
    { name: 'Geburah (Severity)', level: 7, x: 100, y: 220, color: 'var(--color-brahmanda)' },
    { name: 'Tiphareth (Beauty)', level: 6, x: 200, y: 290, color: 'var(--color-pinda)' },
    { name: 'Netzach (Victory)', level: 4, x: 300, y: 390, color: 'var(--color-pinda)' },
    { name: 'Hod (Glory)', level: 3, x: 100, y: 390, color: 'var(--color-pinda)' },
    { name: 'Yesod (Foundation)', level: 2, x: 200, y: 460, color: 'var(--color-pinda)' },
    { name: 'Malkuth (Kingdom)', level: 1, x: 200, y: 550, color: 'var(--color-pinda)' }
  ];
  
  const paths = [
    [0, 1], [0, 2], [0, 5],
    [1, 2], [1, 3], [1, 5],
    [2, 4], [2, 5],
    [3, 4], [3, 5], [3, 6],
    [4, 5], [4, 7],
    [5, 6], [5, 7], [5, 8],
    [6, 7], [6, 8], [6, 9],
    [7, 8], [7, 9],
    [8, 9]
  ];
  
  let kabbalahPathsSvg = '';
  paths.forEach(p => {
    const s = sephiroth[p[0]];
    const t = sephiroth[p[1]];
    kabbalahPathsSvg += `<line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" class="sephira-path" />`;
  });
  
  let kabbalahNodesSvg = '';
  sephiroth.forEach(s => {
    const floor = state.floorsDB[`floor_${s.level}`];
    const floorName = floor ? floor.canonical_name.split('/')[0] : `Level ${s.level}`;
    kabbalahNodesSvg += `
      <g class="sephira-node" onclick="selectFloor(${s.level})" data-name="${s.name}" data-level="${s.level}" data-floor-name="${floorName}" tabindex="0" role="button" aria-label="${s.name}">
        <circle cx="${s.x}" cy="${s.y}" r="22" fill="#0d0d12" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" class="sephira-circle" />
        <circle cx="${s.x}" cy="${s.y}" r="12" fill="${s.color}" opacity="0.15" />
        <circle cx="${s.x}" cy="${s.y}" r="6" fill="${s.color}" style="filter: drop-shadow(0 0 6px ${s.color});" />
        <text x="${s.x}" y="${s.y - 28}" fill="var(--muted)" font-size="8px" letter-spacing="0.05em" text-anchor="middle" font-family="var(--font-sans)" font-weight="500">${s.name.split(' ')[0].toUpperCase()}</text>
      </g>
    `;
  });
  
  kabbalahContainer.innerHTML = `
    <svg viewBox="0 0 400 600" class="vector-overlay-svg">
      <defs>
        <radialGradient id="kethGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.1" />
          <stop offset="100%" stop-color="#070709" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="400" height="600" fill="url(#kethGlow)" opacity="0.3" pointer-events="none" />
      ${kabbalahPathsSvg}
      ${kabbalahNodesSvg}
    </svg>
  `;
  
  // 2. SUFI LATAIF SUBTLE BODY SVG
  const lataif = [
    { name: 'Akhfa (Most Hidden)', level: 12, x: 150, y: 80, color: '#0f6e56' },
    { name: 'Khafi (Hidden / Third Eye)', level: 6, x: 150, y: 130, color: '#2c7fb8' },
    { name: 'Sirr (Secret / Throat)', level: 5, x: 150, y: 200, color: '#eceae4' },
    { name: 'Ruh (Spirit / Right Chest)', level: 4, x: 185, y: 270, color: '#a32d2d' },
    { name: 'Qalb (Heart / Left Chest)', level: 3, x: 115, y: 270, color: '#dfc221' }
  ];
  
  const bodySilhouette = `
    M 150 25 C 135 25, 125 40, 125 55 C 125 70, 135 80, 135 80 C 115 90, 85 105, 75 130 C 65 155, 65 190, 85 225 C 105 260, 120 295, 120 330 C 120 365, 90 380, 60 390 L 240 390 C 210 380, 180 365, 180 330 C 180 295, 195 260, 215 225 C 235 190, 235 155, 225 130 C 215 105, 185 90, 165 80 C 165 80, 175 70, 175 55 C 175 40, 165 25, 150 25 Z
  `;
  
  let sufiNodesSvg = '';
  lataif.forEach(l => {
    const floor = state.floorsDB[`floor_${l.level}`];
    const floorName = floor ? floor.canonical_name.split('/')[0] : `Level ${l.level}`;
    sufiNodesSvg += `
      <g class="lataif-node" onclick="selectFloor(${l.level})" data-name="${l.name}" data-level="${l.level}" data-floor-name="${floorName}" tabindex="0" role="button" aria-label="${l.name}">
        <circle cx="${l.x}" cy="${l.y}" r="18" fill="#0d0d12" stroke="rgba(255,255,255,0.06)" stroke-width="1" class="lataif-circle" />
        <circle cx="${l.x}" cy="${l.y}" r="10" fill="${l.color}" opacity="0.15" />
        <circle cx="${l.x}" cy="${l.y}" r="5" fill="${l.color}" style="filter: drop-shadow(0 0 6px ${l.color});" />
        <text x="${l.x + (l.x === 150 ? 25 : l.x === 185 ? 25 : -25)}" y="${l.y + 4}" fill="var(--muted)" font-size="8px" letter-spacing="0.05em" text-anchor="${l.x === 150 ? 'start' : l.x === 185 ? 'start' : 'end'}" font-family="var(--font-sans)" font-weight="500">${l.name.split(' ')[0].toUpperCase()}</text>
      </g>
    `;
  });
  
  sufiContainer.innerHTML = `
    <svg viewBox="0 0 300 420" class="vector-overlay-svg">
      <defs>
        <radialGradient id="sufiGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#070709" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="300" height="420" fill="url(#sufiGlow)" opacity="0.2" pointer-events="none" />
      <path d="${bodySilhouette}" fill="rgba(255,255,255,0.012)" stroke="rgba(255,255,255,0.04)" stroke-width="1.2" style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));" />
      
      <!-- Central Meridian (Sushumna / Shahrag) -->
      <line x1="150" y1="55" x2="150" y2="390" stroke="rgba(196,169,106,0.12)" stroke-width="1.5" stroke-dasharray="3,3" />
      <line x1="150" y1="270" x2="185" y2="270" stroke="rgba(255,255,255,0.04)" stroke-width="1" stroke-dasharray="2,2" />
      <line x1="150" y1="270" x2="115" y2="270" stroke="rgba(255,255,255,0.04)" stroke-width="1" stroke-dasharray="2,2" />
      
      ${sufiNodesSvg}
    </svg>
  `;
  
  // 3. ATTACH HTML TOOLTIP EVENTS
  let tooltip = document.getElementById('gallery-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'gallery-tooltip';
    tooltip.className = 'glass';
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'rgba(13,13,18,0.95)';
    tooltip.style.border = '1px solid var(--accent)';
    tooltip.style.color = 'var(--text)';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '8px';
    tooltip.style.fontSize = '11px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.boxShadow = 'var(--shadow)';
    tooltip.style.zIndex = '2000';
    tooltip.style.display = 'none';
    tooltip.style.backdropFilter = 'blur(6px)';
    tooltip.style.transition = 'opacity 0.15s ease';
    document.body.appendChild(tooltip);
  }
  
  function handleMouseOver(e) {
    const target = e.currentTarget;
    const name = target.getAttribute('data-name');
    const level = target.getAttribute('data-level');
    const floorName = target.getAttribute('data-floor-name');
    
    tooltip.innerHTML = `
      <div style="font-weight:600; color:var(--accent); font-size:12px;">${name}</div>
      <div style="margin-top:2px; font-weight:500;">Corresponding: Level ${level}</div>
      <div style="color:var(--text); opacity:0.85; margin-top:2px;">Floor: ${floorName}</div>
      <div style="color:var(--muted); font-size:9px; margin-top:4px; text-transform:uppercase; letter-spacing:0.04em;">Click to view full details</div>
    `;
    tooltip.style.display = 'block';
    tooltip.style.opacity = '1';
  }
  
  function handleMouseMove(e) {
    tooltip.style.left = `${e.pageX + 12}px`;
    tooltip.style.top = `${e.pageY + 12}px`;
  }
  
  function handleMouseOut() {
    tooltip.style.opacity = '0';
    setTimeout(() => {
      if (tooltip.style.opacity === '0') {
        tooltip.style.display = 'none';
      }
    }, 150);
  }
  
  document.querySelectorAll('.sephira-node, .lataif-node').forEach(node => {
    node.addEventListener('mouseover', handleMouseOver);
    node.addEventListener('mousemove', handleMouseMove);
    node.addEventListener('mouseout', handleMouseOut);
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        node.click();
      }
    });
  });
}

// ── LIGHTBOX WINDOW BINDINGS ──
window.openLightbox = (type) => {
  const lightbox = document.getElementById('lightbox-modal');
  const content = document.getElementById('lightbox-content');
  if (!lightbox || !content) return;
  
  state.lastActiveElement = document.activeElement; // Track focus element

  if (type === 'yantra') {
    const svgEl = document.querySelector('.lotus-svg');
    if (svgEl) {
      content.innerHTML = svgEl.outerHTML;
    }
  } else if (type === 'art') {
    const imgEl = document.getElementById('esotericImg') || document.querySelector('.esoteric-img');
    if (imgEl) {
      content.innerHTML = `<img src="${imgEl.src}" alt="${imgEl.alt}">`;
    }
  }
  
  lightbox.classList.add('active');
  lightbox.setAttribute('aria-hidden', 'false');
  
  const closeBtn = lightbox.querySelector('.lightbox-close');
  if (closeBtn) {
    closeBtn.focus();
  }
};

window.closeLightbox = () => {
  const lightbox = document.getElementById('lightbox-modal');
  const content = document.getElementById('lightbox-content');
  if (lightbox) {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
  }
  if (content) {
    content.innerHTML = '';
  }
  if (state.lastActiveElement) {
    state.lastActiveElement.focus();
    state.lastActiveElement = null;
  }
};

export function toggleAllAccordions() {
  const btn = document.getElementById('accordion-toggle-btn');
  if (!btn) return;

  const cards = document.querySelectorAll('#detail-cards details.collapsible-card');
  const allOpen = Array.from(cards).every(card => card.open);

  if (allOpen) {
    // Collapse All
    cards.forEach(card => {
      card.open = false;
    });
    btn.textContent = 'Expand All';
    btn.setAttribute('aria-label', 'Expand all comparative lenses');
  } else {
    // Expand All
    cards.forEach(card => {
      card.open = true;
    });
    btn.textContent = 'Collapse All';
    btn.setAttribute('aria-label', 'Collapse all comparative lenses');
  }
}

export async function lazyLoadGraph() {
  if (state.graphData && state.graphData.nodes) {
    return; // Already loaded
  }

  const svg = document.getElementById('graphSvg');
  const group = document.getElementById('graphGroup');
  if (!svg || !group) return;

  // Render a beautiful, premium glassmorphic loader inside graph panel
  let loader = document.getElementById('graph-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'graph-loader';
    loader.className = 'glass';
    loader.innerHTML = `
      <div class="spinner"></div>
      <div style="margin-top: 1rem; font-weight: 500; letter-spacing: 0.05em; color: var(--accent);">CONNECTING ATLAS RELATIONSHIPS...</div>
      <div style="font-size: 11px; color: var(--muted); margin-top: 4px;">Loading 261 consciousness node streams</div>
    `;
    loader.setAttribute('style', `
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: rgba(7, 7, 9, 0.85);
      backdrop-filter: blur(8px);
      z-index: 100;
      border-radius: 12px;
      transition: opacity 0.4s ease;
    `);
    
    const spinnerStyle = document.createElement('style');
    spinnerStyle.textContent = `
      .spinner {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(196, 169, 106, 0.15);
        border-radius: 50%;
        border-top-color: var(--accent);
        animation: spin 1s ease-in-out infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(spinnerStyle);
    
    svg.parentNode.appendChild(loader);
  }

  loader.style.opacity = '1';
  loader.style.display = 'flex';

  try {
    const response = await fetch('content/content_graph.json');
    state.graphData = await response.json();
    setupGraph();
    
    // Graceful fade out
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 400);
  } catch (error) {
    console.error("Error lazy-loading graph:", error);
    loader.innerHTML = `
      <div style="color: var(--color-pinda); font-size: 24px;">⚠️</div>
      <div style="margin-top: 0.5rem; font-weight: 600; color: var(--text);">Failed to load graph data</div>
      <div style="font-size: 11px; color: var(--muted); margin-top: 4px;">Please check your connection and reload</div>
    `;
  }
}

// Global Escape key listener for the Art Lightbox modal
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const lightbox = document.getElementById('lightbox-modal');
    if (lightbox && lightbox.classList.contains('active')) {
      window.closeLightbox();
    }
  }
});

