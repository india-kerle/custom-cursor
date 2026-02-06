// Sparkle Cursor - Popup Settings Controller

const defaultSettings = {
  enabled: true,
  color: '#ff69b4',
  shape: 'arrow',
  cursorSize: 24,
  trail: 'sparkles',
  intensity: 5
};

let settings = { ...defaultSettings };
let previewParticles = [];
let previewMouseX = 0;
let previewMouseY = 0;
let lastPreviewX = 0;
let lastPreviewY = 0;
let previewCanvas, previewCtx;
let rainbowHue = 0;

// Particle class for preview
class Particle {
  constructor(x, y, color, type) {
    this.x = x + (Math.random() - 0.5) * 15;
    this.y = y + (Math.random() - 0.5) * 15;
    this.size = Math.random() * 5 + 2;
    this.color = color;
    this.type = type;
    this.life = 1;
    this.decay = 0.02 + Math.random() * 0.01;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5 + 0.5;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.15;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.03;
    this.life -= this.decay;
    this.rotation += this.rotationSpeed;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;

    const size = this.size * this.life;

    if (this.type === 'sparkles' || this.type === 'rainbow') {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI * 2) / 4 - Math.PI / 2;
        const outerX = Math.cos(angle) * size;
        const outerY = Math.sin(angle) * size;
        const innerAngle = angle + Math.PI / 4;
        const innerX = Math.cos(innerAngle) * (size * 0.3);
        const innerY = Math.sin(innerAngle) * (size * 0.3);
        if (i === 0) ctx.moveTo(outerX, outerY);
        else ctx.lineTo(outerX, outerY);
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'hearts') {
      const s = size * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(-s, -s * 0.5, -s, s * 0.5, 0, s);
      ctx.bezierCurveTo(s, s * 0.5, s, -s * 0.5, 0, s * 0.3);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Cursor drawing functions
const cursors = {
  arrow: (ctx, x, y, color, size) => {
    ctx.save();
    ctx.translate(x, y);
    const scale = size / 24;
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 21);
    ctx.lineTo(4.5, 16.5);
    ctx.lineTo(8, 24);
    ctx.lineTo(11, 23);
    ctx.lineTo(7.5, 15);
    ctx.lineTo(14, 15);
    ctx.closePath();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  },
  heart: (ctx, x, y, color, size) => {
    ctx.save();
    ctx.translate(x, y);
    const s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s * 1.2, -s * 0.6, -s * 1.2, s * 0.6, 0, s * 1.2);
    ctx.bezierCurveTo(s * 1.2, s * 0.6, s * 1.2, -s * 0.6, 0, s * 0.3);
    ctx.closePath();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  },
  sparkle: (ctx, x, y, color, size) => {
    ctx.save();
    ctx.translate(x, y);
    const s = size * 0.5;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI * 2) / 4 - Math.PI / 2;
      const outerX = Math.cos(angle) * s;
      const outerY = Math.sin(angle) * s;
      const innerAngle = angle + Math.PI / 4;
      const innerX = Math.cos(innerAngle) * (s * 0.3);
      const innerY = Math.sin(innerAngle) * (s * 0.3);
      if (i === 0) ctx.moveTo(outerX, outerY);
      else ctx.lineTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  },
  pointer: (ctx, x, y, color, size) => {
    ctx.save();
    ctx.translate(x, y);
    const scale = size / 24;
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(8, 2);
    ctx.quadraticCurveTo(4, 2, 4, 7);
    ctx.lineTo(4, 14);
    ctx.lineTo(2, 12);
    ctx.quadraticCurveTo(-1, 10, -1, 14);
    ctx.quadraticCurveTo(-1, 17, 2, 20);
    ctx.lineTo(8, 26);
    ctx.quadraticCurveTo(12, 26, 14, 22);
    ctx.lineTo(14, 12);
    ctx.quadraticCurveTo(14, 9, 12, 9);
    ctx.lineTo(12, 7);
    ctx.quadraticCurveTo(12, 2, 8, 2);
    ctx.closePath();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }
};

// HSL to hex helper for rainbow
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const stored = await chrome.storage.local.get('settings');
  if (stored.settings) {
    settings = { ...defaultSettings, ...stored.settings };
  }

  // Get elements
  const enabledToggle = document.getElementById('enabled-toggle');
  const toggleLabel = document.getElementById('toggle-label');
  const colorPicker = document.getElementById('color-picker');
  const colorLabel = document.getElementById('color-label');
  const sizeSlider = document.getElementById('size-slider');
  const sizeValue = document.getElementById('size-value');
  const intensitySlider = document.getElementById('intensity-slider');
  const intensityValue = document.getElementById('intensity-value');
  const shapeBtns = document.querySelectorAll('#shape-group .option-btn');
  const trailBtns = document.querySelectorAll('#trail-group .option-btn');
  previewCanvas = document.getElementById('preview-canvas');
  previewCtx = previewCanvas.getContext('2d');

  // Set canvas size
  previewCanvas.width = previewCanvas.offsetWidth * 2;
  previewCanvas.height = previewCanvas.offsetHeight * 2;
  previewCtx.scale(2, 2);

  // Toggle label helper
  function updateToggleLabel(enabled) {
    toggleLabel.textContent = enabled ? 'on ✨' : 'off';
    toggleLabel.style.color = enabled ? '#228b22' : '#999';
  }

  // Apply saved settings to UI
  enabledToggle.checked = settings.enabled;
  updateToggleLabel(settings.enabled);
  colorPicker.value = settings.color;
  colorLabel.textContent = settings.color;
  sizeSlider.value = settings.cursorSize;
  sizeValue.textContent = settings.cursorSize;
  intensitySlider.value = settings.intensity;
  intensityValue.textContent = settings.intensity;

  shapeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.shape === settings.shape);
  });

  trailBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.trail === settings.trail);
  });

  // Event listeners
  enabledToggle.addEventListener('change', () => {
    settings.enabled = enabledToggle.checked;
    updateToggleLabel(settings.enabled);
    saveAndBroadcast();
  });

  colorPicker.addEventListener('input', () => {
    settings.color = colorPicker.value;
    colorLabel.textContent = colorPicker.value;
    saveAndBroadcast();
  });

  sizeSlider.addEventListener('input', () => {
    settings.cursorSize = parseInt(sizeSlider.value);
    sizeValue.textContent = settings.cursorSize;
    saveAndBroadcast();
  });

  intensitySlider.addEventListener('input', () => {
    settings.intensity = parseInt(intensitySlider.value);
    intensityValue.textContent = settings.intensity;
    saveAndBroadcast();
  });

  shapeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      shapeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      settings.shape = btn.dataset.shape;
      saveAndBroadcast();
    });
  });

  // Trail buttons - toggle behavior (click active to deselect)
  trailBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const isActive = btn.classList.contains('active');
      trailBtns.forEach(b => b.classList.remove('active'));

      if (isActive) {
        settings.trail = null;
      } else {
        btn.classList.add('active');
        settings.trail = btn.dataset.trail;
      }
      previewParticles = [];
      saveAndBroadcast();
    });
  });

  // Start preview animation
  previewMouseX = previewCanvas.offsetWidth / 2;
  previewMouseY = previewCanvas.offsetHeight / 2;
  renderPreview();
});

// Save settings and broadcast to tabs
async function saveAndBroadcast() {
  await chrome.storage.local.set({ settings });

  // Notify all tabs immediately
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, { type: 'settingsUpdate', settings }).catch(() => {});
  });
}

// Preview animation
function renderPreview() {
  const width = previewCanvas.offsetWidth;
  const height = previewCanvas.offsetHeight;

  previewCtx.clearRect(0, 0, width, height);

  // Animate mouse position in a figure-8
  const time = Date.now() / 1000;
  const targetX = width / 2 + Math.sin(time * 1.5) * (width * 0.3);
  const targetY = height / 2 + Math.sin(time * 3) * (height * 0.25);

  previewMouseX += (targetX - previewMouseX) * 0.1;
  previewMouseY += (targetY - previewMouseY) * 0.1;

  // Spawn particles if trail is selected
  if (settings.trail) {
    const dx = previewMouseX - lastPreviewX;
    const dy = previewMouseY - lastPreviewY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 1) {
      const count = Math.min(Math.floor(settings.intensity * 0.3 * (distance / 5)) + 1, 3);
      for (let i = 0; i < count; i++) {
        let particleColor = settings.color;
        if (settings.trail === 'rainbow') {
          rainbowHue = (rainbowHue + 5) % 360;
          particleColor = hslToHex(rainbowHue, 100, 50);
        }
        previewParticles.push(new Particle(previewMouseX, previewMouseY, particleColor, settings.trail));
      }
    }
  }

  lastPreviewX = previewMouseX;
  lastPreviewY = previewMouseY;

  // Update and draw particles
  for (let i = previewParticles.length - 1; i >= 0; i--) {
    if (!previewParticles[i].update()) {
      previewParticles.splice(i, 1);
    } else {
      previewParticles[i].draw(previewCtx);
    }
  }

  // Draw cursor with dynamic size
  const drawCursor = cursors[settings.shape] || cursors.arrow;
  const previewSize = settings.cursorSize * 0.8; // Slightly smaller in preview
  drawCursor(previewCtx, previewMouseX, previewMouseY, settings.color, previewSize);

  requestAnimationFrame(renderPreview);
}
