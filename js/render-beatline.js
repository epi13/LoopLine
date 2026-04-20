const SVG_NS = 'http://www.w3.org/2000/svg';

export function renderBeatline({ container, store, transport, showSubTicks = true }) {
  let width = 0;
  let circles = [];
  let activeBeat = -1;
  let unsubscribeStore = () => {};
  let unsubscribeTick = () => {};

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('beatline-svg');
  svg.setAttribute('viewBox', '0 0 1000 220');
  svg.setAttribute('preserveAspectRatio', 'none');
  container.replaceChildren(svg);

  function draw() {
    const state = store.getState();
    const beats = state.beatsPerLoop;
    const toggles = state.beatToggles;

    svg.replaceChildren();
    circles = [];

    const laneY = 148;
    const padX = 40;
    width = 1000 - padX * 2;

    const lane = document.createElementNS(SVG_NS, 'line');
    lane.setAttribute('x1', String(padX));
    lane.setAttribute('x2', String(padX + width));
    lane.setAttribute('y1', String(laneY));
    lane.setAttribute('y2', String(laneY));
    lane.setAttribute('class', 'beat-lane');
    svg.appendChild(lane);

    if (showSubTicks) {
      const subTicks = beats * 4;
      for (let i = 0; i <= subTicks; i += 1) {
        const x = padX + (i / subTicks) * width;
        const tick = document.createElementNS(SVG_NS, 'line');
        tick.setAttribute('x1', String(x));
        tick.setAttribute('x2', String(x));
        tick.setAttribute('y1', i % 4 === 0 ? '96' : '142');
        tick.setAttribute('y2', '156');
        tick.setAttribute('class', i % 4 === 0 ? 'beat-tick major' : 'beat-tick minor');
        svg.appendChild(tick);
      }
    }

    for (let beat = 0; beat < beats; beat += 1) {
      const x = padX + (beat / Math.max(1, beats - 1)) * width;
      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', String(x));
      label.setAttribute('y', '84');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', 'rgba(194, 209, 218, 0.8)');
      label.setAttribute('font-size', '26');
      label.textContent = String(beat + 1);
      svg.appendChild(label);

      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', String(x));
      circle.setAttribute('cy', String(laneY));
      circle.setAttribute('r', '10');
      circle.setAttribute('class', `beat-node ${toggles[beat] ? 'on' : 'off'}`);
      circle.setAttribute('data-beat', String(beat));
      circle.addEventListener('click', () => {
        store.actions.toggleBeat(beat);
      });
      svg.appendChild(circle);
      circles.push(circle);
    }
  }

  function setActiveBeat(beatIndex) {
    if (beatIndex === activeBeat) {
      return;
    }

    if (circles[activeBeat]) {
      circles[activeBeat].classList.remove('active');
    }
    if (circles[beatIndex]) {
      circles[beatIndex].classList.add('active');
    }
    activeBeat = beatIndex;
  }

  draw();

  unsubscribeStore = store.subscribe(() => {
    draw();
    if (activeBeat >= 0) {
      setActiveBeat(activeBeat);
    }
  });

  unsubscribeTick = transport.subscribe('tick', ({ beatIndex }) => {
    setActiveBeat(beatIndex);
  });

  return () => {
    unsubscribeStore();
    unsubscribeTick();
  };
}
