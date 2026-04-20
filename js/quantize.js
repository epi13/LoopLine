const GRID_STEPS = {
  off: null,
  '1/4': 4,
  '1/8': 8,
  '1/16': 16,
  '1/32': 32
};

export function getGridSteps(quantize) {
  return GRID_STEPS[quantize] ?? null;
}

export function snapPhaseToGrid(phase, quantize) {
  const steps = getGridSteps(quantize);
  const normalizedPhase = ((phase % 1) + 1) % 1;

  if (!steps) {
    return normalizedPhase;
  }

  const snapped = Math.round(normalizedPhase * steps) / steps;
  return snapped >= 1 ? 0 : snapped;
}

export function phaseToBeat(phase, beatsPerLoop) {
  return ((phase % 1) + 1) % 1 * beatsPerLoop;
}
