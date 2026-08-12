// Small helper to derive lighter/darker shades from a base hex color,
// used for dynamic per-school theming (we only store one primary + one
// accent color per school, but the design needs a couple of shades of each).

function clamp(n: number) {
  return Math.max(0, Math.min(255, n));
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, "0")).join("");
}

export function shade(hex: string, percent: number): string {
  // percent > 0 lightens, percent < 0 darkens
  try {
    const { r, g, b } = hexToRgb(hex);
    const amount = percent < 0 ? 1 + percent : percent;
    const target = percent < 0 ? 0 : 255;
    const nr = r + (target - r) * Math.abs(amount);
    const ng = g + (target - g) * Math.abs(amount);
    const nb = b + (target - b) * Math.abs(amount);
    return rgbToHex(nr, ng, nb);
  } catch {
    return hex;
  }
}
