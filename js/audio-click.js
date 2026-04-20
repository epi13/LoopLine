export function createAudioClick() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return {
      trigger() {},
      unlock() {}
    };
  }

  const context = new AudioCtx();

  function unlock() {
    if (context.state === 'suspended') {
      context.resume();
    }
  }

  function trigger({ enabled = true, accent = false } = {}) {
    if (!enabled) {
      return;
    }

    unlock();

    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = 'triangle';
    osc.frequency.value = accent ? 1120 : 820;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.14 : 0.09, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(context.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  return {
    trigger,
    unlock
  };
}
