export interface HSB {
  h: number;
  s: number;
  b: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hsbToRgb(hsb: HSB): RGB {
  const h = hsb.h / 360;
  const s = hsb.s / 100;
  const b = hsb.b / 100;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = b * (1 - s);
  const q = b * (1 - f * s);
  const t = b * (1 - (1 - f) * s);
  let r = 0, g = 0, bVal = 0;
  switch (i % 6) {
    case 0: r = b; g = t; bVal = p; break;
    case 1: r = q; g = b; bVal = p; break;
    case 2: r = p; g = b; bVal = t; break;
    case 3: r = p; g = q; bVal = b; break;
    case 4: r = t; g = p; bVal = b; break;
    case 5: r = b; g = p; bVal = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(bVal * 255)
  };
}

export function rgbToHex(rgb: RGB): string {
  const componentToHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return "#" + componentToHex(rgb.r) + componentToHex(rgb.g) + componentToHex(rgb.b);
}

export function hsbToHex(hsb: HSB): string {
  return rgbToHex(hsbToRgb(hsb));
}

export function rgbToHsb(rgb: RGB): HSB {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const bVal = max;
  if (delta !== 0) {
    s = delta / max;
    if (max === r) {
      h = (g - b) / delta + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    b: Math.round(bVal * 100)
  };
}

export function hexToRgb(hex: string): RGB {
  let cleanHex = hex.trim();
  if (cleanHex.startsWith('rgb')) {
    const match = cleanHex.match(/\d+/g);
    if (match) {
      return {
        r: parseInt(match[0], 10),
        g: parseInt(match[1], 10),
        b: parseInt(match[2], 10)
      };
    }
  }
  if (cleanHex.startsWith('#')) {
    cleanHex = cleanHex.slice(1);
  }
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function hexToHsb(hex: string): HSB {
  return rgbToHsb(hexToRgb(hex));
}
