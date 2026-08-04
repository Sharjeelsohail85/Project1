(function () {
  let currentColorSpace = 'oklch';
  let postMessageTimeout = null;
  let lastEmittedColor = null;

  function normalizeHex(hex) {
    if (!hex) return '#000000';
    let clean = hex.trim().replace(/^#/, '');
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    if (clean.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(clean)) {
      return null;
    }
    return `#${clean.toUpperCase()}`;
  }

  function hexToRgb(hex) {
    const norm = normalizeHex(hex) || '#000000';
    const num = parseInt(norm.replace(/^#/, ''), 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function rgbToHex(r, g, b) {
    const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  function blendColors(c1, c2, ratio1) {
    const rgb1 = hexToRgb(c1);
    const rgb2 = hexToRgb(c2);
    const w1 = Math.max(0, Math.min(100, ratio1)) / 100;
    const w2 = 1 - w1;

    const r = rgb1.r * w1 + rgb2.r * w2;
    const g = rgb1.g * w1 + rgb2.g * w2;
    const b = rgb1.b * w1 + rgb2.b * w2;

    return rgbToHex(r, g, b);
  }

  function adjustBrightness(hex, percent) {
    const rgb = hexToRgb(hex);
    const p = percent / 100;
    const r = p > 0 ? rgb.r + (255 - rgb.r) * p : rgb.r * (1 + p);
    const g = p > 0 ? rgb.g + (255 - rgb.g) * p : rgb.g * (1 + p);
    const b = p > 0 ? rgb.b + (255 - rgb.b) * p : rgb.b * (1 + p);
    return rgbToHex(r, g, b);
  }

  function emitColor(hex, immediate = false) {
    if (!hex || hex === lastEmittedColor) return;
    if (immediate) {
      if (postMessageTimeout) clearTimeout(postMessageTimeout);
      postMessageTimeout = null;
      lastEmittedColor = hex;
      if (window.parent) {
        window.parent.postMessage({ source: 'color-mixology-exact', color: hex }, '*');
      }
      return;
    }

    if (postMessageTimeout) return;
    postMessageTimeout = setTimeout(() => {
      postMessageTimeout = null;
      lastEmittedColor = hex;
      if (window.parent) {
        window.parent.postMessage({ source: 'color-mixology-exact', color: hex }, '*');
      }
    }, 120);
  }

  let rafId = null;

  function updateMixology(immediate = false) {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const c1Picker = document.getElementById('color1Input');
      const c2Picker = document.getElementById('color2Input');
      const c1Text = document.getElementById('color1Text');
      const c2Text = document.getElementById('color2Text');
      const r1Slider = document.getElementById('ratio1Slider');
      const r2Slider = document.getElementById('ratio2Slider');

      if (!c1Picker || !c2Picker || !r1Slider || !r2Slider) return;

      let c1 = c1Picker.value;
      let c2 = c2Picker.value;
      const ratio1 = parseInt(r1Slider.value, 10);
      const ratio2 = 100 - ratio1;

      r2Slider.value = ratio2;

      const r1ValEl = document.getElementById('ratio1Val');
      const r2ValEl = document.getElementById('ratio2Val');
      if (r1ValEl) r1ValEl.textContent = ratio1 + '%';
      if (r2ValEl) r2ValEl.textContent = ratio2 + '%';

      if (c1Text && document.activeElement !== c1Text) {
        c1Text.value = c1.toUpperCase();
      }
      if (c2Text && document.activeElement !== c2Text) {
        c2Text.value = c2.toUpperCase();
      }

      // Blend result
      const blendedHex = blendColors(c1, c2, ratio1);
      const midHex = blendColors(c1, c2, 50);

      // Liquid Visuals & SVG elements
      const liquidStop1 = document.getElementById('liquidStop1');
      const liquidStopMid = document.getElementById('liquidStopMid');
      const liquidStop2 = document.getElementById('liquidStop2');
      const liquidSurface = document.getElementById('liquidSurface');
      const auraGlow = document.getElementById('auraGlow');
      const resultSwatch = document.getElementById('resultSwatch');
      const resultHexText = document.getElementById('resultHex');

      if (liquidStop1) liquidStop1.setAttribute('stop-color', c1);
      if (liquidStopMid) liquidStopMid.setAttribute('stop-color', midHex);
      if (liquidStop2) liquidStop2.setAttribute('stop-color', c2);
      if (liquidSurface) liquidSurface.setAttribute('fill', blendedHex);
      if (auraGlow) {
        auraGlow.setAttribute('fill', blendedHex);
      }

      if (resultSwatch) {
        resultSwatch.style.backgroundColor = blendedHex;
        resultSwatch.style.borderColor = adjustBrightness(blendedHex, 35);
        resultSwatch.style.boxShadow = `0 0 14px ${blendedHex}`;
      }

      if (resultHexText) {
        resultHexText.textContent = blendedHex;
      }

      // Spectrum Bar
      const spectrumBar = document.getElementById('spectrumBar');
      if (spectrumBar) {
        spectrumBar.style.background = `linear-gradient(to right, ${c1}, ${midHex}, ${c2})`;
      }

      // Swatches (5 spectrum steps: 100%, 75%, 50%, 25%, 0%) - reuse elements
      const swatchRow = document.getElementById('swatchRow');
      if (swatchRow) {
        const steps = [100, 75, 50, 25, 0];
        let existing = swatchRow.querySelectorAll('.swatch-item');
        if (existing.length !== steps.length) {
          swatchRow.innerHTML = '';
          steps.forEach((stepRatio) => {
            const swatch = document.createElement('div');
            swatch.className = 'swatch-item';
            swatchRow.appendChild(swatch);
          });
          existing = swatchRow.querySelectorAll('.swatch-item');
        }

        steps.forEach((stepRatio, idx) => {
          const stepHex = blendColors(c1, c2, stepRatio);
          const swatch = existing[idx];
          if (swatch) {
            swatch.style.backgroundColor = stepHex;
            swatch.title = `Mix ratio ${stepRatio}% / ${100 - stepRatio}%: ${stepHex}`;
            swatch.onclick = () => {
              emitColor(stepHex, true);
            };
          }
        });
      }

      // Formula Code Output
      const formulaCode = document.getElementById('cssFormulaCode');
      if (formulaCode) {
        formulaCode.textContent = `color-mix(in ${currentColorSpace}, ${c1.toUpperCase()} ${ratio1}%, ${c2.toUpperCase()} ${ratio2}%)`;
      }

      // Emit color change to parent website theme
      emitColor(blendedHex, immediate);
    });
  }

  // Bind color input events
  const c1Picker = document.getElementById('color1Input');
  const c2Picker = document.getElementById('color2Input');
  const c1Text = document.getElementById('color1Text');
  const c2Text = document.getElementById('color2Text');
  const r1Slider = document.getElementById('ratio1Slider');

  if (c1Picker) {
    c1Picker.addEventListener('input', () => updateMixology(false));
    c1Picker.addEventListener('change', () => updateMixology(true));
  }
  if (c2Picker) {
    c2Picker.addEventListener('input', () => updateMixology(false));
    c2Picker.addEventListener('change', () => updateMixology(true));
  }
  if (r1Slider) {
    r1Slider.addEventListener('input', () => updateMixology(false));
    r1Slider.addEventListener('change', () => updateMixology(true));
  }

  if (c1Text) {
    c1Text.addEventListener('input', (e) => {
      const norm = normalizeHex(e.target.value);
      if (norm && c1Picker) {
        c1Picker.value = norm;
        updateMixology(false);
      }
    });
  }

  if (c2Text) {
    c2Text.addEventListener('input', (e) => {
      const norm = normalizeHex(e.target.value);
      if (norm && c2Picker) {
        c2Picker.value = norm;
        updateMixology(false);
      }
    });
  }

  // Color Space Tab Buttons
  const spaceBtns = document.querySelectorAll('.space-btn');
  spaceBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      spaceBtns.forEach((b) => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentColorSpace = e.currentTarget.dataset.space || 'oklch';
      updateMixology(true);
    });
  });

  // Presets
  const presetBtns = document.querySelectorAll('.preset-card');
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const c1 = e.currentTarget.dataset.c1;
      const c2 = e.currentTarget.dataset.c2;
      const ratio = parseInt(e.currentTarget.dataset.r || '50', 10);
      if (c1 && c2) {
        if (c1Picker) c1Picker.value = c1;
        if (c2Picker) c2Picker.value = c2;
        if (r1Slider) r1Slider.value = ratio;
        updateMixology(true);
      }
    });
  });

  // Copy CSS Formula Button
  const copyBtn = document.getElementById('copyCssBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const formulaCode = document.getElementById('cssFormulaCode');
      if (formulaCode) {
        navigator.clipboard.writeText(formulaCode.textContent).then(() => {
          const origText = copyBtn.innerHTML;
          copyBtn.innerHTML = '<i class="material-icons">check</i> Copied!';
          setTimeout(() => {
            copyBtn.innerHTML = origText;
          }, 2000);
        });
      }
    });
  }

  // Apply Theme Button
  const applyBtn = document.getElementById('applyThemeBtn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const resultHex = document.getElementById('resultHex')?.textContent;
      if (resultHex) {
        emitColor(resultHex, true);
        const origText = applyBtn.innerHTML;
        applyBtn.innerHTML = '<i class="material-icons">check</i> Applied!';
        setTimeout(() => {
          applyBtn.innerHTML = origText;
        }, 2000);
      }
    });
  }

  // Initialize
  updateMixology(true);
})();
