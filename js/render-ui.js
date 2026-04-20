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

  const clickField = document.createElement('label');
  clickField.className = 'field field-sm';
  clickField.innerHTML = `
    <span class="field-label">Click</span>
    <input id="click-enabled" name="click-enabled" type="checkbox" checked aria-label="Enable metronome click" />
  `;
  loopModeSelect.closest('.field')?.insertAdjacentElement('afterend', clickField);
  const clickCheckbox = clickField.querySelector('#click-enabled');

  const unsubscribe = store.subscribe((state) => {
    bpmInput.value = String(state.bpm);
    beatsInput.value = String(state.beatsPerLoop);
    quantizeSelect.value = state.quantize;
    loopModeSelect.value = state.loopMode;
    clickCheckbox.checked = state.clickEnabled;

    const transportLabel = state.recording ? 'recording' : state.running ? 'playing' : 'stopped';
    statusText.textContent = `${state.midiStatus} • Transport: ${transportLabel}`;

    playButton.setAttribute('aria-pressed', String(state.running && !state.recording));
    recordButton.setAttribute('aria-pressed', String(state.recording));
  });

  bpmInput.addEventListener('change', () => {
    store.actions.setBpm(Number(bpmInput.value));
  });

  beatsInput.addEventListener('change', () => {
    store.actions.setBeatsPerLoop(Number(beatsInput.value));
  });

  quantizeSelect.addEventListener('change', () => {
    store.actions.setQuantize(quantizeSelect.value);
  });

  loopModeSelect.addEventListener('change', () => {
    store.actions.setLoopMode(loopModeSelect.value);
  });

  clickCheckbox.addEventListener('change', () => {
    store.actions.setClickEnabled(clickCheckbox.checked);
  });

  midiSelector.addEventListener('change', (event) => {
    const selectedMidiInputId = event.target.value || null;
    store.actions.setSelectedMidiInputId(selectedMidiInputId);
    midiManager.selectInput(selectedMidiInputId);
  });

  playButton.addEventListener('click', () => {
    audioClick.unlock();
    store.actions.setRecording(false);
    store.actions.setRunning(true);
    transport.start();
  });

  stopButton.addEventListener('click', () => {
    store.actions.setRunning(false);
    store.actions.setRecording(false);
    transport.stop();
  });

  recordButton.addEventListener('click', () => {
    audioClick.unlock();
    const nextRecording = !store.getState().recording;
    store.actions.setRecording(nextRecording);
    if (nextRecording) {
      transport.start();
    }
  });

  return {
    updateMidiInputs(inputs) {
      asOptions(midiSelector, inputs, store.getState().selectedMidiInputId);
    },
    destroy() {
      unsubscribe();
    }
  };
}
