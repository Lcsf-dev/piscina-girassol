// Exercita os comportamentos do visitante em cada perfil, sem abrir serviços externos.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const configuracao = JSON.parse(readFileSync(new URL("../config/site.json", import.meta.url), "utf8"));

// Usa toque nos perfis móveis e clique no computador.
async function acionar(elemento, possuiToque) {
    if (possuiToque) await elemento.tap();
    else await elemento.click();
}

test("preserva o conteúdo, carrega as imagens e não cria rolagem horizontal", async ({ page }) => {
    const erros = [];
    page.on("pageerror", (erro) => erros.push(erro.message));
    page.on("response", (resposta) => {
        if (resposta.status() >= 400) erros.push(`${resposta.status()} ${resposta.url()}`);
    });

    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator(".cartao-servico")).toHaveCount(4);

    // Percorrer as imagens também verifica as que usam carregamento adiado.
    for (const imagem of await page.locator("img").all()) {
        await imagem.scrollIntoViewIfNeeded();
        await expect.poll(() => imagem.evaluate((elemento) => elemento.complete && elemento.naturalWidth > 0)).toBe(true);
    }

    const dimensoes = await page.evaluate(() => ({
        janela: innerWidth,
        documento: document.documentElement.scrollWidth,
        colunas: getComputedStyle(document.querySelector(".servicos-grade")).gridTemplateColumns.split(" ").length
    }));
    expect(dimensoes.documento).toBeLessThanOrEqual(dimensoes.janela);
    expect(dimensoes.colunas).toBe(dimensoes.janela <= 520 ? 1 : 2);
    expect(erros).toEqual([]);
});

test("mantém o menu utilizável por toque, teclado e mudança de orientação", async ({ page, hasTouch }) => {
    await page.goto("/");
    const botao = page.locator("#alternar-menu");
    const menu = page.locator("#menu-principal");

    if (page.viewportSize().width > 760) {
        await expect(botao).toBeHidden();
        await expect(menu).toBeVisible();
        return;
    }

    await acionar(botao, hasTouch);
    await expect(botao).toHaveAttribute("aria-expanded", "true");
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(botao).toHaveAttribute("aria-expanded", "false");
    await expect(botao).toBeFocused();

    await acionar(botao, hasTouch);
    await acionar(menu.getByRole("link", { name: "Serviços", exact: true }), hasTouch);
    await expect(menu).toBeHidden();

    await acionar(botao, hasTouch);
    const tamanhoOriginal = page.viewportSize();
    await page.setViewportSize({ width: 900, height: 500 });
    await expect(menu).toBeVisible();
    await expect(botao).toHaveAttribute("aria-expanded", "false");
    await page.setViewportSize(tamanhoOriginal);
    await expect(botao).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeHidden();

    // A barra de endereço do Safari altera a altura sem representar uma rotação.
    await acionar(botao, hasTouch);
    await page.setViewportSize({ ...tamanhoOriginal, height: tamanhoOriginal.height - 80 });
    await expect(botao).toHaveAttribute("aria-expanded", "true");
});

test("navega pelo carrossel e carrega as versões corretas de cada fotografia", async ({ page, hasTouch }) => {
    await page.goto("/");
    const imagem = page.locator("#imagem-carrossel");
    const proxima = page.locator("#proxima-imagem");
    const indicadores = page.locator("#indicadores-carrossel button");

    await expect(indicadores).toHaveCount(5);
    await acionar(proxima, hasTouch);
    await expect(imagem).toHaveAttribute("src", /pool-cleaning\.jpg$/);
    await acionar(page.locator("#imagem-anterior"), hasTouch);
    await acionar(page.locator("#imagem-anterior"), hasTouch);
    await expect(imagem).toHaveAttribute("src", /pool-accessories\.jpg$/);

    await page.locator("#carrossel").focus();
    await page.keyboard.press("Home");
    await expect(imagem).toHaveAttribute("src", /pool-lighting\.jpg$/);
    await page.keyboard.press("End");
    await expect(imagem).toHaveAttribute("src", /pool-accessories\.jpg$/);

    for (let indice = 0; indice < 5; indice++) {
        await acionar(indicadores.nth(indice), hasTouch);
        await expect(indicadores.nth(indice)).toHaveAttribute("aria-current", "true");
        await expect.poll(() => imagem.evaluate((elemento) => elemento.complete && elemento.naturalWidth > 0)).toBe(true);
        const fontes = await imagem.getAttribute("srcset");
        expect(fontes).toContain("640w");
        expect(fontes).toContain("1536w");
    }
});

test("respeita o tema do sistema e mantém a escolha explícita após recarregar", async ({ page, hasTouch }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-tema", "escuro");
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).toHaveAttribute("data-tema", "claro");
    await acionar(page.locator("#alternar-tema"), hasTouch);
    await expect(page.locator("html")).toHaveAttribute("data-tema", "escuro");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-tema", "escuro");
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).toHaveAttribute("data-tema", "escuro");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#081b2a");
    await expect(page.locator("#alternar-tema")).toHaveAttribute("aria-label", "Ativar tema claro");
});

test("troca o tema mesmo com armazenamento bloqueado", async ({ page, hasTouch }) => {
    await page.addInitScript(() => {
        Object.defineProperty(window, "localStorage", {
            get() { throw new DOMException("Armazenamento bloqueado", "SecurityError"); }
        });
    });
    await page.goto("/");
    await acionar(page.locator("#alternar-tema"), hasTouch);
    await expect(page.locator("html")).toHaveAttribute("data-tema", "escuro");
    await acionar(page.locator("#alternar-tema"), hasTouch);
    await expect(page.locator("html")).toHaveAttribute("data-tema", "claro");
});

test("mantém contatos sincronizados e identidade de compartilhamento disponível", async ({ page, request }) => {
    await page.goto("/");

    for (const link of await page.locator('a[href^="https://wa.me/"]').all()) {
        expect(new URL(await link.getAttribute("href")).pathname).toBe(`/${configuracao.whatsapp}`);
    }

    for (const link of await page.locator('a[href^="mailto:"]').all()) {
        expect(new URL(await link.getAttribute("href")).pathname).toBe(configuracao.email);
    }

    for (const link of await page.locator("[data-servico]").all()) {
        const endereco = new URL(await link.getAttribute("href"));
        expect(endereco.searchParams.get("text")).toContain(await link.getAttribute("data-servico"));
    }

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    const imagemSocial = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect((await request.get(imagemSocial)).status()).toBe(200);
    expect((await request.get("/config/site.json")).status()).toBe(404);
    expect((await request.get("/scripts/sync-site.js")).status()).toBe(404);
});

test("reconhece gestos horizontais e preserva a rolagem vertical e o multitoque", async ({ page, hasTouch }) => {
    test.skip(!hasTouch, "Gestos são verificados nos perfis móveis.");
    await page.goto("/");
    const imagem = page.locator("#imagem-carrossel");

    // A simulação exercita os eventos; o navegador não controla um aparelho físico.
    async function simularGesto(distanciaX, distanciaY, quantidadeToques = 1) {
        await imagem.evaluate((elemento, parametros) => {
            const inicio = new Event("touchstart");
            Object.defineProperty(inicio, "touches", { value: Array.from({ length: parametros.quantidadeToques }, () => ({ clientX: 200, clientY: 200 })) });
            elemento.dispatchEvent(inicio);
            const fim = new Event("touchend");
            Object.defineProperty(fim, "changedTouches", { value: [{ clientX: 200 + parametros.distanciaX, clientY: 200 + parametros.distanciaY }] });
            elemento.dispatchEvent(fim);
        }, { distanciaX, distanciaY, quantidadeToques });
    }

    await simularGesto(-100, 5);
    await expect(imagem).toHaveAttribute("src", /pool-cleaning\.jpg$/);
    await simularGesto(5, 100);
    await expect(imagem).toHaveAttribute("src", /pool-cleaning\.jpg$/);
    await simularGesto(-100, 0, 2);
    await expect(imagem).toHaveAttribute("src", /pool-cleaning\.jpg$/);
    await simularGesto(100, 5);
    await expect(imagem).toHaveAttribute("src", /pool-lighting\.jpg$/);
});

test.describe("sem JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("preserva informações, menu e destinos dos contatos", async ({ page }) => {
        await page.goto("/");
        await expect(page.locator(".cartao-servico")).toHaveCount(4);
        await expect(page.locator("#menu-principal")).toBeVisible();
        await expect(page.locator(".carrossel-controles")).toBeHidden();

        for (const link of await page.locator('a[href^="https://wa.me/"]').all()) {
            expect(new URL(await link.getAttribute("href")).pathname).toBe(`/${configuracao.whatsapp}`);
        }

        await expect(page.locator("[data-contato-email]").first()).toHaveText(configuracao.email);
    });
});
