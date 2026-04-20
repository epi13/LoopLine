const DEFAULTS = {
  bpm: 120,
  beatsPerLoop: 16,
  quantize: '1/8',
  loopMode: 'replace',
  selectedMidiInputId: null,
  running: false,
  recording: false,
  clickEnabled: true,
  beatToggles: Array.from({ length: 16 }, () => true),
  notes: [],
  midiStatus: 'MIDI unavailable'
};

function normalizeBeatToggles(beatsPerLoop, toggles = []) {
  const safeBeats = Math.max(1, Number(beatsPerLoop) || DEFAULTS.beatsPerLoop);
  return Array.from({ length: safeBeats }, (_, index) => toggles[index] ?? true);
}

export function createStore(initialState = {}) {
  let state = {
    ...DEFAULTS,
    ...initialState
  };

  state = {
    ...state,
    beatsPerLoop: Math.max(1, Number(state.beatsPerLoop) || DEFAULTS.beatsPerLoop),
    beatToggles: normalizeBeatToggles(state.beatsPerLoop, state.beatToggles)
  };

  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(update) {
    const partial = typeof update === 'function' ? update(state) : update;
    if (!partial || typeof partial !== 'object') {
      return state;
    }

    let next = {
      ...state,
      ...partial
    };

    if (partial.beatsPerLoop !== undefined || partial.beatToggles !== undefined) {
      next = {
        ...next,
        beatsPerLoop: Math.max(1, Number(next.beatsPerLoop) || DEFAULTS.beatsPerLoop),
        beatToggles: normalizeBeatToggles(next.beatsPerLoop, next.beatToggles)
      };
    }

    state = next;
    listeners.forEach((listener) => listener(state));
    return state;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function actions() {
    return {
      setRunning(running) {
        setState({ running: Boolean(running) });
      },
      setRecording(recording) {
        setState({ recording: Boolean(recording), running: Boolean(recording) || state.running });
      },
      setBpm(bpm) {
        const safeBpm = Math.max(20, Math.min(300, Number(bpm) || state.bpm));
        setState({ bpm: safeBpm });
      },
      setBeatsPerLoop(beatsPerLoop) {
        const safeBeats = Math.max(1, Math.min(64, Number(beatsPerLoop) || state.beatsPerLoop));
        setState({ beatsPerLoop: safeBeats });
      },
      setQuantize(quantize) {
        setState({ quantize });
      },
      setLoopMode(loopMode) {
        setState({ loopMode });
      },
      setSelectedMidiInputId(selectedMidiInputId) {
        setState({ selectedMidiInputId });
      },
      setMidiStatus(midiStatus) {
        setState({ midiStatus });
      },
      toggleBeat(index) {
        if (index < 0 || index >= state.beatToggles.length) {
          return;
        }

        const beatToggles = state.beatToggles.map((value, beatIndex) => {
          if (beatIndex !== index) {
            return value;
          }
          return !value;
        });

        setState({ beatToggles });
      },
      addNote(note) {
        setState((current) => {
          if (current.loopMode === 'replace' && current.recording) {
            const overlapCutoff = note.startPhase;
            const retained = current.notes.filter((existing) => existing.startPhase > overlapCutoff);
            return { notes: [...retained, note] };
          }
          return { notes: [...current.notes, note] };
        });
      },
      clearNotes() {
        setState({ notes: [] });
      },
      setClickEnabled(clickEnabled) {
        setState({ clickEnabled: Boolean(clickEnabled) });
      }
    };
  }

  return {
    getState,
    setState,
    subscribe,
    actions: actions()
  };
}
