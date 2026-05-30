import { state } from './state.js';
import { selectFloor } from './ui.js';

let zoomScale = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let rafId = null;

export function setupGraph() {
  const svg = document.getElementById('graphSvg');
  const group = document.getElementById('graphGroup');
  group.innerHTML = '';

  if (!state.graphData.nodes || !state.graphData.edges) return;

  const nodeMap = {};
  const floorNodes = state.graphData.nodes.filter(n => n.type === 'Floor').sort((a,b) => b.level - a.level);
  const otherNodes = state.graphData.nodes.filter(n => n.type !== 'Floor');

  floorNodes.forEach((node, idx) => {
    const x = 120;
    const y = 80 + idx * 60;
    nodeMap[node.id] = { x, y, node };
  });

  otherNodes.forEach((node, idx) => {
    const connectingEdge = state.graphData.edges.find(e => e.target === node.id || e.source === node.id);
    let parentFloorId = 'floor_1';
    if (connectingEdge) {
      parentFloorId = connectingEdge.source.startsWith('floor_') ? connectingEdge.source : connectingEdge.target;
    }
    const parent = nodeMap[parentFloorId] || nodeMap['floor_1'];
    
    let angleOffset = 0;
    let radius = 160;

    if (node.type === 'Sound') { angleOffset = -0.4; radius = 130; }
    else if (node.type === 'Ruler') { angleOffset = -0.2; radius = 130; }
    else if (node.type === 'Comparative') {
      const tradIndex = ['sikhism', 'sufism', 'vedic', 'hindu_tantra', 'buddhism', 'taoism', 'kabbalah', 'gnosticism', 'jainism'].indexOf(node.tradition);
      const levelOffset = (parent.node.level % 4) * 0.05 - 0.075;
      angleOffset = 0.05 + (tradIndex * 0.1) + levelOffset;
      radius = 180 + (parent.node.level % 3) * 12; // Vary radius to stagger and prevent overlaps
    } else if (node.type === 'BrainRegion' || node.type === 'BrainNetwork') {
      angleOffset = -0.6;
      radius = 210;
    } else if (node.type === 'Gateway') {
      angleOffset = 0.25;
      radius = 150;
    }

    const angle = angleOffset * Math.PI;
    const x = parent.x + radius * Math.cos(angle);
    const y = parent.y + radius * Math.sin(angle);
    nodeMap[node.id] = { x, y, node };
  });

  state.graphData.edges.forEach(edge => {
    const source = nodeMap[edge.source];
    const target = nodeMap[edge.target];
    if (source && target) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const midX = (source.x + target.x) / 2;
      const d = `M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`;
      path.setAttribute('d', d);
      path.setAttribute('class', `edge-path edge-from-${edge.source} edge-to-${edge.target}`);
      path.setAttribute('data-source-type', source.node.type);
      path.setAttribute('data-target-type', target.node.type);
      group.appendChild(path);
    }
  });

  for (let id in nodeMap) {
    const item = nodeMap[id];
    
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${item.node.type}: ${item.node.name}`;
    g.appendChild(title);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', item.x);
    circle.setAttribute('cy', item.y);
    circle.setAttribute('tabindex', '0');
    circle.setAttribute('role', 'button');
    circle.setAttribute('aria-label', `${item.node.name}`);
    
    let radius = 6;
    let fill = '#3B6D11';
    if (item.node.type === 'Floor') {
      radius = 9;
      fill = '#A32D2D';
      if (item.node.realm === 'Brahmanda') fill = '#7f77dd';
      else if (item.node.realm === 'Dayal Desh') fill = '#0f6e56';
    } else if (item.node.type === 'Sound') {
      fill = '#8fa3b8';
    } else if (item.node.type === 'Ruler') {
      fill = '#c4a96a';
    } else if (item.node.type === 'BrainRegion' || item.node.type === 'BrainNetwork') {
      fill = '#1D9E75';
    } else if (item.node.type === 'Gateway') {
      fill = '#22c55e';
      radius = 7;
    }

    circle.setAttribute('r', radius);
    circle.setAttribute('fill', fill);
    circle.setAttribute('class', `node-circle type-${item.node.type} ${id === 'floor_1' ? 'active-node' : ''}`);
    circle.setAttribute('id', `node-circle-${id}`);
    
    circle.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        circle.click();
      }
    };

    circle.onclick = () => {
      document.querySelectorAll('.node-circle').forEach(c => c.classList.remove('active-node'));
      circle.classList.add('active-node');
      
      if (item.node.type === 'Floor') {
        selectFloor(item.node.level);
      } else {
        document.querySelectorAll('.edge-path').forEach(p => p.classList.remove('highlighted-edge'));
        document.querySelectorAll(`.edge-from-${id}, .edge-to-${id}`).forEach(p => p.classList.add('highlighted-edge'));
      }
    };

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', item.x + 12);
    text.setAttribute('y', item.y + 4);
    text.setAttribute('class', 'node-label');
    
    let displayName = item.node.name;
    if (displayName.length > 24) displayName = displayName.slice(0, 22) + '...';
    text.textContent = displayName;

    g.appendChild(circle);
    g.appendChild(text);
    group.appendChild(g);
  }

  function updateTransform() {
    group.setAttribute('transform', `translate(${panX}, ${panY}) scale(${zoomScale})`);
    rafId = null;
  }

  svg.onmousedown = (e) => {
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    svg.style.cursor = 'grabbing';
  };

  window.addEventListener('mouseup', () => {
    isDragging = false;
    svg.style.cursor = 'grab';
  });

  svg.onmousemove = (e) => {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    if (!rafId) {
      rafId = requestAnimationFrame(updateTransform);
    }
  };

  svg.onwheel = (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
      zoomScale *= zoomFactor;
    } else {
      zoomScale /= zoomFactor;
    }
    zoomScale = Math.max(0.5, Math.min(3, zoomScale));
    if (!rafId) {
      rafId = requestAnimationFrame(updateTransform);
    }
  };

  // Touch & Pinch support for Graph SVG
  let touchStartDist = 0;
  let baseZoom = 1;
  let touchStartX = 0;
  let touchStartY = 0;

  svg.ontouchstart = (e) => {
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
      baseZoom = zoomScale;
      touchStartX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      touchStartY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
  };

  svg.ontouchmove = (e) => {
    if (isDragging && e.touches.length === 1) {
      panX = e.touches[0].clientX - startX;
      panY = e.touches[0].clientY - startY;
      if (!rafId) {
        rafId = requestAnimationFrame(updateTransform);
      }
      e.preventDefault();
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist;
      zoomScale = Math.max(0.5, Math.min(3, baseZoom * factor));
      
      // Keep center of pinch stable
      const currentTouchX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const currentTouchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      panX += (currentTouchX - touchStartX);
      panY += (currentTouchY - touchStartY);
      touchStartX = currentTouchX;
      touchStartY = currentTouchY;

      if (!rafId) {
        rafId = requestAnimationFrame(updateTransform);
      }
      e.preventDefault();
    }
  };

  svg.ontouchend = () => {
    isDragging = false;
  };

  // Apply filters initially
  toggleGraphFilter();
}

export function toggleGraphFilter() {
  const floorChecked = document.getElementById('filter-node-Floor')?.checked !== false;
  const rulerChecked = document.getElementById('filter-node-Ruler')?.checked !== false;
  const soundChecked = document.getElementById('filter-node-Sound')?.checked !== false;
  const brainChecked = document.getElementById('filter-node-Brain')?.checked !== false;
  const compChecked = document.getElementById('filter-node-Comparative')?.checked !== false;
  const gatewayChecked = document.getElementById('filter-node-Gateway')?.checked !== false;

  const visibleTypes = new Set();
  if (floorChecked) visibleTypes.add('Floor');
  if (rulerChecked) visibleTypes.add('Ruler');
  if (soundChecked) visibleTypes.add('Sound');
  if (brainChecked) {
    visibleTypes.add('BrainRegion');
    visibleTypes.add('BrainNetwork');
  }
  if (compChecked) visibleTypes.add('Comparative');
  if (gatewayChecked) visibleTypes.add('Gateway');

  // Node groups
  document.querySelectorAll('#graphGroup g').forEach(g => {
    const circle = g.querySelector('.node-circle');
    if (circle) {
      let isVisible = false;
      circle.classList.forEach(cls => {
        if (cls.startsWith('type-')) {
          const type = cls.split('type-')[1];
          if (visibleTypes.has(type)) {
            isVisible = true;
          }
        }
      });
      g.style.opacity = isVisible ? '1' : '0.12';
      g.style.pointerEvents = isVisible ? 'auto' : 'none';
      g.style.transition = 'opacity 0.3s ease';
    }
  });

  // Edges
  document.querySelectorAll('.edge-path').forEach(path => {
    const sType = path.getAttribute('data-source-type');
    const tType = path.getAttribute('data-target-type');
    const isVisible = visibleTypes.has(sType) && visibleTypes.has(tType);
    
    path.style.opacity = isVisible ? '1' : '0.04';
    path.style.transition = 'opacity 0.3s ease';
  });
}
