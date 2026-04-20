# LoopLine

LoopLine is a browser-based musical sketchpad for fast loop prototyping. It combines a linear beat timeline with notation-aware pitch placement so users can hear rhythmic ideas immediately while still seeing a score-like representation.

## Product overview

LoopLine is designed for **quick ideation**: place notes, hear the loop, adjust timing feel, and iterate.

### Core interaction model

1. **Set loop context** in the control bar (tempo, loop length, quantize policy, mode).
2. **Use the beat line** as the rhythmic anchor to identify pulse and bar boundaries.
3. **Click into the notation surface** to place or remove notes.
4. **Run transport** (play/stop) and refine notes with immediate visual/audio feedback.
5. **Loop continuously** so edits are heard in context without restarting composition flow.

## Module map and responsibility boundaries

LoopLine is organized around clear module boundaries so rendering, timing, and I/O can evolve independently.

- **UI Shell / App State**
  - Hosts global session state (tempo, loop size, mode, selection).
  - Coordinates module communication and user intent dispatch.
- **Control Bar Module**
  - Owns transport and global loop parameters.
  - Emits normalized state changes; does not render notation directly.
- **Beat Line Module**
  - Renders beat markers/pulse feedback.
  - Reflects timing engine position and loop boundaries.
- **Notation Grid Module**
  - Maps musical time and pitch into 2D coordinates.
  - Handles note placement/removal interactions.
- **Timing / Scheduler Engine**
  - Maintains playhead, quantization rules, and loop wrap behavior.
  - Serves as source of truth for pulse timing.
- **Audio / MIDI Output Module**
  - Triggers synthesized or MIDI notes from scheduled events.
  - Applies browser capability detection and fallback behavior.
- **Asset Layer (static visuals/icons)**
  - Provides background and icon assets only.
  - Keeps notation and beat graphics code-rendered (SVG/canvas/DOM).

## Control bar behavior

The control bar centralizes loop-wide settings and transport controls.

- **BPM**
  - Adjustable tempo in beats per minute.
  - Changes apply to scheduler timing and beat pulse display immediately.
- **Beats per loop**
  - Defines loop length in beats (e.g., 4, 8, 16).
  - Affects bar boundary markers, wrap point, and transport cycle.
- **Quantize**
  - Sets input/scheduling snap resolution (or off).
  - Influences click placement rounding and playback event alignment.
- **Loop mode**
  - Controls how playhead behaves at the loop end (standard loop now; extensible for future modes).
- **Transport**
  - **Play**: starts scheduler from current/start loop position.
  - **Stop**: halts playback and resets or parks playhead per mode policy.
  - Optional **Clear** action removes loop note events while preserving global settings.

## Beat line behavior

The beat line is the rhythmic reference strip synchronized to transport.

- **Toggle visibility**
  - Users can show/hide beat line for focus or minimal UI.
- **Active pulse indicator**
  - Current beat (or subdivision, if enabled later) is visually emphasized.
- **Click option**
  - Optional metronome click can follow beat pulses during playback.
- **Sync model**
  - Beat line visual updates are driven by the same timing source as audio scheduling.
  - On loop wrap, pulse index returns to beat 1 in phase with transport cycle.

## Notation mapping details

LoopLine maps musical structure onto a 2D plane.

- **Time → X-axis**
  - Horizontal position corresponds to beat/time offset in the loop.
  - Quantize settings can constrain x-position to rhythmic divisions.
- **Pitch → Y-axis**
  - Vertical position maps to pitch lanes/staff steps.
  - Higher pitch values render higher on the notation surface.
- **Loop wrap behavior**
  - Events are interpreted modulo loop length.
  - Notes placed near loop end should remain phase-correct across boundary wrap.
  - Editing at or beyond boundary snaps/clamps according to quantize and loop policy.

## Browser compatibility and Web MIDI fallback

LoopLine targets modern evergreen browsers with Web Audio support.

- **Primary target**
  - Latest Chrome, Edge, Safari, and Firefox releases.
- **Web MIDI availability**
  - If Web MIDI is available and permitted, LoopLine can route MIDI output.
- **Fallback behavior**
  - If Web MIDI is unavailable or blocked:
    - Use internal Web Audio playback path.
    - Keep notation/transport behavior unchanged.
    - Show non-blocking status message indicating MIDI fallback.

## Static deployment (GitHub Pages)

LoopLine can be deployed as a static site on GitHub Pages.

1. Build the production bundle:
   - `npm ci`
   - `npm run build`
2. Publish `dist/` (or project build output directory) to Pages:
   - **Project Pages**: deploy to `gh-pages` branch under `/`.
   - **Actions flow**: upload build artifact and deploy with `actions/deploy-pages`.
3. Ensure router/base path compatibility:
   - Configure asset base/public path for `/<repo-name>/` when not using user/org root site.
4. In repository settings:
   - Enable Pages and select the deployment source (GitHub Actions recommended).
5. Validate deployment:
   - Confirm transport, beat pulse, and note placement function correctly in hosted environment.

## Future extensions

Planned directions for LoopLine evolution:

- **Recording/export**
  - Export loop performance as MIDI and/or rendered audio stem.
- **Multiple staves / lanes**
  - Support layered instruments or clef-separated notation tracks.
- **Subdivision toggles**
  - Per-view rhythmic density controls (eighth/sixteenth/triplet overlays).
- **Palette variants**
  - Theme packs for contrast, accessibility, and performance-mode color systems.

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
