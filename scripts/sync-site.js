// Atualiza contatos e metadados no HTML estático, preservando o uso sem JavaScript.
import { readFile as lerArquivo, writeFile as gravarArquivo } from "node:fs/promises";

const arquivoPagina = new URL("../index.html", import.meta.url);
const arquivoConfiguracao = new URL("../config/site.json", import.meta.url);
const arquivoDocumentacao = new URL("../README.md", import.meta.url);
const configuracao = JSON.parse(await lerArquivo(arquivoConfiguracao, "utf8"));
const original = await lerArquivo(arquivoPagina, "utf8");
const documentacaoOriginal = await lerArquivo(arquivoDocumentacao, "utf8");
const apenasVerificar = process.argv.includes("--check");

// Falha de forma explícita se os pontos de atualização forem removidos por engano.
if (
    !original.includes("<!-- metadados:inicio -->")
    || !original.includes("<!-- metadados:fim -->")
    || !documentacaoOriginal.includes("<!-- contatos:inicio -->")
    || !documentacaoOriginal.includes("<!-- contatos:fim -->")
) {
    throw new Error("Preserve os marcadores de metadados no HTML e de contatos no README.");
}

// Valida os dados antes de alterar qualquer arquivo do projeto.
if (!/^55\d{10,11}$/.test(configuracao.whatsapp)) {
    throw new Error("Informe o WhatsApp com 55, DDD e número, usando somente dígitos.");
}

if (!/^[^\s@<>"&]+@[^\s@<>"&]+\.[^\s@<>"&]+$/.test(configuracao.email)) {
    throw new Error("Informe um endereço de e-mail válido.");
}

let enderecoPublico = null;

if (configuracao.enderecoPublico) {
    enderecoPublico = new URL(configuracao.enderecoPublico);

    if (
        enderecoPublico.protocol !== "https:"
        || enderecoPublico.search
        || enderecoPublico.hash
        || enderecoPublico.username
        || enderecoPublico.password
    ) {
        throw new Error("O endereço público deve usar HTTPS e não pode conter parâmetros ou fragmentos.");
    }

    enderecoPublico.pathname = enderecoPublico.pathname.replace(/\/?$/, "/");
}

// Escapa conteúdo usado em atributos e textos HTML.
function escaparHtml(texto) {
    return texto
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

// Mantém as mensagens dos botões e troca somente o destinatário dos links nativos.
let atualizado = original.replace(/href="(https:\/\/wa\.me\/[^\"]+|mailto:[^\"]+)"/g, (_, valor) => {
    const endereco = new URL(valor.replaceAll("&amp;", "&"));
    const destino = endereco.protocol === "mailto:"
        ? `mailto:${configuracao.email}${endereco.search}`
        : `https://wa.me/${configuracao.whatsapp}${endereco.search}`;
    return `href="${escaparHtml(destino)}"`;
});

// Estes marcadores indicam os únicos textos de contato gerenciados pela configuração.
const telefoneLocal = configuracao.whatsapp.slice(2);
const telefoneFormatado = `(${telefoneLocal.slice(0, 2)}) ${telefoneLocal.slice(2, -4)}-${telefoneLocal.slice(-4)}`;
atualizado = atualizado.replace(
    /(<[^>]+data-contato-email[^>]*>)[^<]*(<\/[^>]+>)/g,
    (_, abertura, fechamento) => `${abertura}${escaparHtml(configuracao.email)}${fechamento}`
);
atualizado = atualizado.replace(
    /(<[^>]+data-contato-telefone[^>]*>)[^<]*(<\/[^>]+>)/g,
    (_, abertura, fechamento) => `${abertura}${telefoneFormatado}${fechamento}`
);

// O domínio só é publicado quando houver um endereço definitivo informado.
const imagemSocial = enderecoPublico
    ? new URL("assets/images/social-preview.jpg", enderecoPublico).href
    : "assets/images/social-preview.jpg";
const tituloCompartilhamento = "Piscina Girassol | Serviços de Piscina";
const descricaoCompartilhamento = "Limpeza, manutenção, instalação e produtos para sua piscina. Fale com o Dalmir.";
const metadados = [
    '<meta property="og:site_name" content="Piscina Girassol">',
    `<meta property="og:title" content="${escaparHtml(tituloCompartilhamento)}">`,
    `<meta property="og:description" content="${escaparHtml(descricaoCompartilhamento)}">`,
    `<meta property="og:image" content="${escaparHtml(imagemSocial)}">`,
    ...(enderecoPublico ? [`<meta property="og:image:secure_url" content="${escaparHtml(imagemSocial)}">`] : []),
    '<meta property="og:image:type" content="image/jpeg">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="1200">',
    '<meta property="og:image:alt" content="Logotipo da Piscina Girassol com sol, nadador e ondas em fundo branco.">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escaparHtml(tituloCompartilhamento)}">`,
    `<meta name="twitter:description" content="${escaparHtml(descricaoCompartilhamento)}">`,
    `<meta name="twitter:image" content="${escaparHtml(imagemSocial)}">`,
    '<meta name="twitter:image:alt" content="Logotipo da Piscina Girassol.">'
];

if (enderecoPublico) {
    metadados.push(`<meta property="og:url" content="${escaparHtml(enderecoPublico.href)}">`);
    metadados.push(`<link rel="canonical" href="${escaparHtml(enderecoPublico.href)}">`);
}

// A região delimitada evita alterações em metadados mantidos manualmente.
const blocoMetadados = `<!-- metadados:inicio -->\n        ${metadados.join("\n        ")}\n        <!-- metadados:fim -->`;
atualizado = atualizado.replace(/<!-- metadados:inicio -->[\s\S]*?<!-- metadados:fim -->/, blocoMetadados);

// O README também recebe os contatos para não manter uma segunda fonte de dados.
const blocoContatos = `<!-- contatos:inicio -->\n- **WhatsApp:** [${telefoneFormatado}](https://wa.me/${configuracao.whatsapp})\n- **E-mail:** [${configuracao.email}](mailto:${configuracao.email})\n<!-- contatos:fim -->`;
const documentacaoAtualizada = documentacaoOriginal.replace(/<!-- contatos:inicio -->[\s\S]*?<!-- contatos:fim -->/, blocoContatos);
const alteracoes = [
    { arquivo: arquivoPagina, original, atualizado },
    { arquivo: arquivoDocumentacao, original: documentacaoOriginal, atualizado: documentacaoAtualizada }
];

if (apenasVerificar && alteracoes.some((alteracao) => alteracao.original !== alteracao.atualizado)) {
    console.error("Os contatos ou metadados estão desatualizados. Execute npm run sync.");
    process.exitCode = 1;
} else {
    if (!apenasVerificar) {
        for (const alteracao of alteracoes) {
            if (alteracao.original !== alteracao.atualizado) {
                await gravarArquivo(alteracao.arquivo, alteracao.atualizado);
            }
        }
    }

    console.log("Contatos e metadados conferidos.");
}
