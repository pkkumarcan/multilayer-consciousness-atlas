// ==============================================================================
// Consciousness Atlas - Web Audio Synthesizer Engine
// ==============================================================================

let audioCtx = null;
let stoppableNodes = [];
let connectableNodes = [];
let analyserNode = null;
let masterGainNode = null;
let activeInterval = null;
let isPlaying = false;
let currentFloor = 0;

// Lazy initialize AudioContext on user gesture
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function getAnalyserNode() {
  return analyserNode;
}

export function isAudioPlaying() {
  return isPlaying;
}

export function getCurrentPlayingFloor() {
  return currentFloor;
}

export function setSynthesizerVolume(volume) {
  if (audioCtx && masterGainNode) {
    // Smooth transition to prevent volume pops
    masterGainNode.gain.setTargetAtTime(volume * 0.4, audioCtx.currentTime, 0.15);
  }
}

export function stopCurrentSound() {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }

  // Graceful fade out to prevent clicks/pops
  if (masterGainNode && audioCtx) {
    try {
      masterGainNode.gain.setValueAtTime(masterGainNode.gain.value, audioCtx.currentTime);
      masterGainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    } catch (e) {}
  }

  // Capture the old nodes locally so the async timeout only stops them,
  // preventing a race condition with any newly created nodes!
  const nodesToStop = [...stoppableNodes];
  const nodesToDisconnect = [...connectableNodes];

  // Clear global trackers synchronously
  stoppableNodes = [];
  connectableNodes = [];
  masterGainNode = null;

  // Stop captured old nodes asynchronously after fade-out completes
  setTimeout(() => {
    nodesToStop.forEach(node => {
      try { node.stop(); } catch (e) {}
      try { node.disconnect(); } catch (e) {}
    });
    nodesToDisconnect.forEach(node => {
      try { node.disconnect(); } catch (e) {}
    });
  }, 450);

  isPlaying = false;
  currentFloor = 0;
}

export function playCurrentSound(floorNum, volume = 0.5) {
  const ctx = getAudioContext();
  stopCurrentSound();

  isPlaying = true;
  currentFloor = floorNum;

  // Master Gain and Analyser
  masterGainNode = ctx.createGain();
  masterGainNode.gain.setValueAtTime(0, ctx.currentTime);
  masterGainNode.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 0.2); // Soft start
  masterGainNode.connect(ctx.destination);
  connectableNodes.push(masterGainNode);

  analyserNode = ctx.createAnalyser();
  analyserNode.fftSize = 64;
  analyserNode.connect(masterGainNode);
  connectableNodes.push(analyserNode);

  const soundLower = getSoundDescription(floorNum).toLowerCase();
  
  if (soundLower.includes('silence') || soundLower.includes('quiet')) {
    // Levels 12-18: High-vibrational spatial silence pad
    synthesizeSilencePad(ctx, analyserNode);
  } else if (soundLower.includes('sarangi')) {
    // Level 9: Warm bowing sarangi pad
    synthesizeSarangiPad(ctx, analyserNode);
  } else if (soundLower.includes('shoonya hum')) {
    // Level 10: Sub-audible cosmic hum of Maha Shoonya
    synthesizeMahaShoonyaHum(ctx, analyserNode);
  } else if (soundLower.includes('thunder') || soundLower.includes('mridang')) {
    // Level 8: Rolling cosmic thunder
    synthesizeCosmicThunder(ctx, analyserNode);
  } else if (soundLower.includes('bee') || soundLower.includes('buzz')) {
    // Level 1: Organic honeybee swarm
    synthesizeHoneybeeSwarm(ctx, analyserNode);
  } else if (soundLower.includes('flute') || soundLower.includes('bansuri')) {
    // Level 2 & 11: Resonant microtonal flute melody
    synthesizeMicrotonalFlute(ctx, analyserNode);
  } else if (soundLower.includes('bell') && soundLower.includes('conch')) {
    // Level 7: Combined swelling conch and temple bells
    synthesizeBellAndConch(ctx, analyserNode, floorNum);
  } else if (soundLower.includes('conch') || soundLower.includes('shankh')) {
    // Level 4 & 7: Swelling conch shell horn
    synthesizeConchHorn(ctx, analyserNode);
  } else if (soundLower.includes('bell') || soundLower.includes('ghanta') || soundLower.includes('gong')) {
    // Level 3, 5, 6, 7: Exponential decay temple bells
    synthesizeTempleBell(ctx, analyserNode, floorNum);
  } else {
    // Fallback: Ambient cosmic sine waves
    synthesizeCosmicSine(ctx, analyserNode, floorNum);
  }
}

export function playBinauralBeat(tapeNum, brainwave, hzRange, volume = 0.5) {
  const ctx = getAudioContext();
  stopCurrentSound();

  isPlaying = true;
  currentFloor = -tapeNum; // Negative represents tape

  // Master Gain and Analyser
  masterGainNode = ctx.createGain();
  masterGainNode.gain.setValueAtTime(0, ctx.currentTime);
  masterGainNode.gain.linearRampToValueAtTime(volume * 0.35, ctx.currentTime + 0.3); // Smooth ramp
  masterGainNode.connect(ctx.destination);
  connectableNodes.push(masterGainNode);

  analyserNode = ctx.createAnalyser();
  analyserNode.fftSize = 64;
  analyserNode.connect(masterGainNode);
  connectableNodes.push(analyserNode);

  // Parse average beat frequency
  let beatFreq = 6.0; // Default to Theta 6Hz
  const matches = hzRange.match(/([0-9.]+)[^0-9.]+([0-9.]+)/);
  if (matches) {
    const min = parseFloat(matches[1]);
    const max = parseFloat(matches[2]);
    beatFreq = (min + max) / 2;
  }

  // Base carrier frequency (soothing low sine)
  let baseFreq = 150.0; // Default
  const bwLower = brainwave.toLowerCase();
  if (bwLower.includes('delta')) baseFreq = 100.0;      // Lower carrier for deep delta sleep
  else if (bwLower.includes('theta')) baseFreq = 140.0;
  else if (bwLower.includes('alpha')) baseFreq = 180.0;
  else if (bwLower.includes('beta')) baseFreq = 220.0;
  else if (bwLower.includes('gamma')) baseFreq = 300.0;

  // Create Stereo Channel Merger
  const merger = ctx.createChannelMerger(2);
  merger.connect(analyserNode);
  connectableNodes.push(merger);

  // Left Ear Oscillator (base - beat/2)
  const oscLeft = ctx.createOscillator();
  oscLeft.type = 'sine';
  oscLeft.frequency.setValueAtTime(baseFreq - beatFreq / 2, ctx.currentTime);
  stoppableNodes.push(oscLeft);

  const gainLeft = ctx.createGain();
  gainLeft.gain.setValueAtTime(0.5, ctx.currentTime);
  connectableNodes.push(gainLeft);

  oscLeft.connect(gainLeft);
  gainLeft.connect(merger, 0, 0); // Connect to Left channel

  // Right Ear Oscillator (base + beat/2)
  const oscRight = ctx.createOscillator();
  oscRight.type = 'sine';
  oscRight.frequency.setValueAtTime(baseFreq + beatFreq / 2, ctx.currentTime);
  stoppableNodes.push(oscRight);

  const gainRight = ctx.createGain();
  gainRight.gain.setValueAtTime(0.5, ctx.currentTime);
  connectableNodes.push(gainRight);

  oscRight.connect(gainRight);
  gainRight.connect(merger, 0, 1); // Connect to Right channel

  oscLeft.start();
  oscRight.start();
}

// ── HONEYBEE SWARM SYNTHESIS (LEVEL 1) ──
function synthesizeHoneybeeSwarm(ctx, output) {
  const baseOsc = ctx.createOscillator();
  baseOsc.type = 'sawtooth';
  baseOsc.frequency.setValueAtTime(110, ctx.currentTime); // Low buzz
  stoppableNodes.push(baseOsc);

  const vibrato = ctx.createOscillator();
  vibrato.type = 'sine';
  vibrato.frequency.setValueAtTime(65, ctx.currentTime); // Fast modulation
  stoppableNodes.push(vibrato);

  const vibratoGain = ctx.createGain();
  vibratoGain.gain.setValueAtTime(15, ctx.currentTime);
  connectableNodes.push(vibratoGain);

  vibrato.connect(vibratoGain);
  vibratoGain.connect(baseOsc.frequency);
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(250, ctx.currentTime);
  connectableNodes.push(filter);

  baseOsc.connect(filter);
  filter.connect(output);

  baseOsc.start();
  vibrato.start();
}

// ── TEMPLE BELL SYNTHESIS (LEVELS 3, 5, 6, 7) ──
function synthesizeTempleBell(ctx, output, floorNum) {
  // Additive bell synthesis (f0, 1.2*f0, 1.5*f0, 2*f0)
  const baseFreq = floorNum === 3 ? 220 : floorNum === 5 ? 380 : floorNum === 6 ? 180 : 440;
  const harmonics = [1.0, 1.2, 1.5, 2.0, 2.7, 3.5];
  const gains = [0.5, 0.35, 0.25, 0.15, 0.1, 0.05];

  const oscs = [];
  const gainNodes = [];

  harmonics.forEach((h, idx) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * h, ctx.currentTime);
    stoppableNodes.push(osc);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(gains[idx], ctx.currentTime);
    connectableNodes.push(oscGain);

    osc.connect(oscGain);
    oscGain.connect(output);
    osc.start();

    oscs.push(osc);
    gainNodes.push(oscGain);
  });

  // Echoing bell decay loop
  let count = 0;
  activeInterval = setInterval(() => {
    const time = ctx.currentTime;
    gainNodes.forEach((gn, idx) => {
      gn.gain.setValueAtTime(gains[idx] * (count === 0 ? 1 : 0.4), time);
      gn.gain.exponentialRampToValueAtTime(0.001, time + (4 - idx * 0.5));
    });
    count++;
  }, 4500);

  // Initial strike
  const time = ctx.currentTime;
  gainNodes.forEach((gn, idx) => {
    gn.gain.setValueAtTime(gains[idx], time);
    gn.gain.exponentialRampToValueAtTime(0.001, time + (4.5 - idx * 0.5));
  });
}

// ── SWELLING CONCH HORN SYNTHESIS (LEVELS 4 & 7) ──
function synthesizeConchHorn(ctx, output) {
  const osc1 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(170, ctx.currentTime);
  stoppableNodes.push(osc1);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(171.5, ctx.currentTime); // Chorus detune
  stoppableNodes.push(osc2);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.setValueAtTime(8, ctx.currentTime);
  connectableNodes.push(filter);

  // Sweeping horn filter envelope
  const sweep = () => {
    const time = ctx.currentTime;
    filter.frequency.setValueAtTime(150, time);
    filter.frequency.exponentialRampToValueAtTime(650, time + 2.5);
    filter.frequency.exponentialRampToValueAtTime(150, time + 5.5);
  };
  
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(output);

  osc1.start();
  osc2.start();
  sweep();

  activeInterval = setInterval(sweep, 6000);
}

// ── COMBINED BELL & CONCH SYNTHESIS (LEVEL 7) ──
function synthesizeBellAndConch(ctx, output, floorNum) {
  // 1. Swelling Conch Horn
  const conchOsc1 = ctx.createOscillator();
  conchOsc1.type = 'triangle';
  conchOsc1.frequency.setValueAtTime(150, ctx.currentTime); // Deep spiritual drone
  stoppableNodes.push(conchOsc1);

  const conchOsc2 = ctx.createOscillator();
  conchOsc2.type = 'sine';
  conchOsc2.frequency.setValueAtTime(151.5, ctx.currentTime); // Detuned chorus
  stoppableNodes.push(conchOsc2);

  const conchFilter = ctx.createBiquadFilter();
  conchFilter.type = 'lowpass';
  conchFilter.Q.setValueAtTime(6, ctx.currentTime);
  connectableNodes.push(conchFilter);

  const conchGain = ctx.createGain();
  conchGain.gain.setValueAtTime(0.3, ctx.currentTime); // Attenuated to blend perfectly with bells
  connectableNodes.push(conchGain);

  const conchSweep = () => {
    const time = ctx.currentTime;
    conchFilter.frequency.setValueAtTime(120, time);
    conchFilter.frequency.exponentialRampToValueAtTime(500, time + 2.5);
    conchFilter.frequency.exponentialRampToValueAtTime(120, time + 5.5);
  };

  conchOsc1.connect(conchFilter);
  conchOsc2.connect(conchFilter);
  conchFilter.connect(conchGain);
  conchGain.connect(output);

  conchOsc1.start();
  conchOsc2.start();
  conchSweep();

  // 2. Additive Temple Bells
  const baseFreq = 440; // Vibrant A4 bell chime
  const harmonics = [1.0, 1.2, 1.5, 2.0, 2.7, 3.5];
  const bellGains = [0.4, 0.28, 0.2, 0.12, 0.08, 0.04]; // Slightly attenuated to prevent clipping

  const oscs = [];
  const gainNodes = [];

  harmonics.forEach((h, idx) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * h, ctx.currentTime);
    stoppableNodes.push(osc);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(bellGains[idx], ctx.currentTime);
    connectableNodes.push(oscGain);

    osc.connect(oscGain);
    oscGain.connect(output);
    osc.start();

    oscs.push(osc);
    gainNodes.push(oscGain);
  });

  // Blended restrike and sweep loop
  activeInterval = setInterval(() => {
    const time = ctx.currentTime;
    // Re-strike bells gently
    gainNodes.forEach((gn, idx) => {
      gn.gain.setValueAtTime(bellGains[idx] * 0.45, time);
      gn.gain.exponentialRampToValueAtTime(0.001, time + (4 - idx * 0.5));
    });
    // Sweep conch filter
    conchSweep();
  }, 6000);

  // Initial bell strike
  const time = ctx.currentTime;
  gainNodes.forEach((gn, idx) => {
    gn.gain.setValueAtTime(bellGains[idx], time);
    gn.gain.exponentialRampToValueAtTime(0.001, time + (4.5 - idx * 0.5));
  });
}

// ── ROLLING COSMIC THUNDER SYNTHESIS (LEVEL 8) ──
function synthesizeCosmicThunder(ctx, output) {
  // Generate low frequency white noise rumble
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;
  noiseNode.loop = true;
  stoppableNodes.push(noiseNode);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.setValueAtTime(5, ctx.currentTime);
  filter.frequency.setValueAtTime(35, ctx.currentTime);
  connectableNodes.push(filter);

  const thunderGain = ctx.createGain();
  thunderGain.gain.setValueAtTime(0.05, ctx.currentTime);
  connectableNodes.push(thunderGain);

  noiseNode.connect(filter);
  filter.connect(thunderGain);
  thunderGain.connect(output);
  noiseNode.start();

  // Low frequency thunder rumbling envelope
  const rumble = () => {
    const time = ctx.currentTime;
    const targetFreq = 30 + Math.random() * 45;
    const targetGain = 0.05 + Math.random() * 0.35;
    
    filter.frequency.exponentialRampToValueAtTime(targetFreq, time + 1.2);
    thunderGain.gain.linearRampToValueAtTime(targetGain, time + 0.6);
    thunderGain.gain.linearRampToValueAtTime(0.02, time + 3.0);
  };

  rumble();
  activeInterval = setInterval(rumble, 3500);
}

// ── RESONANT MICROTONAL FLUTE SYNTHESIS (LEVELS 2 & 11) ──
function synthesizeMicrotonalFlute(ctx, output) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(293.66, ctx.currentTime); // D4
  stoppableNodes.push(osc);

  const vibrato = ctx.createOscillator();
  vibrato.type = 'sine';
  vibrato.frequency.setValueAtTime(5.5, ctx.currentTime); // Standard flute vibrato
  stoppableNodes.push(vibrato);

  const vibratoGain = ctx.createGain();
  vibratoGain.gain.setValueAtTime(3.5, ctx.currentTime);
  connectableNodes.push(vibratoGain);

  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(350, ctx.currentTime);
  filter.Q.setValueAtTime(3, ctx.currentTime);
  connectableNodes.push(filter);

  osc.connect(filter);
  filter.connect(output);

  osc.start();
  vibrato.start();

  // Soothing pentatonic melody loops
  const scale = [293.66, 329.63, 392.00, 440.00, 523.25]; // D Major Pentatonic
  let scaleIndex = 0;
  
  activeInterval = setInterval(() => {
    scaleIndex = (scaleIndex + Math.floor(Math.random() * 3) + 1) % scale.length;
    const nextFreq = scale[scaleIndex];
    osc.frequency.setTargetAtTime(nextFreq, ctx.currentTime, 0.45);
  }, 2200);
}

// ── BOWING SARANGI PAD SYNTHESIS (LEVEL 9) ──
function synthesizeSarangiPad(ctx, output) {
  const frequencies = [146.83, 147.2, 220.0, 293.66]; // D3, detuned D3, A3, D4
  const gains = [0.4, 0.3, 0.25, 0.15];
  
  // Lowpass filter with slow resonance modulation
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.setValueAtTime(3, ctx.currentTime);
  filter.frequency.setValueAtTime(350, ctx.currentTime);
  connectableNodes.push(filter);
  
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.25, ctx.currentTime);
  stoppableNodes.push(lfo);
  
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(120, ctx.currentTime);
  connectableNodes.push(lfoGain);
  
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();
  
  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    stoppableNodes.push(osc);
    
    const g = ctx.createGain();
    g.gain.setValueAtTime(gains[idx] * 0.32, ctx.currentTime);
    connectableNodes.push(g);
    
    osc.connect(g);
    g.connect(filter);
    osc.start();
  });
  
  filter.connect(output);
}

// ── MAHA SHOONYA DEEP VOID HUM SYNTHESIS (LEVEL 10) ──
function synthesizeMahaShoonyaHum(ctx, output) {
  // Deep 55 Hz (A1) sine oscillator
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(55, ctx.currentTime);
  stoppableNodes.push(osc1);
  
  // Detuned 55.5 Hz sine oscillator for slow beating
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(55.5, ctx.currentTime);
  stoppableNodes.push(osc2);
  
  const g1 = ctx.createGain();
  g1.gain.setValueAtTime(0.45, ctx.currentTime);
  connectableNodes.push(g1);
  
  osc1.connect(g1);
  osc2.connect(g1);
  
  // Deep resonant lowpass filter
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(75, ctx.currentTime);
  filter.Q.setValueAtTime(5, ctx.currentTime);
  connectableNodes.push(filter);
  
  g1.connect(filter);
  
  // Subtle cosmic void noise (lowpass filtered white noise wind)
  const bufferSize = ctx.sampleRate * 5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;
  noiseNode.loop = true;
  stoppableNodes.push(noiseNode);
  
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(60, ctx.currentTime);
  noiseFilter.Q.setValueAtTime(4, ctx.currentTime);
  connectableNodes.push(noiseFilter);
  
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.015, ctx.currentTime);
  connectableNodes.push(noiseGain);
  
  noiseNode.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  
  // Slow breathing envelope for the void wind
  const rumble = () => {
    const time = ctx.currentTime;
    noiseGain.gain.linearRampToValueAtTime(0.035, time + 2.5);
    noiseGain.gain.linearRampToValueAtTime(0.01, time + 5.0);
  };
  rumble();
  activeInterval = setInterval(rumble, 5000);
  
  filter.connect(output);
  noiseGain.connect(output);
  
  osc1.start();
  osc2.start();
  noiseNode.start();
}

// ── HIGH VIBRATIONAL SILENCE PAD SYNTHESIS (LEVELS 12-18) ──
function synthesizeSilencePad(ctx, output) {
  // Layer three high frequency triangle oscillators with detuning
  const f1 = 880;
  const f2 = 881.5;
  const f3 = 1320; // 5th harmonic

  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(f1, ctx.currentTime);
  stoppableNodes.push(osc1);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(f2, ctx.currentTime);
  stoppableNodes.push(osc2);

  const osc3 = ctx.createOscillator();
  osc3.type = 'triangle';
  osc3.frequency.setValueAtTime(f3, ctx.currentTime);
  stoppableNodes.push(osc3);

  const padGain = ctx.createGain();
  padGain.gain.setValueAtTime(0.04, ctx.currentTime); // Soft presence
  connectableNodes.push(padGain);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, ctx.currentTime);
  connectableNodes.push(filter);

  osc1.connect(filter);
  osc2.connect(filter);
  osc3.connect(padGain);
  padGain.connect(filter);
  filter.connect(output);

  osc1.start();
  osc2.start();
  osc3.start();

  // Extremely slow atmospheric filter sweep
  const sweep = () => {
    const time = ctx.currentTime;
    filter.frequency.exponentialRampToValueAtTime(700, time + 6.0);
    filter.frequency.exponentialRampToValueAtTime(1400, time + 12.0);
  };
  sweep();
  activeInterval = setInterval(sweep, 12000);
}

// ── FALLBACK SINE GENERATOR ──
function synthesizeCosmicSine(ctx, output, floorNum) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220 + floorNum * 15, ctx.currentTime);
  stoppableNodes.push(osc);
  
  osc.connect(output);
  osc.start();
}

// Helper mapping floor numbers to sound descriptions
function getSoundDescription(floorNum) {
  const soundMapping = {
    1: "buzzing honeybee",
    2: "flute conch",
    3: "temple bells",
    4: "conch shell blast",
    5: "crystal bell chimes",
    6: "temple bell resonant",
    7: "big bells and conch",
    8: "rolling cosmic thunder",
    9: "sarangi string pad",
    10: "maha shoonya hum",
    11: "mystical flute melody",
    12: "cosmic voice pad",
    13: "formless silence",
    14: "divine silence",
    15: "nameless silence",
    16: "secret silence",
    17: "transcendent silence",
    18: "absolute supreme silence"
  };
  return soundMapping[floorNum] || "ambient cosmic current";
}

// Global Tab visibility listener to suspend/resume AudioContext automatically
document.addEventListener('visibilitychange', () => {
  if (audioCtx) {
    if (document.hidden) {
      audioCtx.suspend();
    } else if (isPlaying) {
      audioCtx.resume();
    }
  }
});
