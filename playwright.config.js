// Os perfis Apple usam WebKit; Android e computador usam Chromium.
import { defineConfig as definirConfiguracao, devices as aparelhos } from "@playwright/test";

export default definirConfiguracao({
    testDir: "./tests",
    fullyParallel: true,
    workers: 2,
    timeout: 25000,
    expect: { timeout: 6000 },
    reporter: "list",
    use: {
        baseURL: "http://127.0.0.1:5511",
        colorScheme: "light",
        trace: "retain-on-failure",
        screenshot: "only-on-failure"
    },
    // A porta exclusiva evita interferir no servidor usado para editar o site.
    webServer: {
        command: "node scripts/server.js",
        url: "http://127.0.0.1:5511",
        env: { PORT: "5511" },
        reuseExistingServer: false,
        timeout: 15000
    },
    // Os nomes dos aparelhos e as opções seguem a API do Playwright.
    projects: [
        {
            name: "computador",
            use: { ...aparelhos["Desktop Chrome"], browserName: "chromium" }
        },
        {
            name: "iphone-se",
            use: { ...aparelhos["iPhone SE"], browserName: "webkit" }
        },
        {
            name: "iphone",
            use: { ...aparelhos["iPhone 17"], browserName: "webkit" }
        },
        {
            name: "iphone-horizontal",
            use: { ...aparelhos["iPhone 17 landscape"], browserName: "webkit" }
        },
        {
            name: "ipad",
            use: { ...aparelhos["iPad Mini"], browserName: "webkit" }
        },
        {
            name: "ipad-horizontal",
            use: { ...aparelhos["iPad Mini landscape"], browserName: "webkit" }
        },
        {
            name: "android",
            use: { ...aparelhos["Pixel 7"], browserName: "chromium" }
        }
    ]
});
