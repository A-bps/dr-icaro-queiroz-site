// Comparador antes/depois: um <input type="range"> nativo (teclado e toque de graça) move a máscara.
document.querySelectorAll('[data-comparar]').forEach((fig) => {
  const palco = fig.querySelector('.comparar-palco');
  const range = fig.querySelector('.comparar-range');
  const set = () => palco.style.setProperty('--pos', range.value + '%');
  range.addEventListener('input', set);
  set();

  // No iPhone o range só responde ao toque exato no polegar: arrastar em qualquer ponto da foto também move.
  // Só o arraste move (não o toque inicial), para quem passa rolando por cima da foto não fazer o divisor pular;
  // touch-action: pan-y no palco deixa o gesto vertical rolar a página (e o navegador cancela o ponteiro).
  let arrastando = false;
  palco.addEventListener('pointerdown', (e) => { arrastando = e.pointerType !== 'mouse'; });
  palco.addEventListener('pointermove', (e) => {
    if (!arrastando) return;
    const b = palco.getBoundingClientRect();
    range.value = Math.round(((e.clientX - b.left) / b.width) * 100);
    set();
  });
  ['pointerup', 'pointercancel'].forEach((t) => palco.addEventListener(t, () => { arrastando = false; }));
});
