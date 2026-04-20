const state = {
  bpm: 120,
  beatsPerLoop: 16,
  quantize: '1/8',
  loopMode: 'replace',
  midiDeviceId: null,
  transport: 'stopped'
};

function initState() {
  return { ...state };
}

function initTransport(appState) {
  const statusText = document.querySelector('#status-text');

  return {
    play() {
      appState.transport = 'playing';
      statusText.textContent = `Transport: ${appState.transport}`;
    },
    stop() {
      appState.transport = 'stopped';
      statusText.textContent = `Transport: ${appState.transport}`;
    },
    record() {
      appState.transport = 'recording';
      statusText.textContent = `Transport: ${appState.transport}`;
    }
  };
}

function initMidi(appState) {
  const selector = document.querySelector('#midi-selector');

  selector.addEventListener('change', (event) => {
    appState.midiDeviceId = event.target.value || null;
  });
}

function initRender(appState) {
  const bpmInput = document.querySelector('#bpm');
  const beatsInput = document.querySelector('#beats-per-loop');
  const quantizeSelect = document.querySelector('#quantize');
  const loopModeSelect = document.querySelector('#loop-mode');

  bpmInput.value = String(appState.bpm);
  beatsInput.value = String(appState.beatsPerLoop);
  quantizeSelect.value = appState.quantize;
  loopModeSelect.value = appState.loopMode;

  bpmInput.addEventListener('change', () => {
    appState.bpm = Number(bpmInput.value) || appState.bpm;
  });

  beatsInput.addEventListener('change', () => {
    appState.beatsPerLoop = Number(beatsInput.value) || appState.beatsPerLoop;
  });

  quantizeSelect.addEventListener('change', () => {
    appState.quantize = quantizeSelect.value;
  });

  loopModeSelect.addEventListener('change', () => {
    appState.loopMode = loopModeSelect.value;
  });
}

function bootstrap() {
  const appState = initState();
  const transport = initTransport(appState);

  initMidi(appState);
  initRender(appState);

  document.querySelector('#play').addEventListener('click', transport.play);
  document.querySelector('#stop').addEventListener('click', transport.stop);
  document.querySelector('#record').addEventListener('click', transport.record);
}

bootstrap();
