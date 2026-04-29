import { createAudioClick } from './audio-click.js';
import { createMidiManager } from './midi.js';
import { createMidiOutEngine } from './midi-out-engine.js';
import { snapPhaseToGrid } from './quantize.js';
import { setupBackground } from './render-background.js';
import { renderBeatline } from './render-beatline.js';
import { renderNotation } from './render-notation.js';
import { renderPiano } from './render-piano.js';
import { renderUI } from './render-ui.js';
import { createStore } from './state.js';
import { createTransport } from './transport.js';

async function bootstrap() {
  const store = createStore();
  const audioClick = createAudioClick();
  const transport = createTransport({ getState: store.getState });
  const midiBridge = { selectInput() {} };
  const activeNoteTimers = new Map();
  const playedLoopEvents = new Set();

  const midiOut = createMidiOutEngine({
    onActiveNotesChange(activeNotes) {
      store.actions.setActiveNotes(activeNotes);
    }
  });

  const destroyBackground = setupBackground();

  const beatlineDestroy = renderBeatline({
    container: document.querySelector('#beat-line'),
    store,
    transport,
    showSubTicks: true
  });

  const notationDestroy = renderNotation({
    container: document.querySelector('#notation'),
    store,
    transport
  });

  const pianoDestroy = renderPiano({
    container: document.querySelector('#piano-keyboard'),
    store
  });

  const ui = renderUI({
    store,
    transport,
    midiManager: midiBridge,
    audioClick,
    midiOut
  });

  function scheduleRelease(note, durationMs) {
    window.clearTimeout(activeNoteTimers.get(note));
    const timerId = window.setTimeout(() => {
      midiOut.releaseNote(note);
      activeNoteTimers.delete(note);
    }, durationMs);
    activeNoteTimers.set(note, timerId);
  }

  const midiManager = await createMidiManager({
    onStatus(status) {
      store.actions.setMidiStatus(status);
    },
    onInputs(inputs) {
      ui.updateMidiInputs(inputs);
    },
    onNote(event) {
      if (event.type === 'noteon') {
        midiOut.playNote(event.note, event.velocity);
      }
      if (event.type === 'noteoff') {
        midiOut.releaseNote(event.note);
      }

      if (!store.getState().recording || event.type !== 'noteon') {
        return;
      }

      const { phase } = transport.getSnapshot();
      const state = store.getState();
      const startPhase = snapPhaseToGrid(phase, state.quantize);

      store.actions.addNote({
        id: `${event.timestamp}-${event.note}`,
        pitch: event.note,
        velocity: event.velocity,
        startPhase,
        durationBeats: 0.5
      });
    }
  });

  midiBridge.selectInput = midiManager.selectInput;

  transport.subscribe('tick', ({ phase, loopCount }) => {
    const state = store.getState();
    if (!state.running) {
      return;
    }

    const sorted = [...state.notes].sort((a, b) => a.startPhase - b.startPhase);
    sorted.forEach((note) => {
      const eventId = `${loopCount}:${note.id}`;
      const triggerWindow = 0.02;
      if (phase >= note.startPhase && phase < note.startPhase + triggerWindow && !playedLoopEvents.has(eventId)) {
        playedLoopEvents.add(eventId);
        midiOut.playNote(note.pitch, note.velocity);
        const durationMs = Math.max(60, ((note.durationBeats || 0.5) * 60000) / Math.max(20, state.bpm));
        scheduleRelease(note.pitch, durationMs);
      }
    });
  });

  transport.subscribe('wrap', ({ loopCount }) => {
    for (const eventId of [...playedLoopEvents]) {
      const eventLoop = Number(eventId.split(':', 1)[0]);
      if (eventLoop < loopCount) {
        playedLoopEvents.delete(eventId);
      }
    }
  });

  transport.subscribe('beat', ({ beatIndex }) => {
    const state = store.getState();
    if (!state.running) {
      return;
    }

    const enabled = state.clickEnabled && state.beatToggles[beatIndex];
    audioClick.trigger({ enabled, accent: beatIndex === 0 });
  });

  window.addEventListener('beforeunload', () => {
    midiManager.destroy();
    midiOut.destroy();
    transport.stop({ reset: true });
    beatlineDestroy();
    notationDestroy();
    pianoDestroy();
    ui.destroy();
    destroyBackground();
  });
}

bootstrap();
