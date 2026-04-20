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
      const y = 92 + line * 24;
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
      bar.setAttribute('y1', '72');
      bar.setAttribute('y2', '200');
      bar.setAttribute('class', beat % 4 === 0 ? 'bar-line major' : 'bar-line minor');
      layerGrid.appendChild(bar);

      if (beat < beatsPerLoop) {
        const count = document.createElementNS(SVG_NS, 'text');
        count.setAttribute('x', String(x + 4));
        count.setAttribute('y', '58');
        count.setAttribute('fill', 'rgba(190, 210, 220, 0.74)');
        count.setAttribute('font-size', '20');
        count.textContent = String(beat + 1);
        layerGrid.appendChild(count);
      }
    }

    const clef = document.createElementNS(SVG_NS, 'text');
    clef.setAttribute('x', '40');
    clef.setAttribute('y', '176');
    clef.setAttribute('fill', 'rgba(66, 232, 217, 0.85)');
    clef.setAttribute('font-size', '110');
    clef.textContent = '𝄞';
    layerGrid.appendChild(clef);

    const timeSig = document.createElementNS(SVG_NS, 'text');
    timeSig.setAttribute('x', '96');
    timeSig.setAttribute('y', '124');
    timeSig.setAttribute('fill', 'rgba(66, 232, 217, 0.85)');
    timeSig.setAttribute('font-size', '52');
    timeSig.textContent = '4';
    layerGrid.appendChild(timeSig);

    const timeSigLower = document.createElementNS(SVG_NS, 'text');
    timeSigLower.setAttribute('x', '96');
    timeSigLower.setAttribute('y', '168');
    timeSigLower.setAttribute('fill', 'rgba(66, 232, 217, 0.85)');
    timeSigLower.setAttribute('font-size', '52');
    timeSigLower.textContent = '4';
    layerGrid.appendChild(timeSigLower);
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

      const stem = document.createElementNS(SVG_NS, 'line');
      stem.setAttribute('x1', String(x + 7));
      stem.setAttribute('x2', String(x + 7));
      stem.setAttribute('y1', String(y));
      stem.setAttribute('y2', String(y - 44));
      stem.setAttribute('class', 'note-stem');
      layerNotes.appendChild(stem);
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
