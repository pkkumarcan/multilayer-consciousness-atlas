import { state } from './state.js';
import { selectFloor, switchView } from './ui.js';

export function handleSearch(query) {
  const resultsContainer = document.getElementById('search-results-container');
  const summaryEl = document.getElementById('search-summary');
  const keywordEl = document.getElementById('search-keyword');

  if (!query || query.trim() === '') {
    switchView('floor');
    return;
  }

  const cleanQuery = query.toLowerCase().trim();
  switchView('search');
  keywordEl.textContent = `"${query}"`;

  const matches = [];

  for (let key in state.floorsDB) {
    const floor = state.floorsDB[key];
    let matchedInFloor = false;
    let score = 0;
    const snippets = [];

    if (floor.canonical_name.toLowerCase().includes(cleanQuery)) {
      score += 10;
      snippets.push(`Matched floor name: <mark>${floor.canonical_name}</mark>`);
      matchedInFloor = true;
    }
    if (floor.canonical.ruler && floor.canonical.ruler.toLowerCase().includes(cleanQuery)) {
      score += 8;
      snippets.push(`Governing ruler: <mark>${floor.canonical.ruler}</mark>`);
      matchedInFloor = true;
    }
    if (floor.canonical.sound && floor.canonical.sound.toLowerCase().includes(cleanQuery)) {
      score += 8;
      snippets.push(`Primordial sound: <mark>${floor.canonical.sound}</mark>`);
      matchedInFloor = true;
    }
    if (floor.canonical.teachings && floor.canonical.teachings.toLowerCase().includes(cleanQuery)) {
      score += 5;
      const idx = floor.canonical.teachings.toLowerCase().indexOf(cleanQuery);
      const start = Math.max(0, idx - 40);
      const end = Math.min(floor.canonical.teachings.length, idx + query.length + 40);
      snippets.push(`Teachings: "...${floor.canonical.teachings.slice(start, idx)}<mark>${floor.canonical.teachings.slice(idx, idx + query.length)}</mark>${floor.canonical.teachings.slice(idx + query.length, end)}..."`);
      matchedInFloor = true;
    }

    if (floor.comparative) {
      for (let trad in floor.comparative) {
        const comp = floor.comparative[trad];
        if (comp.term && comp.term.toLowerCase().includes(cleanQuery)) {
          score += 7;
          snippets.push(`${trad.toUpperCase()} term: <mark>${comp.term}</mark>`);
          matchedInFloor = true;
        }
        if (comp.description && comp.description.toLowerCase().includes(cleanQuery)) {
          score += 4;
          const idx = comp.description.toLowerCase().indexOf(cleanQuery);
          const start = Math.max(0, idx - 40);
          const end = Math.min(comp.description.length, idx + query.length + 40);
          snippets.push(`${trad.toUpperCase()}: "...${comp.description.slice(start, idx)}<mark>${comp.description.slice(idx, idx + query.length)}</mark>${comp.description.slice(idx + query.length, end)}..."`);
          matchedInFloor = true;
        }
      }
    }

    if (floor.science && floor.science.neuroscience) {
      const neuro = floor.science.neuroscience;
      if (neuro.regions && neuro.regions.some(r => r.toLowerCase().includes(cleanQuery))) {
        score += 8;
        snippets.push(`Brain region: <mark>${neuro.regions.find(r => r.toLowerCase().includes(cleanQuery))}</mark>`);
        matchedInFloor = true;
      }
      if (neuro.networks && neuro.networks.some(n => n.toLowerCase().includes(cleanQuery))) {
        score += 8;
        snippets.push(`Neural network: <mark>${neuro.networks.find(n => n.toLowerCase().includes(cleanQuery))}</mark>`);
        matchedInFloor = true;
      }
      if (neuro.description && neuro.description.toLowerCase().includes(cleanQuery)) {
        score += 4;
        const idx = neuro.description.toLowerCase().indexOf(cleanQuery);
        const start = Math.max(0, idx - 40);
        const end = Math.min(neuro.description.length, idx + query.length + 40);
        snippets.push(`Neuroscience: "...${neuro.description.slice(start, idx)}<mark>${neuro.description.slice(idx, idx + query.length)}</mark>${neuro.description.slice(idx + query.length, end)}..."`);
        matchedInFloor = true;
      }
    }

    if (floor.phenomenology) {
      const phen = floor.phenomenology;
      const fields = [
        { name: 'Emotional Tone', val: phen.emotional_tone },
        { name: 'Visual Texture', val: phen.visual_texture },
        { name: 'Auditory Texture', val: phen.auditory_texture },
        { name: 'Ego Effect', val: phen.ego_effect },
        { name: 'Risks & Pitfalls', val: phen.risks }
      ];

      fields.forEach(field => {
        if (field.val && field.val.toLowerCase().includes(cleanQuery)) {
          score += 5;
          const idx = field.val.toLowerCase().indexOf(cleanQuery);
          const start = Math.max(0, idx - 40);
          const end = Math.min(field.val.length, idx + query.length + 40);
          snippets.push(`Phenomenology (${field.name}): "...${field.val.slice(start, idx)}<mark>${field.val.slice(idx, idx + query.length)}</mark>${field.val.slice(idx + query.length, end)}..."`);
          matchedInFloor = true;
        }
      });
    }

    if (floor.gateway_experience) {
      const gw = floor.gateway_experience;
      if (gw.bridge_note && gw.bridge_note.toLowerCase().includes(cleanQuery)) {
        score += 5;
        const idx = gw.bridge_note.toLowerCase().indexOf(cleanQuery);
        const start = Math.max(0, idx - 40);
        const end = Math.min(gw.bridge_note.length, idx + query.length + 40);
        snippets.push(`Gateway Bridge Note: "...${gw.bridge_note.slice(start, idx)}<mark>${gw.bridge_note.slice(idx, idx + query.length)}</mark>${gw.bridge_note.slice(idx + query.length, end)}..."`);
        matchedInFloor = true;
      }
      if (gw.map_limit_note && gw.map_limit_note.toLowerCase().includes(cleanQuery)) {
        score += 5;
        const idx = gw.map_limit_note.toLowerCase().indexOf(cleanQuery);
        const start = Math.max(0, idx - 40);
        const end = Math.min(gw.map_limit_note.length, idx + query.length + 40);
        snippets.push(`Gateway Map Limit: "...${gw.map_limit_note.slice(start, idx)}<mark>${gw.map_limit_note.slice(idx, idx + query.length)}</mark>${gw.map_limit_note.slice(idx + query.length, end)}..."`);
        matchedInFloor = true;
      }
      if (gw.tapes) {
        gw.tapes.forEach(t => {
          if (t.name && t.name.toLowerCase().includes(cleanQuery)) {
            score += 7;
            snippets.push(`Gateway Tape: <mark>${t.name}</mark> (#${t.tape_num}, Focus ${t.focus})`);
            matchedInFloor = true;
          }
          if (t.description && t.description.toLowerCase().includes(cleanQuery)) {
            score += 4;
            const idx = t.description.toLowerCase().indexOf(cleanQuery);
            const start = Math.max(0, idx - 40);
            const end = Math.min(t.description.length, idx + query.length + 40);
            snippets.push(`Gateway Tape (${t.name}): "...${t.description.slice(start, idx)}<mark>${t.description.slice(idx, idx + query.length)}</mark>${t.description.slice(idx + query.length, end)}..."`);
            matchedInFloor = true;
          }
          if (t.state && t.state.toLowerCase().includes(cleanQuery)) {
            score += 6;
            snippets.push(`Gateway Tape State (${t.name}): <mark>${t.state}</mark>`);
            matchedInFloor = true;
          }
        });
      }
    }

    if (matchedInFloor) {
      matches.push({ floor, score, snippets });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  resultsContainer.innerHTML = '';
  summaryEl.innerHTML = `Found <span>${matches.length}</span> matches for keyword: <span id="search-keyword">"${query}"</span>`;

  if (matches.length === 0) {
    resultsContainer.innerHTML = `
      <div class="card glass" style="text-align:center; padding:3rem;">
        <p style="color:var(--muted);">No matching terms found. Try searching for "bell", "thunder", "vagus", "thalamus", "Soham", or "Nukta".</p>
      </div>
    `;
    return;
  }

  matches.forEach(m => {
    const el = document.createElement('div');
    el.className = 'card glass search-card';
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.onclick = () => selectFloor(m.floor.classification.level);
    el.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    };
    el.innerHTML = `
      <div class="search-card-meta">
        <span>Level ${m.floor.classification.level} · ${m.floor.classification.realm}</span>
        <span style="color:var(--accent)">Score: ${m.score}</span>
      </div>
      <h3 class="search-card-title">${m.floor.canonical_name} <span>(Click to Open)</span></h3>
      <div class="search-card-snippet">
        ${m.snippets.map(s => `<p style="margin-bottom:0.5rem;">${s}</p>`).join('')}
      </div>
    `;
    resultsContainer.appendChild(el);
  });
}
