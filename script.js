// ============================================================
// script.js — Lógica principal c/ Motor de Estimativas
// ============================================================

let superficieFiltro = 'todas';
let ordenacaoAtual = 'elo';

function filtrarSuperficie(sup) {
  superficieFiltro = sup;
  document.querySelectorAll('.sup-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderRanking();
}

function calcularElo(nome) {
  const partidas = DB.getPartidas();
  let elo = 1000;
  const K = 32;
  const minhas = partidas.filter(p => p.j1nome === nome || p.j2nome === nome);
  minhas.forEach(p => {
    const euJ1 = p.j1nome === nome;
    const advRank = euJ1 ? (p.j1rankAdv || 50) : (p.j2rankAdv || 50);
    const advEloEstimado = Math.max(200, 2000 - advRank * 10);
    const esperado = 1 / (1 + Math.pow(10, (advEloEstimado - elo) / 400));
    const venceu = euJ1 ? p.j1venceu : p.j2venceu;
    elo += K * ((venceu ? 1 : 0) - esperado);
  });
  return Math.round(elo);
}

function calcularForma(nome) {
  return DB.getPartidas()
    .filter(p => p.j1nome === nome || p.j2nome === nome)
    .slice(-5)
    .map(p => (p.j1nome === nome ? p.j1venceu : p.j2venceu));
}

function getPlayerStats(nome) {
  const partidas = DB.getPartidas();
  let v = 0, d = 0, pts = 0, aces = 0, winners = 0, erros = 0,
      primSaqueSum = 0, ptSaqueSum = 0, ptDevSum = 0, count = 0,
      bpConv = 0, bpSalvos = 0, df = 0, totalBP = 0;

  partidas.forEach(p => {
    const euJ1 = p.j1nome === nome;
    const euJ2 = p.j2nome === nome;
    if (!euJ1 && !euJ2) return;
    if (superficieFiltro !== 'todas' && p.superficie !== superficieFiltro) return;

    const prefix = euJ1 ? 'j1' : 'j2';
    if (euJ1 ? p.j1venceu : p.j2venceu) v++; else d++;

    pts += p[prefix + 'pontos'] || 0; aces += p[prefix + 'aces'] || 0;
    winners += p[prefix + 'winners'] || 0; erros += p[prefix + 'erros'] || 0;
    df += p[prefix + 'df'] || 0; bpConv += p[prefix + 'bpConv'] || 0; bpSalvos += p[prefix + 'bpSalvos'] || 0;
    totalBP += (p[prefix + 'bpConv'] || 0) + (p[prefix + 'bpSalvos'] || 0);

    if (p[prefix + 'primSaque']) { primSaqueSum += p[prefix + 'primSaque']; count++; }
    if (p[prefix + 'ptSaque']) ptSaqueSum += p[prefix + 'ptSaque'];
    if (p[prefix + 'ptDev']) ptDevSum += p[prefix + 'ptDev'];
  });

  const avg = val => count ? Math.round(val / count) : 0;
  return {
    v, d, pts, aces, winners, erros, df, bpConv, bpSalvos, totalBP,
    primSaque: avg(primSaqueSum), ptSaque: avg(ptSaqueSum), ptDev: avg(ptDevSum),
    clutch: totalBP ? Math.min(100, Math.round(((bpConv + bpSalvos) / totalBP) * 100)) : 50
  };
}

function renderRanking() {
  const jogadores = DB.getJogadores();
  const list = document.getElementById('ranking-list');
  if (!list) return;

  if (jogadores.length === 0) {
    list.innerHTML = `<div class="empty-state"><i class="fas fa-trophy"></i>Nenhum jogador. Vá em <strong>Jogadores</strong>.</div>`;
    return;
  }

  const dados = jogadores.map(j => ({ ...j, ...getPlayerStats(j.nome), elo: calcularElo(j.nome), forma: calcularForma(j.nome) }));

  const sorts = {
    elo: (a, b) => b.elo - a.elo, vitorias: (a, b) => b.v - a.v, derrotas: (a, b) => b.d - a.d,
    pontos: (a, b) => b.pts - a.pts, menosPontos: (a, b) => a.pts - b.pts, aces: (a, b) => b.aces - a.aces,
    winners: (a, b) => b.winners - a.winners, erros: (a, b) => a.erros - b.erros,
    clutch: (a, b) => b.clutch - a.clutch, forma: (a, b) => b.forma.filter(Boolean).length - a.forma.filter(Boolean).length
  };
  dados.sort(sorts[ordenacaoAtual] || sorts.elo);

  list.innerHTML = dados.map((j, i) => {
    const pos = i + 1;
    const rowClass = pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : '';
    const posIcon = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '#' + pos;
    const formaHTML = j.forma.length ? j.forma.map(w => `<span class="forma-${w ? 'w' : 'l'}"></span>`).join('') : '—';
    const sup = {clay:'🟫', hard:'🔵', grass:'🟢'}[j.superficieFavorita] || '';

    return `
    <div class="ranking-row ${rowClass}">
      <span class="pos-badge pos${pos}">${posIcon}</span>
      <span><div class="player-name">${j.nome}</div><div class="player-sub">${j.pais||''} ${sup}</div></span>
      <span><span class="elo-badge">${j.elo}</span></span>
      <span class="vd-badge"><span class="v">${j.v}V</span> / <span class="d">${j.d}D</span></span>
      <span>${j.pts}</span><span>${j.aces}</span><span>${j.winners}</span><span>${j.primSaque ? j.primSaque+'%' : '—'}</span>
      <span>
        <div class="clutch-bar"><div class="clutch-fill" style="width:${j.clutch||50}%"></div></div>
        <div style="font-size:0.7rem;color:rgba(255,255,255,0.5)">${j.clutch||50}%</div>
      </span>
      <span><div class="forma-badges">${formaHTML}</div></span>
    </div>`;
  }).join('');
}

function ordenar(tipo) {
  ordenacaoAtual = tipo;
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderRanking();
}

// ==========================================
// REGISTRO DE PARTIDA E ESTIMATIVA DE STATS
// ==========================================
function registrarPartida() {
  const v = id => document.getElementById(id)?.value.trim() || '';
  const n = id => parseInt(document.getElementById(id)?.value) || 0;

  if (!v('j1nome') || !v('j2nome')) return toast('⚠️ Preencha os dois jogadores!', 'error');
  if (v('j1nome') === v('j2nome')) return toast('⚠️ Jogadores não podem ter o mesmo nome!', 'error');

  const j1sets = [n('j1s1'), n('j1s2'), n('j1s3')];
  const j2sets = [n('j2s1'), n('j2s2'), n('j2s3')];
  
  const j1Games = j1sets.reduce((a,b)=>a+b, 0);
  const j2Games = j2sets.reduce((a,b)=>a+b, 0);
  const totalGames = j1Games + j2Games;
  
  if (totalGames === 0) return toast('⚠️ Preencha o placar de pelo menos 1 set!', 'error');

  let v1 = 0, v2 = 0;
  for(let i=0; i<3; i++) { if(j1sets[i] > j2sets[i]) v1++; else if(j2sets[i] > j1sets[i]) v2++; }
  const j1venceu = v1 > v2;

  // ===== INÍCIO DAS ESTIMATIVAS =====
  const sup = v('superficie');
  let aceMultiplier = sup === 'grass' ? 0.6 : sup === 'clay' ? 0.2 : 0.4;
  
  // Total de pontos de um jogo de tênis varia em torno de 6.2 pontos por game
  const ptsTotalBase = Math.round(totalGames * 6.2);
  
  // Quem ganha mais games ganha mais pontos
  const j1RatioGames = j1Games / totalGames;
  // A diferença de pontos não é tão grande quanto a de games (ex: 6-0 não significa 100% dos pontos)
  const j1RatioPts = 0.5 + (j1RatioGames - 0.5) * 0.7; 

  const j1pts = Math.round(ptsTotalBase * j1RatioPts);
  const j2pts = ptsTotalBase - j1pts;

  // Aces, Winners e Erros
  const j1aces = Math.round(totalGames * aceMultiplier * j1RatioGames * (0.8 + Math.random()*0.4));
  const j2aces = Math.round(totalGames * aceMultiplier * (1 - j1RatioGames) * (0.8 + Math.random()*0.4));

  const j1winners = Math.round((totalGames * 1.5 * j1RatioGames) + j1aces);
  const j2winners = Math.round((totalGames * 1.5 * (1 - j1RatioGames)) + j2aces);

  // Quem perde games comete mais erros
  const j1erros = Math.round(totalGames * 1.8 * (1 - j1RatioGames) + Math.random()*5);
  const j2erros = Math.round(totalGames * 1.8 * j1RatioGames + Math.random()*5);

  // Breakpoints = dependem da diferença de placar
  const j1bpConv = Math.max(0, Math.round((j1Games - j2Games) / 2) + Math.floor(Math.random()*2));
  const j2bpConv = Math.max(0, Math.round((j2Games - j1Games) / 2) + Math.floor(Math.random()*2));
  const j1bpSalvos = Math.round(j2bpConv * (0.3 + Math.random()*0.5));
  const j2bpSalvos = Math.round(j1bpConv * (0.3 + Math.random()*0.5));

  // % de Saque realista
  const j1primSaque = 55 + Math.floor(Math.random()*15); // Entre 55 e 70%
  const j2primSaque = 55 + Math.floor(Math.random()*15);
  // ===== FIM DAS ESTIMATIVAS =====

  const partida = {
    id: Date.now(), 
    torneio: v('torneio') || 'Amistoso', 
    categoria: v('categoria'),
    data: v('data') || new Date().toISOString().split('T')[0], 
    superficie: sup,

    j1nome: v('j1nome'), 
    j1venceu: j1venceu, 
    j1sets: j1sets.join('-'),
    j1pontos: j1pts, 
    j1aces: j1aces, 
    j1winners: j1winners, 
    j1erros: j1erros,
    j1primSaque: j1primSaque, 
    j1bpConv: j1bpConv, 
    j1bpSalvos: j1bpSalvos,
    j1df: Math.floor(Math.random()*4), // 0 a 3 duplas faltas

    j2nome: v('j2nome'), 
    j2venceu: !j1venceu, 
    j2sets: j2sets.join('-'),
    j2pontos: j2pts, 
    j2aces: j2aces, 
    j2winners: j2winners, 
    j2erros: j2erros,
    j2primSaque: j2primSaque, 
    j2bpConv: j2bpConv, 
    j2bpSalvos: j2bpSalvos,
    j2df: Math.floor(Math.random()*4),
  };

  // Salva novos jogadores se não existirem
  const jogadores = DB.getJogadores();
  [v('j1nome'), v('j2nome')].forEach(nome => {
    if (!jogadores.find(j => j.nome === nome)) {
      jogadores.push({ nome, pais: 'Desconhecido', mao: 'Direita', superficieFavorita: sup });
    }
  });
  DB.salvarJogadores(jogadores);

  // Salva partida
  const partidas = DB.getPartidas();
  partidas.push(partida);
  DB.salvarPartidas(partidas);
  
  document.querySelectorAll('.set-input').forEach(e => e.value = '');
  document.getElementById('j1nome').value = '';
  document.getElementById('j2nome').value = '';

  toast('✅ Partida salva! Estatísticas avançadas foram geradas.');
  renderHistorico();
}

function renderHistorico() {
  const el = document.getElementById('historico-lista');
  if (!el) return;
  const partidas = DB.getPartidas().slice().reverse();
  if (!partidas.length) return el.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i>Nenhuma partida ainda.</div>';

  el.innerHTML = partidas.map(p => {
    const s1 = p.j1sets.split('-'), s2 = p.j2sets.split('-');
    const score = s1.map((v,i) => `${v}-${s2[i]}`).filter(s => s !== '0-0').join(' ');
    const sup = {clay:'🟫', hard:'🔵', grass:'🟢'}[p.superficie] || '';
    
    return `
    <div class="historico-item">
      <div>
        <div class="hist-match">${sup} ${p.j1nome} vs ${p.j2nome}</div>
        <div class="hist-meta">${p.torneio} · ${p.data.split('-').reverse().join('/')}</div>
        <div class="hist-meta">🏆 Venceu: <b>${p.j1venceu ? p.j1nome : p.j2nome}</b></div>
      </div>
      <div>
        <div class="hist-score">${score||'—'}</div>
        <div style="font-size:0.7rem; color:var(--yellow); text-align:right;">+ Stats estimadas</div>
      </div>
      <button class="btn-del" onclick="deletarPartida(${p.id})"><i class="fas fa-trash"></i></button>
    </div>`;
  }).join('');
}

function deletarPartida(id) {
  if(!confirm('Remover partida?')) return;
  DB.salvarPartidas(DB.getPartidas().filter(p => p.id !== id));
  renderHistorico(); 
  toast('🗑️ Removida com sucesso');
}

function cadastrarJogador() {
  const n = document.getElementById('novoNome')?.value.trim();
  if(!n) return toast('⚠️ Digite o nome do jogador!', 'error');
  const jogs = DB.getJogadores();
  if(jogs.find(j=>j.nome===n)) return toast('⚠️ Este jogador já existe!', 'error');
  
  jogs.push({ 
      nome: n, 
      pais: document.getElementById('novoPais')?.value, 
      mao: document.getElementById('novoMao')?.value, 
      superficieFavorita: document.getElementById('novoSup')?.value 
  });
  DB.salvarJogadores(jogs);
  toast('✅ Jogador cadastrado!');
  renderListaJogadores();
}

function renderListaJogadores() {
  const el = document.getElementById('lista-jogadores');
  if (!el) return;
  const jogs = DB.getJogadores();
  if(!jogs.length) return el.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i>Nenhum jogador cadastrado.</div>';
  
  el.innerHTML = jogs.map((j, i) => {
    const s = getPlayerStats(j.nome);
    return `
    <div class="jogador-item">
      <div>
        <b>${j.nome}</b><br>
        <small>${j.pais||''} · Rank/Elo: ${calcularElo(j.nome)}</small>
      </div>
      <button class="btn-del" onclick="deletarJogador(${i})"><i class="fas fa-trash"></i></button>
    </div>`;
  }).join('');
}

function deletarJogador(i) {
  if(!confirm('Deseja realmente apagar este jogador?')) return;
  const jogs = DB.getJogadores(); 
  jogs.splice(i,1); 
  DB.salvarJogadores(jogs);
  renderListaJogadores(); 
  toast('🗑️ Jogador apagado');
}

function initComparador() {
  const sel1 = document.getElementById('compJ1'), sel2 = document.getElementById('compJ2');
  if(!sel1 || !sel2) return;
  const opts = '<option value="">Selecione...</option>' + DB.getJogadores().map(j => `<option value="${j.nome}">${j.nome}</option>`).join('');
  sel1.innerHTML = opts; sel2.innerHTML = opts;
}

function comparar() {
  const n1 = document.getElementById('compJ1').value, n2 = document.getElementById('compJ2').value;
  const el = document.getElementById('comparador-resultado');
  if(!n1 || !n2 || n1===n2) return el.innerHTML = '';
  const s1 = getPlayerStats(n1), s2 = getPlayerStats(n2);
  
  const metricas = [
    { L: 'ELO Rating', v1: calcularElo(n1), v2: calcularElo(n2), h: true, fmt: v=>v },
    { L: 'Vitórias', v1: s1.v, v2: s2.v, h: true, fmt: v=>v },
    { L: 'Derrotas', v1: s1.d, v2: s2.d, h: false, fmt: v=>v },
    { L: 'Aces', v1: s1.aces, v2: s2.aces, h: true, fmt: v=>v },
    { L: 'Winners', v1: s1.winners, v2: s2.winners, h: true, fmt: v=>v },
    { L: 'Erros NF', v1: s1.erros, v2: s2.erros, h: false, fmt: v=>v },
    { L: '1º Saque', v1: s1.primSaque, v2: s2.primSaque, h: true, fmt: v=>v+'%' },
    { L: 'Clutch Factor', v1: s1.clutch, v2: s2.clutch, h: true, fmt: v=>v+'%' },
  ];

  el.innerHTML = '<div class="comp-table">' + metricas.map(m => {
    const w1 = m.h ? m.v1 >= m.v2 : m.v1 <= m.v2;
    const w2 = !w1;
    const max = Math.max(m.v1, m.v2) || 1;
    return `
    <div class="comp-row">
      <div class="comp-bar-wrap" style="flex-direction:row-reverse">
        <span class="${w1?'winner':''}" style="font-weight:600">${m.fmt(m.v1)}</span>
        <div class="comp-bar"><div class="comp-bar-fill" style="width:${(m.v1/max)*100}%"></div></div>
      </div>
      <div class="comp-lbl">${m.L}</div>
      <div class="comp-bar-wrap">
        <div class="comp-bar"><div class="comp-bar-fill right" style="width:${(m.v2/max)*100}%"></div></div>
        <span class="${w2?'winner':''}" style="font-weight:600">${m.fmt(m.v2)}</span>
      </div>
    </div>`;
  }).join('') + '</div>';
}

function toast(msg, type='success') {
  const o = document.createElement('div'); o.className = 'toast'; o.textContent = msg;
  if(type==='error') o.style.background = 'linear-gradient(135deg, #c0392b, #e74c3c)';
  document.body.appendChild(o); setTimeout(()=>o.remove(), 3000);
}
