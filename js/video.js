// YouTube só carrega quando a pessoa pede (sem cookies de terceiros antes do clique).
document.querySelectorAll('[data-video]').forEach((box) => {
  const btn = box.querySelector('button');
  btn.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(box.dataset.video)}?autoplay=1&rel=0`;
    f.title = 'Vídeo: cirurgia completa de Transplante Capilar';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    btn.replaceWith(f);
    f.focus();
  }, { once: true });
});
