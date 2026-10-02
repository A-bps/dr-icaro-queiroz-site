// Contadores: só números reais publicados no site original (1, 10, +300).
// Sem GSAP ou com movimento reduzido, o número final já está no HTML.
(() => {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length || !window.gsap || !window.ScrollTrigger) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  els.forEach((el) => {
    const fim = Number(el.dataset.count);
    if (fim < 2) return;
    const obj = { v: 0 };
    el.textContent = '0';
    gsap.to(obj, {
      v: fim,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(obj.v); },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
})();
