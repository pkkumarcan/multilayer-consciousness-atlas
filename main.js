import { state } from './state.js';
import { selectFloor, setupMatrix, setupSoundTimeline, switchView, toggleCardFilter, setupGallery, toggleVisualizerTab, toggleAudioSynthesizer, changeSynthesizerVolume, switchGalleryTab } from './ui.js';
import { setupGraph, toggleGraphFilter } from './graph.js';
import { handleSearch } from './search.js';

// Hash routing handler to sync URL changes to the UI
function handleHashRouting() {
  const hash = window.location.hash;
  if (!hash) return false;

  if (hash.startsWith('#/floor/')) {
    const floorNum = parseInt(hash.replace('#/floor/', ''), 10);
    if (floorNum >= 1 && floorNum <= 18) {
      if (state.activeFloor === floorNum && state.activeView === 'floor') return true;
      selectFloor(floorNum);
      return true;
    }
  } else if (hash.startsWith('#/view/')) {
    const viewName = hash.replace('#/view/', '');
    const validViews = ['floor', 'matrix', 'graph', 'sound', 'gallery', 'energy'];
    if (validViews.includes(viewName)) {
      if (state.activeView === viewName) return true;
      switchView(viewName);
      return true;
    }
  }
  return false;
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const dbResponse = await fetch('content/floors_db.json');
    state.floorsDB = await dbResponse.json();

    const graphResponse = await fetch('content/content_graph.json');
    state.graphData = await graphResponse.json();

    console.log("Atlas Database and Graph successfully loaded.");

    setupMatrix();
    setupGraph();
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
  } catch (error) {
    console.error("Initialization error:", error);
  }
});

// Sync browser back/forward and direct hash updates
window.addEventListener('hashchange', () => {
  handleHashRouting();
});

// Expose to window for inline onclick handlers in HTML
window.switchView = switchView;
window.selectFloor = selectFloor;
window.handleSearch = handleSearch;
window.toggleCardFilter = toggleCardFilter;
window.toggleVisualizerTab = toggleVisualizerTab;
window.toggleAudioSynthesizer = toggleAudioSynthesizer;
window.changeSynthesizerVolume = changeSynthesizerVolume;
window.switchGalleryTab = switchGalleryTab;
window.toggleGraphFilter = toggleGraphFilter;
window.navigateFloor = (direction) => {
  selectFloor(state.activeFloor + direction);
};
