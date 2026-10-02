// Movimento do site. Só transform, opacity e clip-path.
// Sem GSAP (CDN fora) ou com prefers-reduced-motion, a página fica estática e completa.
(() => {
  const root = document.documentElement;
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove('js'); return; }
  if (reduz) return; // estados iniciais em CSS só existem com no-preference

  gsap.registerPlugin(ScrollTrigger);
  const q = (s, c = document) => [...c.querySelectorAll(s)];
  const header = () => document.querySelector('[data-topo]')?.offsetHeight || 72;

  // Rolagem suave (desligada com movimento reduzido, pelo return acima).
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.11, anchors: { offset: -header() } });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // 1. Hero: uma entrada orquestrada. Retrato revela de baixo para cima, título sobe linha a linha, o traço se desenha.
  const hero = document.querySelector('.hero');
  if (hero) {
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to('[data-hero-foto]', { clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'power3.inOut' }, 0)
      .fromTo('[data-hero-line]', { y: 0, yPercent: 105 }, { yPercent: 0, duration: 1.1, stagger: 0.12 }, 0.25)
      .to('[data-hero-traco]', { clipPath: 'inset(0 0% 0 0)', duration: 1.4, ease: 'power2.inOut' }, 0.7)
      .to('[data-hero-item]', { opacity: 1, duration: 0.8, stagger: 0.1 }, 0.8);

    // Retrato desce mais devagar que a página.
    gsap.to('.hero-foto img', {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  // 2. Revelações de texto: discretas, em lote, uma vez.
  // Num salto pelo menu o lote junta dezenas de itens: o que já passou aparece na hora,
  // e a cascata do que está na tela é limitada a 0,5 s (senão o destino só surgia ~5 s depois).
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => {
      const passou = els.filter((el) => el.getBoundingClientRect().bottom < 0);
      const naTela = els.filter((el) => !passou.includes(el));
      if (passou.length) gsap.set(passou, { opacity: 1, y: 0, overwrite: true });
      gsap.to(naTela, { opacity: 1, y: 0, duration: 0.9, stagger: Math.min(0.08, 0.5 / naTela.length), ease: 'power3.out', overwrite: true });
    },
  });

  // 3. Fotos: a máscara abre conforme a foto entra; a imagem dentro faz parallax leve.
  q('[data-mask]').forEach((el) => {
    gsap.to(el, {
      clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 40%', scrub: true },
    });
    const img = el.querySelector('img');
    if (img) gsap.fromTo(img, { yPercent: -4 }, {
      yPercent: 4, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // 4. Sem raspar: a foto do pós-imediato se descobre de cima para baixo enquanto o texto é lido.
  const sr = document.querySelector('[data-sr-foto] img');
  if (sr) {
    gsap.fromTo(sr, { clipPath: 'inset(0% 0% 38% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
      scrollTrigger: { trigger: '.sr-grid', start: 'top 70%', end: 'center center', scrub: true },
    });
  }

  // 5. O traço da linha frontal desenha conforme a rolagem.
  q('[data-traco-scroll]').forEach((el) => {
    gsap.to(el, {
      clipPath: 'inset(0 0% 0 0)', ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 30%', scrub: true },
    });
  });

  // 6. Linha do tempo do pós-operatório preenche conforme se avança.
  const tempo = document.querySelector('[data-tempo]');
  if (tempo) {
    gsap.to('[data-tempo-barra]', {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: tempo, start: 'top 70%', end: 'bottom 70%', scrub: true },
    });
  }

  // 7. O dia da cirurgia: sequência fixada com rolagem horizontal (só telas largas).
  const dia = document.querySelector('[data-dia]');
  if (dia) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1000px) and (min-height: 600px)', () => {
      dia.classList.add('is-horizontal');
      const pin = dia.querySelector('[data-dia-pin]');
      const trilho = dia.querySelector('[data-dia-trilho]');
      const barra = dia.querySelector('[data-dia-barra]');
      const dist = () => Math.max(0, trilho.scrollWidth - innerWidth);
      gsap.to(trilho, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: pin, pin: true, start: 'top top', end: () => '+=' + dist(),
          scrub: 0.8, invalidateOnRefresh: true,
          onUpdate: (st) => gsap.set(barra, { scaleX: st.progress }),
        },
      });
      return () => { dia.classList.remove('is-horizontal'); gsap.set(trilho, { clearProps: 'transform' }); };
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
