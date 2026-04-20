import { createAudioClick } from './audio-click.js';
import { createMidiManager } from './midi.js';
import { snapPhaseToGrid } from './quantize.js';
import { setupBackground } from './render-background.js';
import { renderBeatline } from './render-beatline.js';
import { renderNotation } from './render-notation.js';
import { renderUI } from './render-ui.js';
import { createStore } from './state.js';
import { createTransport } from './transport.js';

async function bootstrap() {
  const store = createStore();
  const audioClick = createAudioClick();
  const transport = createTransport({ getState: store.getState });
  const midiBridge = { selectInput() {} };

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

  const ui = renderUI({
    store,
    transport,
    midiManager: midiBridge,
    audioClick
  });

  const midiManager = await createMidiManager({
    onStatus(status) {
      store.actions.setMidiStatus(status);
    },
    onInputs(inputs) {
      ui.updateMidiInputs(inputs);
    },
    onNote(event) {
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
    transport.stop({ reset: true });
    beatlineDestroy();
    notationDestroy();
    ui.destroy();
    destroyBackground();
  });
}

bootstrap();
