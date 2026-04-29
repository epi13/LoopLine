const START_NOTE = 48;
const TOTAL_NOTES = 24;
const BLACK_NOTES = new Set([1, 3, 6, 8, 10]);

function isBlack(note) {
  return BLACK_NOTES.has(note % 12);
}

export function renderPiano({ container, store }) {
  const whiteNotes = [];
  const keyElements = new Map();

  const root = document.createElement('div');
  root.className = 'piano';
  const whiteRow = document.createElement('div');
  whiteRow.className = 'piano-white-row';
  const blackRow = document.createElement('div');
  blackRow.className = 'piano-black-row';

  for (let offset = 0; offset < TOTAL_NOTES; offset += 1) {
    const note = START_NOTE + offset;
    if (!isBlack(note)) {
      whiteNotes.push(note);
      const key = document.createElement('button');
      key.type = 'button';
      key.className = 'piano-key white';
      key.dataset.note = String(note);
      key.setAttribute('aria-label', `Note ${note}`);
      whiteRow.appendChild(key);
      keyElements.set(note, key);
    }
  }

  const whiteWidthPercent = 100 / whiteNotes.length;

  for (let offset = 0; offset < TOTAL_NOTES; offset += 1) {
    const note = START_NOTE + offset;
    if (isBlack(note)) {
      const index = whiteNotes.filter((whiteNote) => whiteNote < note).length - 1;
      if (index < 0) {
        continue;
      }

      const key = document.createElement('button');
      key.type = 'button';
      key.className = 'piano-key black';
      key.dataset.note = String(note);
      key.style.left = `calc(${(index + 1) * whiteWidthPercent}% - 1.75%)`;
      key.setAttribute('aria-label', `Note ${note}`);
      blackRow.appendChild(key);
      keyElements.set(note, key);
    }
  }

  root.appendChild(whiteRow);
  root.appendChild(blackRow);
  container.replaceChildren(root);

  const unsubscribe = store.subscribe((state) => {
    const active = state.activeNotes || [];
    keyElements.forEach((key, note) => {
      key.classList.toggle('active', active.includes(note));
    });
  });

  return () => {
    unsubscribe();
    container.replaceChildren();
  };
}
