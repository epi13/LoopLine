export function setupBackground() {
  document.body.classList.add('aurora-bg');

  return () => {
    document.body.classList.remove('aurora-bg');
  };
}
