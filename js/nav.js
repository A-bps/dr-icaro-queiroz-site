// Menu móvel, topo que se esconde ao rolar para baixo e WhatsApp flutuante.
(() => {
  const btn = document.querySelector('[data-menu-btn]');
  const menu = document.querySelector('[data-menu]');
  const topo = document.querySelector('[data-topo]');
  const txt = btn && btn.querySelector('.menu-btn-txt');

  const setMenu = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    txt.textContent = open ? 'Fechar' : 'Menu';
    menu.hidden = !open;
    document.documentElement.style.overflow = open ? 'hidden' : '';
    document.body.classList.toggle('menu-aberto', open);
    if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
    if (open) menu.querySelector('a').focus();
  };

  if (btn && menu) {
    btn.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setMenu(false); btn.focus(); }
    });
    matchMedia('(min-width: 1240px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  // Topo: esconde ao descer, mostra ao subir.
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    const open = btn && btn.getAttribute('aria-expanded') === 'true';
    topo.classList.toggle('is-hidden', !open && y > lastY && y > 200);
    lastY = y;
  }, { passive: true });
  topo.addEventListener('focusin', () => topo.classList.remove('is-hidden'));

  // WhatsApp flutuante some quando já há um CTA grande na tela (final e rodapé).
  const wa = document.querySelector('[data-wa-flutua]');
  const alvos = document.querySelectorAll('.final, .rodape, .hero');
  if (wa && alvos.length && 'IntersectionObserver' in window) {
    const vis = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => en.isIntersecting ? vis.add(en.target) : vis.delete(en.target));
      wa.classList.toggle('is-hidden', vis.size > 0);
    }, { threshold: 0.15 });
    alvos.forEach((el) => io.observe(el));
  }
})();
