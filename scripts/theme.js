// Centraliza o tema: a primeira aplicação acontece antes da folha de estilos.
(() => {
    const chavePreferencia = "piscina-girassol-tema";
    const preferenciaSistema = window.matchMedia("(prefers-color-scheme: dark)");
    let temaSalvo = null;
    let escolhaManual = false;

    // Navegadores com armazenamento bloqueado continuam usando o tema do sistema.
    try {
        temaSalvo = localStorage.getItem(chavePreferencia);
    } catch {
        temaSalvo = null;
    }

    escolhaManual = ["claro", "escuro"].includes(temaSalvo);

    // A mesma função atende à abertura, ao botão e às alterações do sistema.
    function aplicarTema(tema, salvarPreferencia = false) {
        document.documentElement.dataset.tema = tema;
        document.querySelector('meta[name="theme-color"]').content = tema === "escuro"
            ? "#081b2a"
            : "#f5fbfc";

        const botaoTema = document.querySelector("#alternar-tema");

        if (botaoTema) {
            const descricao = `Ativar tema ${tema === "escuro" ? "claro" : "escuro"}`;
            botaoTema.setAttribute("aria-label", descricao);
            botaoTema.title = descricao;
        }

        if (salvarPreferencia) {
            escolhaManual = true;

            try {
                localStorage.setItem(chavePreferencia, tema);
            } catch {
                // O botão continua funcionando em navegação com armazenamento bloqueado.
            }
        }
    }

    aplicarTema(escolhaManual ? temaSalvo : preferenciaSistema.matches ? "escuro" : "claro");

    // O HTML ainda está sendo lido quando este arquivo é executado no cabeçalho.
    document.addEventListener("DOMContentLoaded", () => {
        aplicarTema(document.documentElement.dataset.tema);
        document.querySelector("#alternar-tema").addEventListener("click", () => {
            const tema = document.documentElement.dataset.tema === "escuro" ? "claro" : "escuro";
            aplicarTema(tema, true);
        });
    }, { once: true });

    // A escolha explícita do visitante tem prioridade sobre o tema do aparelho.
    preferenciaSistema.addEventListener("change", (evento) => {
        if (!escolhaManual) aplicarTema(evento.matches ? "escuro" : "claro");
    });
})();
