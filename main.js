import { state } from './state.js';
import { 
  selectFloor, 
  setupMatrix, 
  setupSoundTimeline, 
  switchView, 
  toggleCardFilter, 
  setupGallery, 
  toggleVisualizerTab, 
  toggleAudioSynthesizer, 
  changeSynthesizerVolume, 
  switchGalleryTab, 
  toggleAllAccordions 
} from './ui.js';
import { setupGraph, toggleGraphFilter } from './graph.js';
import { handleSearch } from './search.js';

// Hash routing handler to sync URL changes to the UI
function handleHashRouting() {
  const hash = window.location.hash;
  if (!hash) return false;

  // Set routing flag to block feedback loop in updateHash()
  state.isRouting = true;

  let processed = false;
  if (hash.startsWith('#/floor/')) {
    const floorNum = parseInt(hash.replace('#/floor/', ''), 10);
    if (floorNum >= 1 && floorNum <= 18) {
      if (state.activeFloor === floorNum && state.activeView === 'floor') {
        state.isRouting = false;
        return true;
      }
      selectFloor(floorNum);
      processed = true;
    }
  } else if (hash.startsWith('#/view/')) {
    const viewName = hash.replace('#/view/', '');
    const validViews = ['floor', 'matrix', 'graph', 'sound', 'gallery', 'energy'];
    if (validViews.includes(viewName)) {
      if (state.activeView === viewName) {
        state.isRouting = false;
        return true;
      }
      switchView(viewName);
      processed = true;
    }
  }

  state.isRouting = false;
  return processed;
}

// Development synchronization check
async function checkBuildSync(compiledAt) {
  if (!compiledAt) return;
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isDev) return;

  try {
    const checkPromises = [];
    for (let i = 1; i <= 18; i++) {
      checkPromises.push(
        fetch(`content/floors/floor_${i}.yaml`, { method: 'HEAD' })
          .then(res => {
            if (res.ok) {
              const lastModHeader = res.headers.get('Last-Modified');
              if (lastModHeader) {
                const lastMod = new Date(lastModHeader).getTime();
                // Flag if individual YAML source is newer than compilation timestamp
                if (lastMod > compiledAt) {
                  return true;
                }
              }
            }
            return false;
          })
          .catch(() => false)
      );
    }

    const results = await Promise.all(checkPromises);
    const isOutdated = results.some(r => r === true);

    if (isOutdated) {
      showBuildWarningBanner();
    }
  } catch (err) {
    console.warn("Could not verify build synchronization:", err);
  }
}

function showBuildWarningBanner() {
  let banner = document.getElementById('build-warning-banner');
  if (banner) return;

  banner = document.createElement('div');
  banner.id = 'build-warning-banner';
  banner.setAttribute('style', `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(163, 45, 45, 0.95);
    border: 1px solid var(--accent);
    color: #fff;
    padding: 14px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    z-index: 10000;
    backdrop-filter: blur(12px);
    font-family: var(--font-sans);
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideIn 0.35s cubic-bezier(0.19, 1, 0.22, 1);
  `);

  banner.innerHTML = `
    <span style="font-size: 18px;">⚠️</span>
    <div style="flex: 1;">
      <strong style="display:block; letter-spacing:0.04em; font-weight:600; margin-bottom: 2px;">DATA SYNC WARNING</strong>
      <span style="opacity:0.85; line-height: 1.4;">YAML source files have newer updates. Please run <code style="background:rgba(0,0,0,0.4); padding:2px 5px; border-radius:4px; font-family: monospace;">npm run compile</code>.</span>
    </div>
    <button style="background:none; border:none; color:#fff; font-size:18px; cursor:pointer; font-weight:bold; padding: 4px;" onclick="this.parentElement.remove()">&times;</button>
  `;

  const keyframeStyle = document.createElement('style');
  keyframeStyle.textContent = `
    @keyframes slideIn {
      from { transform: translateY(60px) scale(0.9); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(keyframeStyle);
  document.body.appendChild(banner);
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Eagerly load only floors_db.json to bootstrap initial view fast
    const dbResponse = await fetch('content/floors_db.json');
    state.floorsDB = await dbResponse.json();

    console.log("Atlas Database successfully loaded.");

    setupMatrix();
    setupSoundTimeline();
    setupGallery();

    // Check for deep links first, otherwise default to Floor 1
    const routed = handleHashRouting();
    if (!routed) {
      selectFloor(1);
    }

    for (let i = 1; i <= 18; i++) {
      const btn = document.getElementById(`btn-${i}`);
      if (btn) {
        if (state.floorsDB[`floor_${i}`]) {
          btn.classList.remove('disabled-floor');
        } else {
          btn.classList.add('disabled-floor');
        }
      }
    }

    // Programmatic click bindings to ensure zero inline onclick handler constraints (strict CSP)
    
    // 1. Tab buttons
    document.querySelectorAll('.nav-tabs .tab-btn').forEach(btn => {
      const view = btn.getAttribute('data-view');
      if (view) {
        btn.addEventListener('click', () => switchView(view));
      }
    });

    // 2. Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    }

    // 3. Sidebar Floor selection
    document.querySelectorAll('.floor-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const floorId = btn.id.replace('btn-', '');
        const floorNum = parseInt(floorId, 10);
        selectFloor(floorNum);
      });
    });

    // 4. Tradition Filter Checkboxes
    document.querySelectorAll('.lens-checkbox').forEach(chk => {
      chk.addEventListener('change', () => {
        const lens = chk.id.replace('lens-', '');
        toggleCardFilter(lens);
      });
    });

    // 5. Accordion Master toggle
    const accBtn = document.getElementById('accordion-toggle-btn');
    if (accBtn) {
      accBtn.addEventListener('click', toggleAllAccordions);
    }

    // 6. Pagination Navigation Buttons
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => selectFloor(state.activeFloor - 1));
    }
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => selectFloor(state.activeFloor + 1));
    }

    // 7. Graph Relationship stream filters
    ['Floor', 'Ruler', 'Sound', 'Brain', 'Comparative', 'Gateway'].forEach(type => {
      const chk = document.getElementById(`filter-node-${type}`);
      if (chk) {
        chk.addEventListener('change', () => toggleGraphFilter(type));
      }
    });

    // 8. Gallery Pane tabs
    ['map', 'kabbalah', 'sufi'].forEach(tab => {
      const btn = document.getElementById(`gal-tab-${tab}`);
      if (btn) {
        btn.addEventListener('click', () => switchGalleryTab(tab));
      }
    });

    // 9. Lightbox Modal click-to-close & close-button
    const lightboxModal = document.getElementById('lightbox-modal');
    if (lightboxModal) {
      lightboxModal.addEventListener('click', () => {
        if (typeof window.closeLightbox === 'function') {
          window.closeLightbox();
        }
      });
      const lightboxClose = lightboxModal.querySelector('.lightbox-close');
      if (lightboxClose) {
        lightboxClose.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof window.closeLightbox === 'function') {
            window.closeLightbox();
          }
        });
      }
    }

    // Dev Build Integrity Check
    if (state.floorsDB.metadata && state.floorsDB.metadata.compiled_at) {
      checkBuildSync(state.floorsDB.metadata.compiled_at);
    }

    // Register PWA Service Worker for offline app capability
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('./service-worker.js');
        console.log('Service Worker registered successfully with scope:', reg.scope);
      } catch (err) {
        console.error('Service Worker registration failed:', err);
      }
    }
  } catch (error) {
    console.error("Initialization error:", error);
  }
});

// Sync browser back/forward and direct hash updates
window.addEventListener('hashchange', () => {
  handleHashRouting();
});

// Expose standard handlers globally to ensure zero dynamic element failures
window.switchView = switchView;
window.selectFloor = selectFloor;
window.handleSearch = handleSearch;
window.toggleCardFilter = toggleCardFilter;
window.toggleVisualizerTab = toggleVisualizerTab;
window.toggleAudioSynthesizer = toggleAudioSynthesizer;
window.changeSynthesizerVolume = changeSynthesizerVolume;
window.switchGalleryTab = switchGalleryTab;
window.toggleGraphFilter = toggleGraphFilter;
window.toggleAllAccordions = toggleAllAccordions;
window.navigateFloor = (direction) => {
  selectFloor(state.activeFloor + direction);
};
