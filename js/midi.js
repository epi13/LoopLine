function toInputList(midiAccess) {
  return Array.from(midiAccess.inputs.values()).map((input) => ({
    id: input.id,
    name: input.name || `Input ${input.id}`
  }));
}

function normalizeMessage(messageEvent) {
  const [status = 0, note = 0, value = 0] = messageEvent.data;
  const command = status & 0xf0;
  const channel = status & 0x0f;

  if (command === 0x90 && value > 0) {
    return {
      type: 'noteon',
      note,
      velocity: value / 127,
      channel,
      timestamp: performance.now()
    };
  }

  if (command === 0x80 || (command === 0x90 && value === 0)) {
    return {
      type: 'noteoff',
      note,
      velocity: value / 127,
      channel,
      timestamp: performance.now()
    };
  }

  return null;
}

export async function createMidiManager({ onInputs, onNote, onStatus }) {
  if (!navigator.requestMIDIAccess) {
    onStatus('Web MIDI unsupported in this browser');
    onInputs([]);
    return {
      available: false,
      selectInput() {},
      destroy() {}
    };
  }

  try {
    const midiAccess = await navigator.requestMIDIAccess();
    let selectedInput = null;

    function refreshInputs() {
      const inputs = toInputList(midiAccess);
      onInputs(inputs);
      if (selectedInput && !midiAccess.inputs.get(selectedInput.id)) {
        selectedInput = null;
        onStatus('Selected MIDI input disconnected');
      }
      return inputs;
    }

    function clearSelectedInput() {
      if (selectedInput) {
        selectedInput.onmidimessage = null;
        selectedInput = null;
      }
    }

    function selectInput(inputId) {
      clearSelectedInput();
      if (!inputId) {
        onStatus('No MIDI input selected');
        return;
      }

      const input = midiAccess.inputs.get(inputId);
      if (!input) {
        onStatus('Unable to find selected MIDI input');
        return;
      }

      selectedInput = input;
      selectedInput.onmidimessage = (event) => {
        const normalized = normalizeMessage(event);
        if (normalized) {
          onNote(normalized);
        }
      };
      onStatus(`Listening: ${selectedInput.name || 'MIDI input'}`);
    }

    midiAccess.onstatechange = () => {
      refreshInputs();
    };

    const discoveredInputs = refreshInputs();
    onStatus(discoveredInputs.length ? 'MIDI ready' : 'No MIDI inputs detected');

    return {
      available: true,
      selectInput,
      destroy() {
        clearSelectedInput();
        midiAccess.onstatechange = null;
      }
    };
  } catch (_error) {
    onStatus('MIDI access denied or unavailable');
    onInputs([]);
    return {
      available: false,
      selectInput() {},
      destroy() {}
    };
  }
}
