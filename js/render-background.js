export function setupBackground() {
  let rafId = 0;
  let start = performance.now();

  function animate(timestamp) {
    const elapsed = (timestamp - start) / 1000;
    const x = Math.sin(elapsed * 0.09) * 6;
    const y = Math.cos(elapsed * 0.07) * 6;
    document.body.style.backgroundPosition = `${x}px ${y}px, ${-x}px ${y}px, ${y}px ${-x}px, 0 0`;
    rafId = window.requestAnimationFrame(animate);
  }

  rafId = window.requestAnimationFrame(animate);

  return () => {
    window.cancelAnimationFrame(rafId);
    document.body.style.backgroundPosition = '';
    start = performance.now();
  };
}
