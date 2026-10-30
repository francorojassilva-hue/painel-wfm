// Gera uma base fictícia de WFM/operação (uma linha por dia x fila) em dados/base_wfm.csv
// Uso: node gerar_base_ficticia.js [dias] [data_final AAAA-MM-DD]
const fs = require("fs");
const path = require("path");

const DIAS = parseInt(process.argv[2] || "90", 10);
const FIM = process.argv[3] ? new Date(process.argv[3] + "T00:00:00") : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 1); return d; })();

// Gerador aleatório com semente fixa: a mesma execução gera sempre os mesmos números
let seed = 20261029;
const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const normal = (m, dp) => m + dp * Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// canal, fila, volume previsto base (dia útil), TMA alvo (seg), abandona? (e-mail não abandona)
const FILAS = [
  { canal: "Voz", fila: "Suporte Técnico", base: 1800, tma: 420, abandona: true },
  { canal: "Voz", fila: "Vendas", base: 900, tma: 360, abandona: true },
  { canal: "Voz", fila: "Financeiro", base: 700, tma: 300, abandona: true },
  { canal: "Chat", fila: "Suporte Técnico", base: 1200, tma: 540, abandona: true },
  { canal: "Chat", fila: "Vendas", base: 600, tma: 480, abandona: true },
  { canal: "E-mail", fila: "Backoffice", base: 500, tma: 480, abandona: false },
];
// Domingo..Sábado
const SAZONAL_SEMANA = [0.35, 1.15, 1.05, 1.0, 0.98, 0.95, 0.55];
const MIN_POR_AGENTE = 360; // jornada de 6h
const OCUPACAO_ALVO = 0.85;

const cab = ["data", "canal", "fila", "volume_previsto", "volume_recebido", "volume_atendido", "volume_abandonado",
  "atendidas_no_sla", "tma_seg", "tme_seg", "hc_escalado", "hc_presente", "minutos_logados"];
const linhas = [cab.join(",")];

for (let i = DIAS - 1; i >= 0; i--) {
  const d = new Date(FIM); d.setDate(d.getDate() - i);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const evento = rand() < 0.04 ? normal(1.25, 0.08) : 1; // pico não previsto (ex.: instabilidade)
  for (const f of FILAS) {
    let fator = SAZONAL_SEMANA[d.getDay()];
    if (f.fila === "Financeiro" && d.getDate() <= 5) fator *= 1.3; // vencimento de faturas
    const previsto = Math.round(f.base * fator * normal(1, 0.02));
    const recebido = Math.max(0, Math.round(previsto * normal(1, 0.06) * (f.fila === "Suporte Técnico" ? evento : 1)));
    const tma = Math.round(f.tma * normal(1, 0.05));

    const cargaPrev = previsto * f.tma / 60; // minutos de atendimento previstos
    const escalado = Math.max(2, Math.ceil(cargaPrev / (MIN_POR_AGENTE * OCUPACAO_ALVO)));
    const absent = clamp(normal(d.getDay() === 1 ? 0.11 : 0.07, 0.025), 0.01, 0.25);
    const presente = Math.max(1, Math.round(escalado * (1 - absent)));
    const logados = Math.round(presente * MIN_POR_AGENTE * clamp(normal(0.97, 0.015), 0.9, 1));

    const capacidade = logados * OCUPACAO_ALVO / Math.max(1, recebido * tma / 60); // >1 = sobra de gente
    const ns = clamp(0.86 + (capacidade - 1) * 1.2 + normal(0, 0.03), 0.35, 0.98);
    const abandPct = f.abandona ? clamp(0.03 + (1 - capacidade) * 0.35 + normal(0, 0.008), 0.005, 0.3) : 0;
    const abandonado = Math.round(recebido * abandPct);
    const atendido = recebido - abandonado;
    const noSla = Math.min(atendido, Math.round(recebido * ns));
    const tme = Math.round(clamp(15 + (1 - ns) * (f.canal === "E-mail" ? 20000 : 260) + normal(0, 4), 3, 30000));

    linhas.push([iso, f.canal, f.fila, previsto, recebido, atendido, abandonado, noSla, tma, tme, escalado, presente, logados].join(","));
  }
}

const saida = path.join(__dirname, "dados", "base_wfm.csv");
fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, linhas.join("\n") + "\n", "utf8");
console.log(`OK: ${linhas.length - 1} linhas gravadas em ${saida}`);
