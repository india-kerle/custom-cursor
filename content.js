// Sparkle Cursor - Content Script
// Injected into all web pages to add sparkle trail effect

(function() {
  'use strict';

  let enabled = false;
  let canvas = null;
  let ctx = null;
  let styleElement = null;
  let animationId = null;
  let mouseX = 0;
  let mouseY = 0;
  let lastX = 0;
  let lastY = 0;
  const particles = [];
  let rainbowHue = 0;
  let mutationObserver = null;

  // Settings with defaults
  let settings = {
    enabled: true,
    color: '#ff69b4',
    shape: 'arrow',
    cursorSize: 24,
    trail: 'sparkles',
    intensity: 5
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

  // Particle class for all trail types
  class Particle {
    constructor(x, y, color, type) {
      this.x = x + (Math.random() - 0.5) * 20;
      this.y = y + (Math.random() - 0.5) * 20;
      this.size = Math.random() * 6 + 2;
      this.color = color;
      this.type = type;
      this.life = 1;
      this.decay = 0.015 + Math.random() * 0.01;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = (Math.random() - 0.5) * 2 + 1;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.05;
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
        // 4-pointed sparkle
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

      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

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

      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 3;

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

      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 3;

      const s = size * 0.5;
      ctx.beginPath();
      // 4-pointed star
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

      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 3;

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

  // Create canvas overlay
  function createCanvas() {
    if (canvas) return;

    canvas = document.createElement('canvas');
    canvas.id = 'sparkle-cursor-canvas';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 2147483647;
    `;
    document.documentElement.appendChild(canvas);
    ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
  }

  // Create style to hide system cursor (aggressive approach)
  function createStyle() {
    if (styleElement) return;

    styleElement = document.createElement('style');
    styleElement.id = 'sparkle-cursor-style';
    // Use extremely aggressive CSS to hide cursor everywhere
    styleElement.textContent = `
      html, html *, html *::before, html *::after,
      body, body *, body *::before, body *::after,
      *, *::before, *::after {
        cursor: none !important;
      }
      html, body {
        cursor: none !important;
      }
      a, button, input, textarea, select, [role="button"], [onclick],
      [class*="btn"], [class*="button"], [class*="link"],
      img, video, canvas, svg, iframe {
        cursor: none !important;
      }
    `;
    document.documentElement.appendChild(styleElement);

    // Also set on html and body directly
    document.documentElement.style.setProperty('cursor', 'none', 'important');
    if (document.body) {
      document.body.style.setProperty('cursor', 'none', 'important');
    }

    // Watch for new elements and hide their cursors too
    if (!mutationObserver) {
      mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.style) {
              node.style.setProperty('cursor', 'none', 'important');
            }
          });
        });
      });
      mutationObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  // Remove canvas and style
  function cleanup() {
    if (canvas) {
      canvas.remove();
      canvas = null;
      ctx = null;
    }
    if (styleElement) {
      styleElement.remove();
      styleElement = null;
    }
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    particles.length = 0;

    // Restore cursor on html and body
    document.documentElement.style.removeProperty('cursor');
    if (document.body) {
      document.body.style.removeProperty('cursor');
    }

    // Stop watching for new elements
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
  }

  // Animation loop
  function animate() {
    if (!enabled || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate distance moved
    const dx = mouseX - lastX;
    const dy = mouseY - lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Spawn particles based on movement (only if trail is selected)
    if (settings.trail && distance > 2) {
      const count = Math.min(Math.floor(settings.intensity * 0.5 * (distance / 10)) + 1, 5);
      for (let i = 0; i < count; i++) {
        // For rainbow, cycle through hues
        let particleColor = settings.color;
        if (settings.trail === 'rainbow') {
          rainbowHue = (rainbowHue + 3) % 360;
          particleColor = hslToHex(rainbowHue, 100, 50);
        }
        particles.push(new Particle(mouseX, mouseY, particleColor, settings.trail));
      }
    }

    lastX = mouseX;
    lastY = mouseY;

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      if (!particles[i].update()) {
        particles.splice(i, 1);
      } else {
        particles[i].draw(ctx);
      }
    }

    // Draw custom cursor on top
    const drawCursor = cursors[settings.shape] || cursors.arrow;
    drawCursor(ctx, mouseX, mouseY, settings.color, settings.cursorSize || 24);

    animationId = requestAnimationFrame(animate);
  }

  // Track mouse position and aggressively hide cursor
  function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Aggressively re-hide cursor on every mouse move (like NSCursor.hide() workaround)
    // This catches cases where the browser temporarily shows the cursor
    const target = e.target;
    if (target && target.style) {
      target.style.setProperty('cursor', 'none', 'important');
    }
  }

  // Enable sparkle cursor (idempotent - safe to call multiple times)
  function enable() {
    createCanvas();
    createStyle();

    if (!enabled) {
      enabled = true;
      document.addEventListener('mousemove', handleMouseMove);
    }

    if (!animationId) {
      animate();
    }
  }

  // Disable sparkle cursor
  function disable() {
    if (!enabled) return;
    enabled = false;

    document.removeEventListener('mousemove', handleMouseMove);
    cleanup();
  }

  // Apply settings update
  function applySettings(newSettings) {
    settings = { ...settings, ...newSettings };

    // Clear particles when trail type changes
    if (newSettings.trail !== undefined) {
      particles.length = 0;
    }

    // Handle enable/disable - always apply current state
    if (settings.enabled) {
      enable();
    } else {
      disable();
    }
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'toggle') {
      applySettings({ enabled: message.enabled });
    } else if (message.type === 'settingsUpdate') {
      applySettings(message.settings);
    }
  });

  // Get initial settings from storage
  chrome.storage.local.get('settings', (result) => {
    if (chrome.runtime.lastError) return;

    if (result.settings) {
      settings = { ...settings, ...result.settings };
    }

    if (settings.enabled) {
      enable();
    }
  });

  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    } else if (!document.hidden && enabled) {
      animate();
    }
  });

})();
