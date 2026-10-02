// Comparador antes/depois: um <input type="range"> nativo (teclado e toque de graça) move a máscara.
document.querySelectorAll('[data-comparar]').forEach((fig) => {
  const palco = fig.querySelector('.comparar-palco');
  const range = fig.querySelector('.comparar-range');
  const set = () => palco.style.setProperty('--pos', range.value + '%');
  range.addEventListener('input', set);
  set();
});
