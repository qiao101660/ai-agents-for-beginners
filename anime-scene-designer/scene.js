const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

const presets = {
  '黄昏校园': { skyA: '#ffa57a', skyB: '#6c6cc8', city: '#2f3358', accent: '#ffd38a' },
  '雨夜都市': { skyA: '#2f3c66', skyB: '#111626', city: '#1c2440', accent: '#6bc6ff' },
  '海边清晨': { skyA: '#a8e1ff', skyB: '#5ba7d1', city: '#547a92', accent: '#fff2be' },
  '赛博街区': { skyA: '#362d72', skyB: '#101020', city: '#1a1638', accent: '#ff5fd2' }
};

const els = {
  preset: document.getElementById('preset'),
  resolution: document.getElementById('resolution'),
  time: document.getElementById('time'),
  weather: document.getElementById('weather'),
  style: document.getElementById('style'),
  depth: document.getElementById('depth'),
  randomize: document.getElementById('randomize'),
  download: document.getElementById('download'),
  layerBg: document.getElementById('layer-bg'),
  layerCity: document.getElementById('layer-city'),
  layerFx: document.getElementById('layer-fx'),
  layerGlow: document.getElementById('layer-glow'),
  characterFile: document.getElementById('character-file'),
  characterScale: document.getElementById('character-scale'),
  characterX: document.getElementById('character-x')
};

let characterImage = null;

Object.keys(presets).forEach(k => {
  const op = document.createElement('option');
  op.value = k;
  op.textContent = k;
  els.preset.appendChild(op);
});
els.preset.value = Object.keys(presets)[0];

els.resolution.addEventListener('change', () => {
  const [w, h] = els.resolution.value.split('x').map(Number);
  canvas.width = w;
  canvas.height = h;
  draw();
});

[els.preset, els.time, els.weather, els.style, els.depth, els.layerBg, els.layerCity, els.layerFx, els.layerGlow, els.characterScale, els.characterX]
  .forEach(el => el.addEventListener('input', draw));

els.characterFile.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      characterImage = img;
      draw();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

els.randomize.onclick = () => {
  els.preset.selectedIndex = Math.floor(Math.random() * els.preset.options.length);
  els.time.value = Math.floor(Math.random() * 101);
  els.weather.value = Math.floor(Math.random() * 101);
  els.style.value = Math.floor(Math.random() * 101);
  els.depth.value = Math.floor(Math.random() * 21);
  draw();
};

els.download.onclick = () => {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `anime-scene-${canvas.width}x${canvas.height}-${Date.now()}.png`;
  a.click();
};

function draw() {
  const p = presets[els.preset.value];
  const t = Number(els.time.value) / 100;
  const weather = Number(els.weather.value) / 100;
  const style = Number(els.style.value) / 100;
  const blur = Number(els.depth.value);

  if (els.layerBg.checked) {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, lerpColor(p.skyA, '#0a0c12', 1 - t));
    g.addColorStop(1, lerpColor(p.skyB, '#020305', 1 - t * 0.8));
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = '#0d1017';
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (els.layerCity.checked) {
    ctx.filter = `blur(${blur}px)`;
    for (let i = 0; i < 25; i++) {
      const x = (i / 25) * canvas.width;
      const w = 40 + Math.random() * 70;
      const h = 140 + Math.random() * (canvas.height * 0.3);
      ctx.fillStyle = lerpColor(p.city, '#121522', 0.4 + style * 0.5);
      ctx.fillRect(x, canvas.height - h - canvas.height * 0.15, w, h);
    }
    ctx.filter = 'none';
  }

  ctx.fillStyle = 'rgba(10,10,16,0.78)';
  ctx.fillRect(0, canvas.height * 0.78, canvas.width, canvas.height * 0.22);

  if (els.layerFx.checked) {
    const particles = 240;
    for (let i = 0; i < particles; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const alpha = 0.15 + Math.random() * 0.6;
      ctx.fillStyle = `rgba(255,255,255,${alpha * weather})`;
      if (weather > 0.35) ctx.fillRect(x, y, 1, 8 + weather * 12);
      else {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (els.layerGlow.checked) {
    const glow = ctx.createRadialGradient(canvas.width * 0.7, canvas.height * 0.5, 20, canvas.width * 0.7, canvas.height * 0.5, canvas.width * 0.2);
    glow.addColorStop(0, `${p.accent}bb`);
    glow.addColorStop(1, `${p.accent}00`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (characterImage) {
    const targetW = canvas.width * (Number(els.characterScale.value) / 100);
    const ratio = characterImage.height / characterImage.width;
    const targetH = targetW * ratio;
    const centerX = canvas.width * (Number(els.characterX.value) / 100);
    const x = centerX - targetW / 2;
    const y = canvas.height - targetH - canvas.height * 0.06;
    ctx.drawImage(characterImage, x, y, targetW, targetH);
  }
}

function lerpColor(a, b, t) {
  const ah = +('0x' + a.slice(1));
  const bh = +('0x' + b.slice(1));
  const ar = ah >> 16, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = bh >> 16, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = ar + t * (br - ar);
  const rg = ag + t * (bg - ag);
  const rb = ab + t * (bb - ab);
  return `#${(((1 << 24) + (rr << 16) + (rg << 8) + rb) | 0).toString(16).slice(1)}`;
}

draw();
