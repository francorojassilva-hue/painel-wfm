// Servidor local só para testar o painel: node servidor_local.js  ->  http://localhost:8080
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORTA = 8080;
const TIPOS = { ".html": "text/html; charset=utf-8", ".csv": "text/csv; charset=utf-8", ".js": "text/javascript" };

http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
  const arq = path.join(__dirname, rel);
  if (!arq.startsWith(__dirname)) { res.writeHead(403); return res.end(); }
  fs.readFile(arq, (err, conteudo) => {
    if (err) { res.writeHead(404); return res.end("Não encontrado"); }
    res.writeHead(200, { "Content-Type": TIPOS[path.extname(arq)] || "application/octet-stream" });
    res.end(conteudo);
  });
}).listen(PORTA, () => console.log(`Painel em http://localhost:${PORTA}`));
