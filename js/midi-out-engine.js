const MAX_VOICES = 4;

function midiToFrequency(note) {
  return 440 * (2 ** ((note - 69) / 12));
}

export function createMidiOutEngine({ onActiveNotesChange }) {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const audioContext = AudioContextCtor ? new AudioContextCtor() : null;
  const voices = [];

  function notify() {
    const activeNotes = voices.filter((voice) => voice.active).map((voice) => voice.note);
    onActiveNotesChange(new Set(activeNotes));
  }

  function ensureRunning() {
    if (audioContext?.state === 'suspended') {
      audioContext.resume();
    }
  }

  function findVoice(note) {
    return voices.find((voice) => voice.active && voice.note === note) || null;
  }

  function createVoice() {
    if (!audioContext) {
      return null;
    }

    const oscillator = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    const gainNode = audioContext.createGain();

    oscillator.type = 'triangle';
    filter.type = 'lowpass';
    filter.frequency.value = 2200;
    gainNode.gain.value = 0;

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();

    const voice = {
      oscillator,
      gainNode,
      active: false,
      note: null,
      startedAt: 0
    };

    voices.push(voice);
    return voice;
  }

  function allocateVoice(note) {
    let voice = voices.find((item) => !item.active) || null;
    if (!voice && voices.length < MAX_VOICES) {
      voice = createVoice();
    }
    if (!voice) {
      voice = voices.reduce((oldest, item) => (item.startedAt < oldest.startedAt ? item : oldest), voices[0]);
      releaseNote(voice.note);
    }

    voice.note = note;
    voice.active = true;
    voice.startedAt = performance.now();
    return voice;
  }

  function playNote(note, velocity = 0.8) {
    if (!audioContext) {
      return;
    }
    ensureRunning();

    const existing = findVoice(note);
    const voice = existing || allocateVoice(note);

    const now = audioContext.currentTime;
    voice.oscillator.frequency.setTargetAtTime(midiToFrequency(note), now, 0.005);
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setTargetAtTime(Math.max(0.05, Math.min(1, velocity)) * 0.18, now, 0.01);
    notify();
  }

  function releaseNote(note) {
    if (!audioContext) {
      return;
    }
    const voice = findVoice(note);
    if (!voice) {
      return;
    }

    const now = audioContext.currentTime;
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setTargetAtTime(0, now, 0.03);
    voice.active = false;
    voice.note = null;
    notify();
  }

  function destroy() {
    voices.forEach((voice) => {
      voice.oscillator.stop();
      voice.oscillator.disconnect();
      voice.gainNode.disconnect();
    });
    voices.length = 0;
    onActiveNotesChange(new Set());
    audioContext?.close();
  }

  return { playNote, releaseNote, destroy, ensureRunning };
}
