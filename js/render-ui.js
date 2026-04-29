function asOptions(select, inputs, selectedId) {
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = inputs.length ? 'Select input' : 'No device selected';

  const options = [placeholder, ...inputs.map((input) => {
    const option = document.createElement('option');
    option.value = input.id;
    option.textContent = input.name;
    return option;
  })];

  select.replaceChildren(...options);
  select.value = selectedId || '';
}

function shouldIgnoreKeyboardShortcut(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target.tagName);
}

export function renderUI({ store, transport, midiManager, audioClick }) {
  const midiSelector = document.querySelector('#midi-selector');
  const bpmInput = document.querySelector('#bpm');
  const beatsInput = document.querySelector('#beats-per-loop');
  const quantizeSelect = document.querySelector('#quantize');
  const loopModeSelect = document.querySelector('#loop-mode');
  const statusText = document.querySelector('#status-text');
  const playButton = document.querySelector('#play');
  const stopButton = document.querySelector('#stop');
  const recordButton = document.querySelector('#record');
  const clearButton = document.querySelector('#clear');

  const clickCheckbox = document.querySelector('#click-enabled');
  const events = new AbortController();

  const unsubscribe = store.subscribe((state) => {
    bpmInput.value = String(state.bpm);
    beatsInput.value = String(state.beatsPerLoop);
    quantizeSelect.value = state.quantize;
    loopModeSelect.value = state.loopMode;
    if (clickCheckbox) {
      clickCheckbox.checked = state.clickEnabled;
    }

    const transportLabel = state.recording ? 'recording' : state.running ? 'playing' : 'stopped';
    statusText.textContent = transportLabel.toUpperCase();

    playButton.setAttribute('aria-pressed', String(state.running && !state.recording));
    recordButton.setAttribute('aria-pressed', String(state.recording));
  });

  bpmInput.addEventListener('change', () => {
    store.actions.setBpm(Number(bpmInput.value));
  }, { signal: events.signal });

  beatsInput.addEventListener('change', () => {
    store.actions.setBeatsPerLoop(Number(beatsInput.value));
  }, { signal: events.signal });

  quantizeSelect.addEventListener('change', () => {
    store.actions.setQuantize(quantizeSelect.value);
  }, { signal: events.signal });

  loopModeSelect.addEventListener('change', () => {
    store.actions.setLoopMode(loopModeSelect.value);
  }, { signal: events.signal });

  clickCheckbox?.addEventListener('change', () => {
    store.actions.setClickEnabled(clickCheckbox.checked);
  }, { signal: events.signal });

  midiSelector.addEventListener('change', (event) => {
    const selectedMidiInputId = event.target.value || null;
    store.actions.setSelectedMidiInputId(selectedMidiInputId);
    midiManager.selectInput(selectedMidiInputId);
  }, { signal: events.signal });

  playButton.addEventListener('click', () => {
    audioClick.unlock();
    store.actions.setRecording(false);
    store.actions.setRunning(true);
    transport.start();
  }, { signal: events.signal });

  stopButton.addEventListener('click', () => {
    store.actions.setRunning(false);
    store.actions.setRecording(false);
    transport.stop();
  }, { signal: events.signal });

  recordButton.addEventListener('click', () => {
    audioClick.unlock();
    const nextRecording = !store.getState().recording;
    store.actions.setRecording(nextRecording);
    if (nextRecording) {
      transport.start();
    }
  }, { signal: events.signal });

  clearButton?.addEventListener('click', () => {
    store.actions.clearNotes();
  }, { signal: events.signal });

  window.addEventListener('keydown', (event) => {
    if (shouldIgnoreKeyboardShortcut(event)) {
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      audioClick.unlock();
      const state = store.getState();
      const nextRunning = !state.running;
      store.actions.setRecording(false);
      store.actions.setRunning(nextRunning);
      if (nextRunning) {
        transport.start();
      } else {
        transport.stop();
      }
      return;
    }

    if (event.code === 'KeyR') {
      event.preventDefault();
      audioClick.unlock();
      const nextRecording = !store.getState().recording;
      store.actions.setRecording(nextRecording);
      if (nextRecording) {
        transport.start();
      }
      return;
    }

    if (event.code === 'Backspace' || event.code === 'Delete') {
      event.preventDefault();
      store.actions.clearNotes();
    }
  }, { signal: events.signal });

  return {
    updateMidiInputs(inputs) {
      asOptions(midiSelector, inputs, store.getState().selectedMidiInputId);
    },
    destroy() {
      events.abort();
      unsubscribe();
    }
  };
}
