// Disponibiliza o site localmente usando apenas recursos nativos do Node.js.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve a pasta do projeto independentemente do diretório do terminal.
const pastaProjeto = resolve(dirname(fileURLToPath(import.meta.url)), "..");
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
const servidor = createServer(async (requisicao, resposta) => {
    if (!["GET", "HEAD"].includes(requisicao.method)) {
        resposta.writeHead(405, { Allow: "GET, HEAD" });
        resposta.end("Método não permitido.");
        return;
    }

    try {
        const endereco = new URL(requisicao.url, "http://localhost");
        const caminhoPedido = decodeURIComponent(endereco.pathname);
        const caminhoRelativo = caminhoPedido === "/" ? "index.html" : caminhoPedido.slice(1);
        const caminhoArquivo = resolve(pastaProjeto, caminhoRelativo);
        const caminhoNormalizado = relative(pastaProjeto, caminhoArquivo);
        const caminhoPublico = caminhoNormalizado.split(sep).join("/");
        const permitido = ["index.html", "favicon.ico", "site.webmanifest", "browserconfig.xml"].includes(caminhoPublico)
            || /^(styles|scripts|assets\/icons)\/[a-z0-9-]+\.(css|js|svg|png)$/.test(caminhoPublico)
            || /^assets\/images\/(responsive\/)?[a-z0-9-]+\.(png|jpg|jpeg|webp)$/.test(caminhoPublico);

        if (!permitido || ["scripts/server.js", "scripts/sync-site.js"].includes(caminhoPublico)) {
            resposta.writeHead(404);
            resposta.end("Arquivo não encontrado.");
            return;
        }

        const conteudo = await readFile(caminhoArquivo);
        resposta.writeHead(200, {
            "Content-Type": tiposConteudo[extname(caminhoArquivo)] || "application/octet-stream",
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
