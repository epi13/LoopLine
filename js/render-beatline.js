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

    const laneY = 120;
    const padX = 44;
    width = 1000 - padX * 2;

    const lane = document.createElementNS(SVG_NS, 'line');
    lane.setAttribute('x1', String(padX));
    lane.setAttribute('x2', String(padX + width));
    lane.setAttribute('y1', String(laneY));
    lane.setAttribute('y2', String(laneY));
    lane.setAttribute('class', 'beat-lane');
    svg.appendChild(lane);

    if (showSubTicks) {
      const subTicks = beats * 2;
      for (let i = 0; i <= subTicks; i += 1) {
        const x = padX + (i / subTicks) * width;
        const tick = document.createElementNS(SVG_NS, 'line');
        tick.setAttribute('x1', String(x));
        tick.setAttribute('x2', String(x));
        tick.setAttribute('y1', i % 2 === 0 ? '88' : '98');
        tick.setAttribute('y2', '120');
        tick.setAttribute('class', i % 2 === 0 ? 'beat-tick major' : 'beat-tick minor');
        svg.appendChild(tick);
      }
    }

    for (let beat = 0; beat < beats; beat += 1) {
      const x = padX + (beat / Math.max(1, beats - 1)) * width;
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', String(x));
      circle.setAttribute('cy', String(laneY));
      circle.setAttribute('r', '12');
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
