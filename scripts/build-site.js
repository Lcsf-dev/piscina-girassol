// Reúne somente os arquivos públicos necessários para a hospedagem estática.
import { cp as copiar, mkdir as criarPasta, rm as remover } from "node:fs/promises";
import { dirname as obterDiretorio, resolve as resolverCaminho } from "node:path";
import { fileURLToPath as converterUrlParaCaminho } from "node:url";

const pastaProjeto = resolverCaminho(obterDiretorio(converterUrlParaCaminho(import.meta.url)), "..");
const pastaPublicacao = resolverCaminho(pastaProjeto, "dist");

// Limita a limpeza à pasta gerada pelo próprio comando, dentro deste projeto.
if (obterDiretorio(pastaPublicacao) !== pastaProjeto || pastaPublicacao === pastaProjeto) {
    throw new Error("A pasta de publicação deve permanecer dentro do projeto.");
}

await remover(pastaPublicacao, { recursive: true, force: true });
await criarPasta(pastaPublicacao, { recursive: true });

// A lista explícita mantém documentação, configurações e ferramentas fora do site público.
const arquivosPublicos = [
    "index.html",
    "favicon.ico",
    "site.webmanifest",
    "browserconfig.xml",
    "styles/main.css",
    "scripts/main.js",
    "scripts/theme.js",
    "assets/icons",
    "assets/images"
];

for (const arquivo of arquivosPublicos) {
    const destino = resolverCaminho(pastaPublicacao, arquivo);
    await criarPasta(obterDiretorio(destino), { recursive: true });
    await copiar(resolverCaminho(pastaProjeto, arquivo), destino, { recursive: true });
}

console.log("Arquivos públicos preparados em dist.");
