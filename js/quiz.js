// Pré-avaliação: 6 etapas, monta um resumo e abre o WhatsApp. Nada é enviado para servidor nem salvo.
(() => {
  const form = document.querySelector('[data-quiz]');
  if (!form) return;
  const etapas = [...form.querySelectorAll('[data-etapa]')];
  const status = form.querySelector('[data-quiz-status]');
  const barra = form.querySelector('[data-quiz-barra]');
  const voltar = form.querySelector('[data-voltar]');
  const avancar = form.querySelector('[data-avancar]');
  const fim = document.querySelector('[data-quiz-fim]');
  const TEMPOS = ['6 meses', '1 ano', '2 anos', '3 a 5 anos', '5 a 10 anos', 'mais de 10 anos'];
  const range = form.querySelector('[data-tempo-range]');
  const out = form.querySelector('[data-tempo-out]');
  const syncTempo = () => { out.textContent = TEMPOS[range.value]; range.setAttribute('aria-valuetext', TEMPOS[range.value]); };
  range.addEventListener('input', syncTempo); syncTempo();

  let i = 0;
  const mostrar = (n, focar = true) => {
    etapas.forEach((e, k) => { e.hidden = k !== n; });
    i = n;
    status.textContent = `Pergunta ${n + 1} de ${etapas.length}`;
    barra.style.transform = `scaleX(${(n + 1) / etapas.length})`;
    voltar.hidden = n === 0;
    avancar.textContent = n === etapas.length - 1 ? 'Ver resumo' : 'Avançar';
    const foco = etapas[n].querySelector('input');
    if (foco && focar) foco.focus({ preventScroll: true });
  };

  const valida = (e) => {
    const inputs = [...e.querySelectorAll('input')];
    let ok = true;
    if (inputs.some((x) => x.type === 'radio' || x.type === 'checkbox')) ok = inputs.some((x) => x.checked);
    else ok = inputs.filter((x) => x.required).every((x) => x.value.trim());
    const erro = e.querySelector('[data-erro]');
    if (erro) erro.hidden = ok;
    return ok;
  };

  const val = (n) => [...form.querySelectorAll(`[name="${n}"]:checked`)].map((x) => x.value).join(', ');
  const resumo = () => [
    ['Situação', val('situacao')],
    ['Há quanto tempo', TEMPOS[range.value]],
    ['Já tentou', val('tentou')],
    ['Sem raspar', val('raspar')],
    ['Quando quer resolver', val('quando')],
    ['Nome', form.nome.value.trim()],
    ['Cidade', form.cidade.value.trim()],
  ];

  form.addEventListener('change', (ev) => { const e = ev.target.closest('[data-etapa]'); const erro = e && e.querySelector('[data-erro]'); if (erro && !erro.hidden) valida(e); });
  voltar.addEventListener('click', () => mostrar(Math.max(0, i - 1)));
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!valida(etapas[i])) return;
    if (i < etapas.length - 1) return mostrar(i + 1);
    const r = resumo();
    const dl = fim.querySelector('[data-resumo]');
    dl.innerHTML = '';
    r.forEach(([k, v]) => { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; dl.append(dt, dd); });
    const msg = 'Olá! Fiz a pré-avaliação no site do Dr. Ícaro.\n' + r.map(([k, v]) => `${k}: ${v}`).join('\n');
    fim.querySelector('[data-enviar]').href = 'https://wa.me/5517996121807?text=' + encodeURIComponent(msg);
    form.hidden = true; fim.hidden = false; fim.focus();
  });
  fim.querySelector('[data-corrigir]').addEventListener('click', () => { fim.hidden = true; form.hidden = false; mostrar(0); });
  mostrar(0, false);
})();
