// Disponibiliza o site localmente usando apenas recursos nativos do Node.js.
import { createServer as criarServidor } from "node:http";
import { readFile as lerArquivo } from "node:fs/promises";
import {
    dirname as obterDiretorio,
    extname as obterExtensao,
    relative as obterCaminhoRelativo,
    resolve as resolverCaminho,
    sep as separador
} from "node:path";
import { fileURLToPath as converterUrlParaCaminho } from "node:url";

// Resolve a pasta do projeto independentemente do diretório do terminal.
const pastaProjeto = resolverCaminho(obterDiretorio(converterUrlParaCaminho(import.meta.url)), "..");
const porta = Number(process.env.PORT || 5500);
const tiposConteudo = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8"
};

// Entrega somente arquivos públicos, sem expor configurações ou fontes originais.
const servidor = criarServidor(async (requisicao, resposta) => {
    if (!["GET", "HEAD"].includes(requisicao.method)) {
        resposta.writeHead(405, { Allow: "GET, HEAD" });
        resposta.end("Método não permitido.");
        return;
    }

    try {
        const endereco = new URL(requisicao.url, "http://localhost");
        const caminhoPedido = decodeURIComponent(endereco.pathname);
        const caminhoRelativo = caminhoPedido === "/" ? "index.html" : caminhoPedido.slice(1);
        const caminhoArquivo = resolverCaminho(pastaProjeto, caminhoRelativo);
        const caminhoNormalizado = obterCaminhoRelativo(pastaProjeto, caminhoArquivo);
        const caminhoPublico = caminhoNormalizado.split(separador).join("/");
        const permitido = ["index.html", "favicon.ico", "site.webmanifest", "browserconfig.xml"].includes(caminhoPublico)
            || /^(styles|scripts|assets\/icons)\/[a-z0-9-]+\.(css|js|svg|png)$/.test(caminhoPublico)
            || /^assets\/images\/(responsive\/)?[a-z0-9-]+\.(png|jpg|jpeg|webp)$/.test(caminhoPublico);

        if (!permitido || ["scripts/server.js", "scripts/sync-site.js", "scripts/build-site.js"].includes(caminhoPublico)) {
            resposta.writeHead(404);
            resposta.end("Arquivo não encontrado.");
            return;
        }

        const conteudo = await lerArquivo(caminhoArquivo);
        resposta.writeHead(200, {
            "Content-Type": tiposConteudo[obterExtensao(caminhoArquivo)] || "application/octet-stream",
            "X-Content-Type-Options": "nosniff"
        });
        resposta.end(requisicao.method === "HEAD" ? undefined : conteudo);
    } catch (erro) {
        // Caminhos inválidos e arquivos ausentes recebem respostas sem detalhes internos.
        resposta.writeHead(erro.code === "ENOENT" ? 404 : 400);
        resposta.end("Não foi possível acessar este endereço.");
    }
});

// O servidor de desenvolvimento atende somente neste computador.
servidor.listen(porta, "127.0.0.1", () => {
    console.log(`Piscina Girassol disponível em http://127.0.0.1:${porta}`);
});
