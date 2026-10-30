# Painel WFM — dashboard que se atualiza sozinho

Painel em HTML (gráficos + filtros) que lê um CSV publicado do Google Sheets **toda vez que é aberto**
(e a cada 10 minutos, se ficar aberto). Não há dados embutidos: entrou linha nova na planilha, o painel mostra.
O link do GitHub Pages nunca muda.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | O painel. A única linha a editar é `const CSV_URL = "";` |
| `dados/base_wfm.csv` | Base fictícia de exemplo (90 dias × 6 filas). Importe no Google Sheets |
| `gerar_base_ficticia.js` | Gera a base fictícia: `node gerar_base_ficticia.js 90 2026-10-28` |
| `servidor_local.js` | Servidor para testar no seu PC: `node servidor_local.js` → http://localhost:8080 |

## Colunas da planilha (uma linha por dia × fila)

Mantenha **exatamente** estes nomes, na primeira linha, numa única aba. Todos os números são inteiros.

| Coluna | Significado |
|---|---|
| `data` | Dia (AAAA-MM-DD ou DD/MM/AAAA — os dois funcionam) |
| `canal` | Voz, Chat, E-mail… |
| `fila` | Suporte Técnico, Vendas… |
| `volume_previsto` | Forecast do dia |
| `volume_recebido` | Contatos oferecidos |
| `volume_atendido` | Contatos atendidos |
| `volume_abandonado` | Contatos abandonados |
| `atendidas_no_sla` | Atendidas dentro do tempo de SLA |
| `tma_seg` | TMA/AHT em segundos |
| `tme_seg` | TME/ASA em segundos |
| `hc_escalado` | Agentes escalados |
| `hc_presente` | Agentes que compareceram |
| `minutos_logados` | Soma dos minutos logados |

Indicadores calculados (sempre soma ÷ soma, ponderados — igual a uma medida DAX bem feita):
NS = `atendidas_no_sla / volume_recebido` · Abandono = `abandonado / recebido` · TMA/TME ponderados por atendidas ·
Absenteísmo = `1 − presente / escalado` · Ocupação = `(atendidas × TMA) / minutos logados` · Desvio = `recebido / previsto − 1`.

---

## Passo a passo de publicação

### 1. Google Sheets (você faz)
1. Crie uma planilha nova → **Arquivo › Importar › Fazer upload** → `dados/base_wfm.csv` → "Substituir planilha atual".
2. **Arquivo › Compartilhar › Publicar na Web** → escolha a aba → formato **Valores separados por vírgula (.csv)** → Publicar.
3. Copie o link (termina em `output=csv`). ⚠️ Esse link é público: nada de dados sensíveis.
4. No `index.html`, cole o link: `const CSV_URL = "https://docs.google.com/.../pub?...&output=csv";`

> O Google pode levar ~5 minutos para refletir uma edição no CSV publicado. É normal.

### 2. Instalar o Git (uma vez só)
```bash
winget install --id Git.Git -e
```
Feche e reabra o terminal depois. Configure seu nome/e-mail (aparecem nos commits):
```bash
git config --global user.name "Seu Nome"
```
```bash
git config --global user.email "seu-email@exemplo.com"
```

### 3. Criar o repositório no GitHub
Em https://github.com/new: nome `painel-wfm`, **Public** (o Pages gratuito exige repositório público), sem README. Create.

### 4. Enviar os arquivos (dentro desta pasta)
```bash
git init
```
```bash
git add .
```
```bash
git commit -m "Primeira versao do painel WFM"
```
```bash
git branch -M main
```
```bash
git remote add origin https://github.com/SEU-USUARIO/painel-wfm.git
```
```bash
git push -u origin main
```
- `init` cria o controle de versão na pasta · `add` escolhe o que vai no pacote · `commit` "fotografa" esse pacote ·
  `remote add` diz para onde enviar · `push` envia. No primeiro `push` abre uma janela de login do GitHub.

### 5. Ativar o GitHub Pages
No repositório: **Settings › Pages › Build and deployment** → Source: *Deploy from a branch* → Branch: `main` / `(root)` → Save.
Em 1–2 minutos o link aparece: `https://SEU-USUARIO.github.io/painel-wfm/` — esse é o link fixo do painel.

### 6. Dia a dia
- **Dados novos:** só adicione linhas na planilha. Não precisa mexer no GitHub.
- **Mudou o visual do painel:** `git add .` → `git commit -m "o que mudou"` → `git push`. O link continua o mesmo.
