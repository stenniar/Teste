// Site Chama — alinhamento dos textos, título do topo, menu, formulário e janela dos projetos.
// (O rosto 3D do topo fica em topo3d.js; a fileira de pôsteres em projetos3d.js.)
(() => {
  document.documentElement.lang = 'pt-BR';
  const celular = () => matchMedia('(max-width: 760px)').matches;
  const larguraBase = () => celular() ? 760 : 1920;
  const u = () => document.documentElement.clientWidth / larguraBase();

  // ---------- Conferência com o layout (?layout) ----------
  if (location.search.includes('layout')) {
    const ref = new Image(); ref.className = 'ref'; ref.alt = ''; ref.src = 'img/_layout-ref.jpg';
    document.body.appendChild(ref);
  }

  // ---------- Alinha os textos pela altura das maiúsculas, como no Photoshop ----------
  const regua = document.createElement('canvas').getContext('2d');
  function alinharTextos() {
    const k = u();
    document.querySelectorAll('.t[data-y], .menu a[data-y]').forEach(el => {
      if (celular() && !el.closest('.topo')) { el.style.left = el.style.top = ''; return; }
      const alvo = el.firstElementChild && !['BR', 'svg', 'SVG'].includes(el.firstElementChild.tagName) && !el.matches('.info-l') ? el.firstElementChild : el;
      const cs = getComputedStyle(alvo);
      const tam = parseFloat(cs.fontSize);
      regua.font = `${cs.fontStyle} ${cs.fontWeight} ${tam}px ${cs.fontFamily}`;
      const mH = regua.measureText('H');
      const A = mH.fontBoundingBoxAscent, D = mH.fontBoundingBoxDescent;
      const L = cs.lineHeight === 'normal' ? tam * 1.2 : parseFloat(cs.lineHeight);
      const capTopo = (L - (A + D)) / 2 + A - mH.actualBoundingBoxAscent;
      el.style.top = (el.dataset.y * k - capTopo) + 'px';
      el.style.left = ((el.dataset.cx ?? el.dataset.x) * k) + 'px';
    });
  }

  // ---------- Título do topo: tamanhos exatos do PSD (50 pt × 3,69 = 184,5 px; "NO" 97 px) ----------
  const titulo = document.getElementById('titulo');
  function posicionarTitulo() {
    const k = u();
    const linhasCel = [
      { x: 40, y: 980, fs: 88 }, { x: 150, y: 1075, fs: 88 },
      { x: 505, y: 1096, fs: 44 }, { x: 70, y: 1170, fs: 88 },
      { x: 330, y: 1265, fs: 88 }
    ];
    titulo.querySelectorAll(':scope > span').forEach((el, i) => {
      const d = celular() ? linhasCel[i] : { x: +el.dataset.x, y: +el.dataset.y, fs: +el.dataset.fs };
      const texto = el.textContent.toUpperCase();
      regua.font = '200px StretchPro';
      const capRatio = regua.measureText('H').actualBoundingBoxAscent / 200;
      const fs = d.fs * k;
      regua.font = `${fs}px StretchPro`;
      const m = regua.measureText(texto);
      const A = m.fontBoundingBoxAscent, D = m.fontBoundingBoxDescent;
      const capTop = (fs - (A + D)) / 2 + A - capRatio * fs;
      el.style.fontSize = fs + 'px';
      el.style.setProperty('--captopo', capTop + 'px');
      el.style.left = (d.x * k + m.actualBoundingBoxLeft) + 'px';
      el.style.top = (d.y * k - capTop) + 'px';
    });
    titulo.classList.add('pronto');
  }

  function arrumarTudo() {
    // a escala usa a largura real (sem a barra de rolagem), igual em CSS e no JS
    document.documentElement.style.setProperty('--u', u() + 'px');
    posicionarTitulo(); alinharTextos();
  }
  Promise.all(['200px StretchPro', '900 40px Stara', '500 40px Stara', '600 40px Stara', 'italic 500 40px Stara'].map(f => document.fonts.load(f)))
    .then(arrumarTudo);
  addEventListener('resize', arrumarTudo);

  // ---------- Menu do celular (painel em tela cheia) ----------
  const painel = document.getElementById('menu-cel');
  const botoesMenu = [document.getElementById('abrir-menu'), document.querySelector('.barra-menu')];
  let quemAbriu = null;
  const fecharMenu = () => {
    if (painel.hidden) return;
    painel.hidden = true; document.body.classList.remove('travado');
    botoesMenu.forEach(b => b.setAttribute('aria-expanded', 'false'));
    quemAbriu && quemAbriu.focus({ preventScroll: true });
  };
  botoesMenu.forEach(b => b.addEventListener('click', () => {
    quemAbriu = b; painel.hidden = false; document.body.classList.add('travado');
    botoesMenu.forEach(x => x.setAttribute('aria-expanded', 'true'));
    painel.querySelector('details')?.removeAttribute('open');
    document.getElementById('fechar-menu').focus();
  }));
  document.getElementById('fechar-menu').onclick = fecharMenu;
  painel.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => { quemAbriu = null; fecharMenu(); }));

  // ---------- Barra fixa: aparece depois do topo, mostra a seção atual e o progresso ----------
  const barra = document.getElementById('barra'), topo = document.getElementById('topo');
  const progresso = document.getElementById('progresso');
  const linksBarra = [...barra.querySelectorAll('.barra-links a')];
  function aoRolar() {
    const y = scrollY, alturaTopo = topo.offsetHeight;
    barra.classList.toggle('visivel', y > alturaTopo * 0.55);
    const total = document.documentElement.scrollHeight - innerHeight;
    progresso.style.setProperty('--p', total > 0 ? (y / total).toFixed(4) : 0);
    // seção atual = a última cujo topo já passou de 40% da tela
    let atual = '';
    ['sobre', 'servicos', 'projetos', 'contato'].forEach(id => {
      const el = document.getElementById(id);
      if (el.getBoundingClientRect().top < innerHeight * 0.4) atual = id;
    });
    linksBarra.forEach(a => a.classList.toggle('ativo', a.dataset.secao === atual));
    if (!barra.classList.contains('visivel') && megaDono && megaDono.closest('.barra')) fecharMega();
  }
  addEventListener('scroll', aoRolar, { passive: true });

  // ---------- Mega menu de soluções ----------
  const mega = document.getElementById('mega');
  const gatilhos = [...document.querySelectorAll('.abre-mega')];
  let megaDono = null, timerFechar = 0;
  const podeHover = matchMedia('(hover: hover) and (pointer: fine)');
  function posicionarMega(dono) {
    const r = dono.getBoundingClientRect();
    const topoMega = dono.closest('.barra') ? barra.getBoundingClientRect().bottom + 10 : r.bottom + 22;
    mega.style.setProperty('--mega-top', Math.max(12, topoMega) + 'px');
  }
  function abrirMega(dono) {
    if (celular()) return;
    clearTimeout(timerFechar);
    if (megaDono === dono && !mega.hidden) return;
    megaDono = dono; posicionarMega(dono);
    mega.hidden = false;
    gatilhos.forEach(g => g.setAttribute('aria-expanded', String(g === dono)));
  }
  function fecharMega(devolverFoco) {
    clearTimeout(timerFechar);
    if (mega.hidden) return;
    mega.hidden = true;
    gatilhos.forEach(g => g.setAttribute('aria-expanded', 'false'));
    if (devolverFoco && megaDono) megaDono.focus({ preventScroll: true });
    megaDono = null;
  }
  const fecharDepois = () => { clearTimeout(timerFechar); timerFechar = setTimeout(() => fecharMega(), 260); };
  gatilhos.forEach(g => {
    g.addEventListener('click', e => {
      if (celular()) return;                // no celular o link só desce até as soluções
      e.preventDefault();
      if (!mega.hidden && megaDono === g) fecharMega(); else abrirMega(g);
    });
    g.addEventListener('mouseenter', () => { if (podeHover.matches) abrirMega(g); });
    g.addEventListener('mouseleave', () => { if (podeHover.matches) fecharDepois(); });
    g.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); abrirMega(g); mega.querySelector('a').focus(); }
    });
  });
  mega.addEventListener('mouseenter', () => clearTimeout(timerFechar));
  mega.addEventListener('mouseleave', () => { if (podeHover.matches) fecharDepois(); });
  mega.addEventListener('focusout', e => { if (!mega.contains(e.relatedTarget) && !gatilhos.includes(e.relatedTarget)) fecharDepois(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!mega.hidden) fecharMega(true);
    if (!painel.hidden) fecharMenu();
  });
  document.addEventListener('pointerdown', e => {
    if (!mega.hidden && !mega.contains(e.target) && !gatilhos.some(g => g.contains(e.target))) fecharMega();
  });
  addEventListener('resize', () => { if (!mega.hidden && megaDono) { if (celular()) fecharMega(); else posicionarMega(megaDono); } });

  // escolher um serviço no menu: desce até ele e acende o cartão
  function destacar(id) {
    const s = document.getElementById(id);
    if (!s) return;
    s.classList.remove('destaque'); void s.offsetWidth; s.classList.add('destaque');
    setTimeout(() => s.classList.remove('destaque'), 2000);
  }
  mega.querySelectorAll('a').forEach(a => a.addEventListener('click', e => {
    const serv = a.dataset.serv;
    fecharMega();
    if (serv) {
      e.preventDefault();
      const alvo = document.getElementById(serv).querySelector('.ico');
      const y = alvo.getBoundingClientRect().top + scrollY - innerHeight * 0.3;
      scrollTo({ top: y, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      setTimeout(() => destacar(serv), 450);
    }
  }));

  // botões que já levam um assunto para o formulário
  document.querySelectorAll('[data-assunto]').forEach(a => a.addEventListener('click', () => {
    const campo = document.getElementById('f-assunto');
    if (!campo.value) { campo.value = a.dataset.assunto; campo.closest('.campo').classList.add('cheio'); }
  }));
  aoRolar();

  // ---------- Formulário → WhatsApp ----------
  const form = document.getElementById('form'), aviso = document.getElementById('aviso');
  form.querySelectorAll('input, textarea').forEach(c => c.addEventListener('input', () => c.closest('.campo').classList.toggle('cheio', !!c.value)));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const nome = form.nome.value.trim(), email = form.email.value.trim(), assunto = form.assunto.value.trim(), msg = form.mensagem.value.trim();
    if (!nome || !msg) { aviso.textContent = 'Preencha pelo menos o nome e a mensagem.'; return; }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) { aviso.textContent = 'Confira o email: parece incompleto.'; return; }
    const texto = `Olá, Chama! Sou ${nome}${email ? ` (${email})` : ''}.${assunto ? `\nAssunto: ${assunto}` : ''}\n\n${msg}`;
    window.open('https://wa.me/5584991191874?text=' + encodeURIComponent(texto), '_blank', 'noopener');
    aviso.textContent = 'Abrimos o WhatsApp com a sua mensagem. É só tocar em enviar.';
  });

  // ---------- Projetos: texto em destaque e janela ----------
  const P = window.PROJETOS;
  const info = document.getElementById('info');
  let mostrado = -1;
  function mostrar(i) {
    if (i === mostrado || i < 0) return;
    mostrado = i; const p = P[i];
    const dois = n => String(n).padStart(2, '0');
    document.getElementById('info-num').textContent = `${dois(i + 1)} / ${dois(P.length)}`;
    document.getElementById('info-tipo').textContent = `${p.genero} · ${p.formato}`;
    document.getElementById('info-titulo').textContent = p.titulo;
    document.getElementById('info-resumo').textContent = p.resumo;
    info.querySelectorAll('.tipo, h3, p').forEach(el => { el.classList.remove('troca-txt'); void el.offsetWidth; el.classList.add('troca-txt'); });
  }
  const janela = document.getElementById('janela');
  function abrir(i) {
    const p = P[i];
    const img = document.getElementById('j-poster'); img.src = `img/posters/${p.id}.jpg`; img.alt = `Pôster de ${p.titulo}`;
    document.getElementById('j-titulo').textContent = p.titulo;
    document.getElementById('j-resumo').textContent = p.resumo;
    document.getElementById('j-genero').textContent = p.genero;
    document.getElementById('j-formato').textContent = p.formato;
    document.getElementById('j-local').textContent = p.local;
    document.getElementById('j-direcao').textContent = p.direcao;
    document.getElementById('j-class').textContent = p.classificacao;
    janela.showModal();
  }
  document.getElementById('fechar').onclick = () => janela.close();
  janela.addEventListener('click', e => { if (e.target === janela) janela.close(); });
  const lista = document.getElementById('lista');
  P.forEach((p, i) => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.textContent = `Ver projeto: ${p.titulo}`; b.onclick = () => abrir(i); b.onfocus = () => mostrar(i);
    li.appendChild(b); lista.appendChild(li);
  });
  if (matchMedia('(pointer: coarse)').matches) document.getElementById('dica').textContent = 'Arraste a roda ou use as setas';
  mostrar(0);
  window.Chama = { mostrar, abrir, atual: () => mostrado };
})();
