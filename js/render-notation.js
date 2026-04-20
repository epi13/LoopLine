const SVG_NS = 'http://www.w3.org/2000/svg';

function midiToStaffY(note) {
  const top = 46;
  const semitone = 4.2;
  return top + (84 - note) * semitone;
}

export function renderNotation({ container, store, transport }) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('notation-svg');
  svg.setAttribute('viewBox', '0 0 1000 260');
  svg.setAttribute('preserveAspectRatio', 'none');
  container.replaceChildren(svg);

  const layerGrid = document.createElementNS(SVG_NS, 'g');
  const layerNotes = document.createElementNS(SVG_NS, 'g');
  const playhead = document.createElementNS(SVG_NS, 'line');

  playhead.setAttribute('class', 'notation-playhead');
  playhead.setAttribute('y1', '34');
  playhead.setAttribute('y2', '226');

  svg.append(layerGrid, layerNotes, playhead);

  let unsubscribeStore = () => {};
  let unsubscribeTick = () => {};

  function renderGrid() {
    const { beatsPerLoop } = store.getState();
    layerGrid.replaceChildren();

    for (let line = 0; line < 5; line += 1) {
      const y = 70 + line * 28;
      const staffLine = document.createElementNS(SVG_NS, 'line');
      staffLine.setAttribute('x1', '28');
      staffLine.setAttribute('x2', '972');
      staffLine.setAttribute('y1', String(y));
      staffLine.setAttribute('y2', String(y));
      staffLine.setAttribute('class', 'staff-line');
      layerGrid.appendChild(staffLine);
    }

    for (let beat = 0; beat <= beatsPerLoop; beat += 1) {
      const x = 28 + (beat / beatsPerLoop) * 944;
      const bar = document.createElementNS(SVG_NS, 'line');
      bar.setAttribute('x1', String(x));
      bar.setAttribute('x2', String(x));
      bar.setAttribute('y1', '42');
      bar.setAttribute('y2', '218');
      bar.setAttribute('class', beat % 4 === 0 ? 'bar-line major' : 'bar-line minor');
      layerGrid.appendChild(bar);
    }
  }

  function renderNotes() {
    const { notes } = store.getState();
    layerNotes.replaceChildren();

    notes.forEach((note) => {
      const x = 28 + note.startPhase * 944;
      const y = midiToStaffY(note.pitch);

      const body = document.createElementNS(SVG_NS, 'ellipse');
      body.setAttribute('cx', String(x));
      body.setAttribute('cy', String(y));
      body.setAttribute('rx', '8');
      body.setAttribute('ry', '6');
      body.setAttribute('class', 'note-head');
      layerNotes.appendChild(body);
    });
  }

  function renderPlayhead(phase) {
    const x = 28 + phase * 944;
    playhead.setAttribute('x1', String(x));
    playhead.setAttribute('x2', String(x));
  }

  renderGrid();
  renderNotes();
  renderPlayhead(0);

  unsubscribeStore = store.subscribe(() => {
    renderGrid();
    renderNotes();
  });

  unsubscribeTick = transport.subscribe('tick', ({ phase }) => {
    renderPlayhead(phase);
  });

  return () => {
    unsubscribeStore();
    unsubscribeTick();
  };
}
