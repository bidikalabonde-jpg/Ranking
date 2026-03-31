// ============================================================
// data.js — Gerenciamento de dados (localStorage)
// ============================================================

const DB = {
  // ---- JOGADORES ----
  getJogadores() {
    return JSON.parse(localStorage.getItem('tr_jogadores') || '[]');
  },
  salvarJogadores(list) {
    localStorage.setItem('tr_jogadores', JSON.stringify(list));
  },

  // ---- PARTIDAS ----
  getPartidas() {
    return JSON.parse(localStorage.getItem('tr_partidas') || '[]');
  },
  salvarPartidas(list) {
    localStorage.setItem('tr_partidas', JSON.stringify(list));
  },

  // ---- STATS ----
  getStats() {
    return JSON.parse(localStorage.getItem('tr_stats') || '{}');
  },
  salvarStats(obj) {
    localStorage.setItem('tr_stats', JSON.stringify(obj));
  }
};

// Pontos por categoria/fase
const PONTOS_TABELA = {
  'Grand Slam':   { 'Final': 2000, 'Semifinal': 1200, 'Quartas': 720, 'Oitavas': 360, '3R': 180, '2R': 90,  '1R': 10  },
  'Masters 1000': { 'Final': 1000, 'Semifinal': 600,  'Quartas': 360, 'Oitavas': 180, '3R': 90,  '2R': 45,  '1R': 10  },
  'ATP 500':      { 'Final': 500,  'Semifinal': 300,  'Quartas': 180, 'Oitavas': 90,  '2R': 45,  '1R': 0   },
  'ATP 250':      { 'Final': 250,  'Semifinal': 150,  'Quartas': 90,  'Oitavas': 45,  '2R': 20,  '1R': 0   },
  'Challenger':   { 'Final': 125,  'Semifinal': 75,   'Quartas': 45,  'Oitavas': 20,  '2R': 10,  '1R': 0   },
  'ITF':          { 'Final': 35,   'Semifinal': 20,   'Quartas': 10,  '1R': 0 },
  'Amador':       { 'Final': 10,   'Semifinal': 6,    'Quartas': 3,   '1R': 0 }
};

function getPontosTabela(categoria, fase) {
  const cat = PONTOS_TABELA[categoria] || PONTOS_TABELA['Amador'];
  return cat[fase] || 0;
}
