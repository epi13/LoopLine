# LoopLine

LoopLine keeps notation, staff, beat line, and note glyph rendering code-driven via SVG in the UI layer while using lightweight static assets only for ambient backgrounds and control icons.

## Static asset optimization targets

### Background panoramas (`assets/backgrounds/`)
- **`aurora-minimal-dark.svg`**
  - Target canvas: **1920×1080**
  - Style: low-contrast dark/minimal aurora wash
  - Budget: **≤ 25 KB**
- **`aurora-cinematic-dark.svg`**
  - Target canvas: **2560×1440**
  - Style: slightly more cinematic layered aurora bands
  - Budget: **≤ 45 KB**

**Compression guidance**
- Prefer vector gradients/paths over raster exports.
- Remove metadata and editor-specific attributes.
- Reuse gradient/filter definitions; avoid duplicate nodes.
- Keep total background payload target: **≤ 80 KB combined**.

### Icons (`assets/icons/`)
- Set: `play`, `stop`, `clear`, `menu`, `metronome`, `settings`
- Format: monochrome line SVG (24×24 viewBox)
- Stroke: ~1.8 px for visual consistency
- Budget: **≤ 1.5 KB/icon** (unminified source can be slightly above during iteration)
- Runtime tint/glow handled in CSS masks to avoid duplicate color variants.

### Sprites (`assets/sprites/`)
- Omitted intentionally for now.
- Micro-animation texture should remain CSS/SVG-driven unless profiling indicates the need for tiny glow sprites.
