export function createTransport({ getState }) {
  const listeners = {
    tick: new Set(),
    beat: new Set(),
    wrap: new Set(),
    run: new Set()
  };

  let running = false;
  let rafId = 0;
  let phase = 0;
  let beatIndex = 0;
  let loopCount = 0;
  let lastTimestamp = 0;

  function emit(type, payload) {
    listeners[type].forEach((listener) => listener(payload));
  }

  function getSnapshot() {
    return { phase, beatIndex, loopCount, running };
  }

  function step(timestamp) {
    if (!running) {
      return;
    }

    const state = getState();
    const bpm = Math.max(20, Number(state.bpm) || 120);
    const beatsPerLoop = Math.max(1, Number(state.beatsPerLoop) || 16);

    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }

    const deltaMs = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    const previousPhase = phase;
    const deltaBeats = (deltaMs / 60000) * bpm;
    phase = (phase + deltaBeats / beatsPerLoop) % 1;

    const previousBeatIndex = beatIndex;
    beatIndex = Math.floor(phase * beatsPerLoop) % beatsPerLoop;

    const wrapped = phase < previousPhase;

    if (wrapped) {
      loopCount += 1;
      emit('wrap', { phase, beatIndex, loopCount, beatsPerLoop, timestamp });
    }

    if (beatIndex !== previousBeatIndex || wrapped) {
      emit('beat', { phase, beatIndex, loopCount, beatsPerLoop, wrapped, timestamp });
    }

    emit('tick', {
      phase,
      beatIndex,
      loopCount,
      beatsPerLoop,
      timestamp,
      running
    });

    rafId = window.requestAnimationFrame(step);
  }

  function start() {
    if (running) {
      return;
    }
    running = true;
    lastTimestamp = 0;
    emit('run', { running: true });
    rafId = window.requestAnimationFrame(step);
  }

  function stop({ reset = false } = {}) {
    if (!running && !reset) {
      return;
    }
    running = false;
    window.cancelAnimationFrame(rafId);
    lastTimestamp = 0;
    if (reset) {
      phase = 0;
      beatIndex = 0;
    }
    emit('run', { running: false });
    emit('tick', { ...getSnapshot(), beatsPerLoop: getState().beatsPerLoop, timestamp: performance.now(), running: false });
  }

  function subscribe(type, listener) {
    if (!listeners[type]) {
      throw new Error(`Unknown transport event type: ${type}`);
    }

    listeners[type].add(listener);
    return () => listeners[type].delete(listener);
  }

  return {
    getSnapshot,
    start,
    stop,
    subscribe
  };
}
