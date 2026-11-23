// Executa antes da folha de estilos para abrir a página já com o tema correto.
(() => {
    const chavePreferencia = "piscina-girassol-tema";
    const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    let temaSalvo = null;

    // Navegadores com armazenamento bloqueado continuam usando o tema do sistema.
    try {
        temaSalvo = localStorage.getItem(chavePreferencia);
    } catch {
        temaSalvo = null;
    }

    // Apenas valores conhecidos são aceitos para manter as cores consistentes.
    const tema = ["claro", "escuro"].includes(temaSalvo)
        ? temaSalvo
        : prefereEscuro ? "escuro" : "claro";

    document.documentElement.dataset.tema = tema;
    document.querySelector('meta[name="theme-color"]').content = tema === "escuro"
        ? "#081b2a"
        : "#f5fbfc";
})();
