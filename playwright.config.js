// Os perfis Apple usam WebKit; Android e computador usam Chromium.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
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
    projects: [
        { name: "desktop", use: { ...devices["Desktop Chrome"], browserName: "chromium" } },
        { name: "iphone-se", use: { ...devices["iPhone SE"], browserName: "webkit" } },
        { name: "iphone", use: { ...devices["iPhone 17"], browserName: "webkit" } },
        { name: "iphone-landscape", use: { ...devices["iPhone 17 landscape"], browserName: "webkit" } },
        { name: "ipad", use: { ...devices["iPad Mini"], browserName: "webkit" } },
        { name: "ipad-landscape", use: { ...devices["iPad Mini landscape"], browserName: "webkit" } },
        { name: "android", use: { ...devices["Pixel 7"], browserName: "chromium" } }
    ]
});
