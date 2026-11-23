// Mantém as variáveis da página isoladas do escopo global do navegador.
(() => {
    "use strict";

    // Habilita os aprimoramentos visuais somente quando o JavaScript está disponível.
    document.documentElement.classList.add("js-ativo");

    // Abre e fecha a navegação dos celulares mantendo os estados acessíveis em sincronia.
    const botaoMenu = document.querySelector("#alternar-menu");
    const menu = document.querySelector("#menu-principal");
    let larguraJanela = window.innerWidth;

    function definirMenu(aberto) {
        menu.classList.toggle("aberto", aberto);
        botaoMenu.setAttribute("aria-expanded", String(aberto));
        botaoMenu.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    }

    botaoMenu.addEventListener("click", () => {
        definirMenu(botaoMenu.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", (evento) => {
        if (evento.target.closest("a")) definirMenu(false);
    });

    document.addEventListener("click", (evento) => {
        if (!evento.target.closest(".cabecalho")) definirMenu(false);
    });

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape" && botaoMenu.getAttribute("aria-expanded") === "true") {
            definirMenu(false);
            botaoMenu.focus();
        }
    });

    // Fecha ao mudar a largura; a barra de endereço do Safari pode mudar apenas a altura.
    window.addEventListener("resize", () => {
        if (window.innerWidth !== larguraJanela) {
            larguraJanela = window.innerWidth;
            definirMenu(false);
        }
    }, { passive: true });

    // Cada serviço inicia uma conversa contextualizada, sem enviar mensagens sozinho.
    document.querySelectorAll("[data-servico]").forEach((link) => {
        const endereco = new URL(link.href);
        endereco.searchParams.set("text", `Olá, Dalmir! Vim pelo site e tenho interesse em ${link.dataset.servico}.`);
        link.href = endereco.href;
    });

    // Conteúdo e imagens locais apresentados no carrossel.
    const imagens = [
        {
            arquivo: "pool-lighting.jpg",
            descricao: "Piscina iluminada com jardim ao anoitecer",
            titulo: "Um convite para aproveitar",
            texto: "O cuidado com a piscina valoriza os momentos que você vive ao redor dela."
        },
        {
            arquivo: "pool-cleaning.jpg",
            descricao: "Comparação de uma piscina antes e depois da limpeza",
            titulo: "O cuidado que se vê na água",
            texto: "A limpeza faz parte da rotina de uma piscina bem cuidada e pronta para o lazer."
        },
        {
            arquivo: "pump-maintenance.jpg",
            descricao: "Manutenção de bomba e filtro de uma piscina",
            titulo: "Atenção ao que faz tudo funcionar",
            texto: "Bombas e equipamentos também precisam de cuidado. Consulte a manutenção e a restauração."
        },
        {
            arquivo: "pool-installation.jpg",
            descricao: "Piscina com hidromassagem integrada em uma área de lazer",
            titulo: "Seu espaço, novas possibilidades",
            texto: "Converse sobre venda, instalação e manutenção para planejar o cuidado da sua piscina."
        },
        {
            arquivo: "pool-accessories.jpg",
            descricao: "Cascata de inox complementando uma piscina residencial",
            titulo: "Detalhes que fazem a diferença",
            texto: "Conheça acessórios e produtos que complementam a sua área de lazer e a rotina de cuidados."
        }
    ];

    const carrossel = document.querySelector("#carrossel");
    const imagemCarrossel = document.querySelector("#imagem-carrossel");
    const tituloImagem = document.querySelector("#titulo-imagem");
    const descricaoImagem = document.querySelector("#descricao-imagem");
    const contagemCarrossel = document.querySelector("#contagem-carrossel");
    const indicadores = document.querySelector("#indicadores-carrossel");
    let indiceAtual = 0;

    // Os indicadores são botões reais para permitir uso com mouse, toque e teclado.
    imagens.forEach((imagem, indice) => {
        const indicador = document.createElement("button");
        indicador.type = "button";
        indicador.setAttribute("aria-label", `Ver imagem ${indice + 1}: ${imagem.titulo}`);
        indicador.addEventListener("click", () => mostrarImagem(indice));
        indicadores.append(indicador);
    });

    function mostrarImagem(indice) {
        // O módulo permite avançar da última para a primeira e voltar da primeira para a última.
        indiceAtual = (indice + imagens.length) % imagens.length;
        const imagem = imagens[indiceAtual];

        // A seleção considera a largura da tela e a densidade de pixels dos aparelhos.
        const nomeArquivo = imagem.arquivo.replace(/\.jpg$/, "");
        imagemCarrossel.srcset = [640, 960, 1280]
            .map((largura) => `assets/images/responsive/${nomeArquivo}-${largura}.jpg ${largura}w`)
            .concat(`assets/images/${imagem.arquivo} 1536w`)
            .join(", ");
        imagemCarrossel.src = `assets/images/${imagem.arquivo}`;
        imagemCarrossel.alt = imagem.descricao;
        tituloImagem.textContent = imagem.titulo;
        descricaoImagem.textContent = imagem.texto;
        contagemCarrossel.textContent = `Imagem ${indiceAtual + 1} de ${imagens.length}: ${imagem.titulo}`;

        Array.from(indicadores.children).forEach((indicador, posicao) => {
            indicador.setAttribute("aria-current", String(posicao === indiceAtual));
        });
    }

    // Não há reprodução automática: o visitante controla o tempo de leitura.
    document.querySelector("#imagem-anterior").addEventListener("click", () => mostrarImagem(indiceAtual - 1));
    document.querySelector("#proxima-imagem").addEventListener("click", () => mostrarImagem(indiceAtual + 1));

    carrossel.addEventListener("keydown", (evento) => {
        if (evento.altKey || evento.ctrlKey || evento.metaKey) return;
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(evento.key)) return;
        evento.preventDefault();

        if (evento.key === "Home") mostrarImagem(0);
        else if (evento.key === "End") mostrarImagem(imagens.length - 1);
        else mostrarImagem(indiceAtual + (evento.key === "ArrowRight" ? 1 : -1));
    });

    // O gesto horizontal não interfere na rolagem vertical da página em celulares.
    let inicioToque = null;

    imagemCarrossel.addEventListener("touchstart", (evento) => {
        inicioToque = evento.touches.length === 1
            ? { x: evento.touches[0].clientX, y: evento.touches[0].clientY }
            : null;
    }, { passive: true });

    imagemCarrossel.addEventListener("touchend", (evento) => {
        if (!inicioToque || !evento.changedTouches.length) return;
        const distanciaX = evento.changedTouches[0].clientX - inicioToque.x;
        const distanciaY = evento.changedTouches[0].clientY - inicioToque.y;
        inicioToque = null;

        if (Math.abs(distanciaX) > 50 && Math.abs(distanciaX) > Math.abs(distanciaY) * 1.4) {
            mostrarImagem(indiceAtual + (distanciaX < 0 ? 1 : -1));
        }
    }, { passive: true });

    imagemCarrossel.addEventListener("touchcancel", () => {
        inicioToque = null;
    }, { passive: true });

    mostrarImagem(0);
    document.querySelector(".carrossel-controles").hidden = false;

    // O ano acompanha o calendário sem exigir alterações manuais no HTML.
    document.querySelector("#ano-atual").textContent = new Date().getFullYear();
})();
