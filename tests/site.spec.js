// Exercita os comportamentos do visitante em cada perfil, sem abrir serviços externos.
import { test as teste, expect as esperar } from "@playwright/test";
import { readFileSync as lerArquivoSincrono } from "node:fs";

const configuracao = JSON.parse(lerArquivoSincrono(new URL("../config/site.json", import.meta.url), "utf8"));

// Usa toque nos perfis móveis e clique no computador.
async function acionar(elemento, possuiToque) {
    if (possuiToque) {
        await elemento.tap();
    } else {
        await elemento.click();
    }
}

teste("preserva o conteúdo, carrega as imagens e não cria rolagem horizontal", async ({ page: pagina }) => {
    const erros = [];
    pagina.on("pageerror", (erro) => erros.push(erro.message));
    pagina.on("response", (resposta) => {
        if (resposta.status() >= 400) {
            erros.push(`${resposta.status()} ${resposta.url()}`);
        }
    });

    await pagina.goto("/");
    await esperar(pagina.locator("h1")).toHaveCount(1);
    await esperar(pagina.locator(".cartao-servico")).toHaveCount(4);

    // Percorrer as imagens também verifica as que usam carregamento adiado.
    for (const imagem of await pagina.locator("img").all()) {
        await imagem.scrollIntoViewIfNeeded();
        await esperar.poll(() => imagem.evaluate((elemento) => elemento.complete && elemento.naturalWidth > 0)).toBe(true);
    }

    const dimensoes = await pagina.evaluate(() => ({
        janela: innerWidth,
        documento: document.documentElement.scrollWidth,
        colunas: getComputedStyle(document.querySelector(".servicos-grade")).gridTemplateColumns.split(" ").length
    }));
    esperar(dimensoes.documento).toBeLessThanOrEqual(dimensoes.janela);
    esperar(dimensoes.colunas).toBe(dimensoes.janela <= 520 ? 1 : 2);
    esperar(erros).toEqual([]);
});

teste("mantém o menu utilizável por toque, teclado e mudança de orientação", async ({ page: pagina, hasTouch: possuiToque }) => {
    await pagina.goto("/");
    const botao = pagina.locator("#alternar-menu");
    const menu = pagina.locator("#menu-principal");

    if (pagina.viewportSize().width > 760) {
        await esperar(botao).toBeHidden();
        await esperar(menu).toBeVisible();
        return;
    }

    await acionar(botao, possuiToque);
    await esperar(botao).toHaveAttribute("aria-expanded", "true");
    await esperar(menu).toBeVisible();
    await pagina.keyboard.press("Escape");
    await esperar(botao).toHaveAttribute("aria-expanded", "false");
    await esperar(botao).toBeFocused();

    await acionar(botao, possuiToque);
    await acionar(menu.getByRole("link", { name: "Serviços", exact: true }), possuiToque);
    await esperar(menu).toBeHidden();

    await acionar(botao, possuiToque);
    const tamanhoOriginal = pagina.viewportSize();
    await pagina.setViewportSize({ width: 900, height: 500 });
    await esperar(menu).toBeVisible();
    await esperar(botao).toHaveAttribute("aria-expanded", "false");
    await pagina.setViewportSize(tamanhoOriginal);
    await esperar(botao).toHaveAttribute("aria-expanded", "false");
    await esperar(menu).toBeHidden();

    // A barra de endereço do Safari altera a altura sem representar uma rotação.
    await acionar(botao, possuiToque);
    await pagina.setViewportSize({ ...tamanhoOriginal, height: tamanhoOriginal.height - 80 });
    await esperar(botao).toHaveAttribute("aria-expanded", "true");
});

teste("navega pelo carrossel e carrega as versões corretas de cada fotografia", async ({ page: pagina, hasTouch: possuiToque }) => {
    await pagina.goto("/");
    const imagem = pagina.locator("#imagem-carrossel");
    const proxima = pagina.locator("#proxima-imagem");
    const indicadores = pagina.locator("#indicadores-carrossel button");

    await esperar(indicadores).toHaveCount(5);
    await acionar(proxima, possuiToque);
    await esperar(imagem).toHaveAttribute("src", /pool-cleaning\.jpg$/);
    await acionar(pagina.locator("#imagem-anterior"), possuiToque);
    await acionar(pagina.locator("#imagem-anterior"), possuiToque);
    await esperar(imagem).toHaveAttribute("src", /pool-accessories\.jpg$/);

    await pagina.locator("#carrossel").focus();
    await pagina.keyboard.press("Home");
    await esperar(imagem).toHaveAttribute("src", /pool-lighting\.jpg$/);
    await pagina.keyboard.press("End");
    await esperar(imagem).toHaveAttribute("src", /pool-accessories\.jpg$/);

    for (let indice = 0; indice < 5; indice++) {
        await acionar(indicadores.nth(indice), possuiToque);
        await esperar(indicadores.nth(indice)).toHaveAttribute("aria-current", "true");
        await esperar.poll(() => imagem.evaluate((elemento) => elemento.complete && elemento.naturalWidth > 0)).toBe(true);
        const fontes = await imagem.getAttribute("srcset");
        esperar(fontes).toContain("640w");
        esperar(fontes).toContain("1536w");
    }
});

teste("respeita o tema do sistema e mantém a escolha explícita após recarregar", async ({ page: pagina, hasTouch: possuiToque }) => {
    await pagina.emulateMedia({ colorScheme: "dark" });
    await pagina.goto("/");
    await esperar(pagina.locator("html")).toHaveAttribute("data-tema", "escuro");
    await pagina.emulateMedia({ colorScheme: "light" });
    await esperar(pagina.locator("html")).toHaveAttribute("data-tema", "claro");
    await acionar(pagina.locator("#alternar-tema"), possuiToque);
    await esperar(pagina.locator("html")).toHaveAttribute("data-tema", "escuro");
    await pagina.reload();
    await esperar(pagina.locator("html")).toHaveAttribute("data-tema", "escuro");
    await pagina.emulateMedia({ colorScheme: "light" });
    await esperar(pagina.locator("html")).toHaveAttribute("data-tema", "escuro");
    await esperar(pagina.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#081b2a");
    await esperar(pagina.locator("#alternar-tema")).toHaveAttribute("aria-label", "Ativar tema claro");
});

teste("troca o tema mesmo com armazenamento bloqueado", async ({ page: pagina, hasTouch: possuiToque }) => {
    await pagina.addInitScript(() => {
        Object.defineProperty(window, "localStorage", {
            get() {
                throw new DOMException("Armazenamento bloqueado", "SecurityError");
            }
        });
    });
    await pagina.goto("/");
    await acionar(pagina.locator("#alternar-tema"), possuiToque);
    await esperar(pagina.locator("html")).toHaveAttribute("data-tema", "escuro");
    await acionar(pagina.locator("#alternar-tema"), possuiToque);
    await esperar(pagina.locator("html")).toHaveAttribute("data-tema", "claro");
});

teste("mantém contatos sincronizados e identidade de compartilhamento disponível", async ({ page: pagina, request: requisicao }) => {
    await pagina.goto("/");

    for (const link of await pagina.locator('a[href^="https://wa.me/"]').all()) {
        esperar(new URL(await link.getAttribute("href")).pathname).toBe(`/${configuracao.whatsapp}`);
    }

    for (const link of await pagina.locator('a[href^="mailto:"]').all()) {
        esperar(new URL(await link.getAttribute("href")).pathname).toBe(configuracao.email);
    }

    for (const link of await pagina.locator("[data-servico]").all()) {
        const endereco = new URL(await link.getAttribute("href"));
        esperar(endereco.searchParams.get("text")).toContain(await link.getAttribute("data-servico"));
    }

    await esperar(pagina.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    const imagemSocial = await pagina.locator('meta[property="og:image"]').getAttribute("content");
    const enderecoImagem = new URL(imagemSocial, pagina.url());

    // Confere os dados no HTML original, como o WhatsApp os recebe, sem executar scripts.
    const respostaPagina = await requisicao.get("/");
    const htmlOriginal = await respostaPagina.text();
    const cabecalho = htmlOriginal.split("</head>")[0];
    esperar(cabecalho).toContain('property="og:title"');
    esperar(cabecalho).toContain('property="og:description"');

    if (configuracao.enderecoPublico) {
        esperar(enderecoImagem.protocol).toBe("https:");
        esperar(imagemSocial).toBe(new URL("assets/images/social-preview.jpg", configuracao.enderecoPublico).href);
        esperar(cabecalho).toContain(`property="og:url" content="${configuracao.enderecoPublico}"`);
    }

    // Usa a imagem local nos testes para não depender de uma publicação anterior.
    const respostaImagem = await requisicao.get(enderecoImagem.pathname);
    esperar(respostaImagem.status()).toBe(200);
    esperar(respostaImagem.headers()["content-type"]).toContain("image/jpeg");
    esperar((await respostaImagem.body()).length).toBeLessThan(600000);

    const dimensoes = await pagina.evaluate(async (caminho) => {
        const imagem = new Image();
        imagem.src = caminho;
        await imagem.decode();
        return { largura: imagem.naturalWidth, altura: imagem.naturalHeight };
    }, enderecoImagem.pathname);
    esperar(dimensoes).toEqual({ largura: 1200, altura: 1200 });
    await esperar(pagina.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
    await esperar(pagina.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "1200");
    esperar((await requisicao.get("/config/site.json")).status()).toBe(404);
    esperar((await requisicao.get("/scripts/sync-site.js")).status()).toBe(404);
    esperar((await requisicao.get("/scripts/build-site.js")).status()).toBe(404);
});

teste("reconhece gestos horizontais e preserva a rolagem vertical e o multitoque", async ({ page: pagina, hasTouch: possuiToque }) => {
    teste.skip(!possuiToque, "Gestos são verificados nos perfis móveis.");
    await pagina.goto("/");
    const imagem = pagina.locator("#imagem-carrossel");

    // A simulação exercita os eventos; o navegador não controla um aparelho físico.
    async function simularGesto(distanciaX, distanciaY, quantidadeToques = 1) {
        await imagem.evaluate((elemento, parametros) => {
            const inicio = new Event("touchstart");
            Object.defineProperty(inicio, "touches", {
                value: Array.from({ length: parametros.quantidadeToques }, () => ({
                    clientX: 200,
                    clientY: 200
                }))
            });
            elemento.dispatchEvent(inicio);

            const fim = new Event("touchend");
            Object.defineProperty(fim, "changedTouches", {
                value: [{
                    clientX: 200 + parametros.distanciaX,
                    clientY: 200 + parametros.distanciaY
                }]
            });
            elemento.dispatchEvent(fim);
        }, { distanciaX, distanciaY, quantidadeToques });
    }

    await simularGesto(-100, 5);
    await esperar(imagem).toHaveAttribute("src", /pool-cleaning\.jpg$/);
    await simularGesto(5, 100);
    await esperar(imagem).toHaveAttribute("src", /pool-cleaning\.jpg$/);
    await simularGesto(-100, 0, 2);
    await esperar(imagem).toHaveAttribute("src", /pool-cleaning\.jpg$/);
    await simularGesto(100, 5);
    await esperar(imagem).toHaveAttribute("src", /pool-lighting\.jpg$/);
});

teste.describe("sem JavaScript", () => {
    teste.use({ javaScriptEnabled: false });

    teste("preserva informações, menu e destinos dos contatos", async ({ page: pagina }) => {
        await pagina.goto("/");
        await esperar(pagina.locator(".cartao-servico")).toHaveCount(4);
        await esperar(pagina.locator("#menu-principal")).toBeVisible();
        await esperar(pagina.locator(".carrossel-controles")).toBeHidden();

        for (const link of await pagina.locator('a[href^="https://wa.me/"]').all()) {
            esperar(new URL(await link.getAttribute("href")).pathname).toBe(`/${configuracao.whatsapp}`);
        }

        await esperar(pagina.locator("[data-contato-email]").first()).toHaveText(configuracao.email);
    });
});
