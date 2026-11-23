# ☀️ Piscina Girassol

**Sua piscina impecável. Seu único trabalho é aproveitar.**

Site institucional da Piscina Girassol, com apresentação da empresa, categorias de serviços e contato direto com o Dalmir. Desenvolvido em **HTML, CSS e JavaScript**, sem frameworks ou dependências em produção. O Playwright é usado somente no desenvolvimento, para testes.

## 🖥️ Prévia do site

![Página inicial da Piscina Girassol](./docs/preview.jpg)

## 🏊 Serviços apresentados

- **Venda, instalação e manutenção de piscinas** — soluções para a estrutura e o cuidado da piscina.
- **Acessórios e produtos químicos** — complementos e produtos para a rotina de cuidados.
- **Limpeza de piscinas** — atenção à água e aos momentos de lazer.
- **Manutenção e restauração de bombas** — cuidado com os equipamentos de circulação.

## ✨ Recursos

- 📱 Layout responsivo para computador, tablet e celular, incluindo telas de 320 pixels.
- 🌓 Temas claro e escuro: preferência do sistema na primeira visita e escolha salva no navegador.
- 🖼️ Carrossel manual com botões, indicadores, teclado e gesto horizontal no celular.
- 💬 WhatsApp com mensagem relacionada ao serviço escolhido e botão flutuante.
- ✉️ E-mail clicável, usando o aplicativo de e-mail configurado pelo visitante.
- ♿ Menu acessível, foco visível, atalho para o conteúdo e respeito à redução de movimento.
- ⚡ Fotos em versões de 640, 960, 1280 e 1536 pixels: o navegador escolhe conforme a tela e a densidade de pixels, preservando o layout.
- 🍎 Proteção lateral para recortes do aparelho e testes WebKit em perfis de iPhone e iPad, na vertical e na horizontal.

## 🚀 Executar localmente

É necessário ter **Node.js 20 ou superior** para usar o servidor incluído. Não é necessário executar `npm install`.

```bash
git clone https://github.com/Lcsf-dev/piscina-girassol.git
cd piscina-girassol
npm run dev
```

Abra **http://127.0.0.1:5500**. Para encerrar, use `Ctrl + C` no terminal.

O comando `npm start` também inicia o servidor. A página pode ser aberta diretamente pelo `index.html`, mas o servidor local oferece melhor compatibilidade com o manifesto e os ícones.

## 📁 Organização

```text
piscina-girassol/
├── assets/
│   ├── icons/                 # Favicons e ícones por plataforma
│   └── images/
│       └── responsive/        # Versões menores das fotografias
├── config/
│   └── site.json              # Fonte dos contatos e do futuro endereço público
├── docs/
│   ├── preview.jpg            # Prévia real da página inicial
│   └── source-images.zip      # Originais e referência de contato preservados
├── scripts/
│   ├── main.js               # Menu, carrossel e mensagens por serviço
│   ├── server.js             # Servidor local sem dependências
│   ├── sync-site.js          # Atualiza contatos e metadados no HTML e README
│   └── theme.js              # Toda a lógica do tema, sem duplicação
├── styles/
│   └── main.css              # Identidade visual e responsividade
├── tests/
│   └── site.spec.js           # Testes dos comportamentos do visitante
├── browserconfig.xml         # Atalhos compatíveis com Windows
├── favicon.ico               # Ícone com resoluções 16, 32 e 48
├── index.html                # Conteúdo institucional
├── package.json              # Comandos do projeto
├── package-lock.json         # Versões reproduzíveis das ferramentas de teste
├── playwright.config.js      # Perfis de aparelhos e navegadores
├── site.webmanifest          # Nome, cores e ícones para atalhos
└── README.md
```

Os nomes de arquivos e pastas seguem o padrão em inglês. Classes, variáveis, funções, textos e comentários estão em português sempre que aplicável. A indentação usa quatro espaços, definida também no `.editorconfig`.

## 🎨 Personalizar

| Alteração | Onde editar |
| --- | --- |
| Textos, categorias e informações da empresa | `index.html` |
| Número do WhatsApp e endereço de e-mail | `config/site.json`; depois execute `npm run sync` |
| Mensagem específica de cada serviço | Atributos `data-servico` e tratamento em `scripts/main.js` |
| Fotos e legendas do carrossel | Lista `imagens` em `scripts/main.js` |
| Cores, espaçamentos e pontos de adaptação | `styles/main.css` |
| Nome e cores dos atalhos | `site.webmanifest` |
| Endereço público para compartilhamento e URL canônica | `enderecoPublico` em `config/site.json`; depois execute `npm run sync` |

Os links finais ficam gravados no HTML e funcionam sem JavaScript. O comando `npm run check` identifica se a configuração mudou sem a sincronização correspondente. Os marcadores `metadados:inicio/fim` e `contatos:inicio/fim` delimitam os trechos atualizados pelo sincronizador.

O endereço público permanece vazio até a definição da hospedagem. Ao preenchê-lo com a URL HTTPS definitiva, `npm run sync` também gera a URL canônica e os endereços absolutos da imagem de compartilhamento.

## 🗂️ Arquivos e imagens

As seis imagens originais e a referência de contato estão reunidas em [source-images.zip](docs/source-images.zip), fora dos recursos usados pela página. O conteúdo foi conferido com SHA-256 antes da organização. Extraia o ZIP para recuperar os arquivos sem perda.

As versões em `responsive/` são necessárias para servir imagens menores em celulares e tablets; os arquivos maiores continuam disponíveis para telas de alta densidade. A foto, o enquadramento e o design da página foram preservados.

## 📲 Favicons e atalhos

O projeto inclui **SVG**, **ICO com resoluções de 16, 32 e 48 pixels**, PNGs de **16 e 32 pixels**, ícone **Apple Touch de 180 pixels**, ícones **Android de 192 e 512 pixels**, versão **maskable**, máscara monocromática para abas fixadas do Safari e ícone de **150 pixels para Windows**. Os PNGs avulsos de 48 e 96 pixels, sem referências no site, foram removidos.

O manifesto prepara a identidade dos atalhos. O site não implementa funcionamento offline nem um service worker.

## ✅ Validação

```bash
npm run check
```

Esse comando verifica a sintaxe dos scripts e a sincronização dos contatos e metadados. Para executar os testes de navegador:

```bash
npm ci
npx playwright install chromium webkit
npm test
```

Use `npm run test:mobile` para testar somente os perfis móveis. As dependências e os navegadores são necessários apenas para os testes, sem impacto nos arquivos entregues ao visitante.

A bateria cobre computador, iPhone SE, iPhone 17, iPad Mini e Android, incluindo perfis Apple na horizontal. Os perfis Apple usam WebKit; são testes emulados, sem validação em aparelhos físicos. São verificados:

- Layout nas larguras **320, 390, 768, 1024 e 1440 pixels**, sem rolagem horizontal.
- Menu móvel, fechamento por `Esc`, navegação do carrossel e seleção por indicadores.
- Alternância de tema e persistência depois de recarregar a página.
- Tema com armazenamento bloqueado e respeito à preferência do sistema.
- Carregamento das fotografias responsivas e endereços de WhatsApp e e-mail.
- Contatos e conteúdo sem JavaScript, gestos horizontais e preservação do multitoque.

## 🌐 Publicação

O site é estático: a hospedagem deve servir o `index.html` na raiz, junto dos arquivos CSS, JavaScript, imagens, ícones e manifesto. **Não há build, banco de dados ou backend obrigatório.** O `scripts/server.js` é apenas uma conveniência para desenvolvimento local.

Publicar o código no GitHub e colocar o site no ar são etapas diferentes. O repositório armazena o projeto; o endereço público do site depende da hospedagem escolhida.

## 📞 Contato da empresa

- **Responsável:** Dalmir
<!-- contatos:inicio -->
- **WhatsApp:** [(21) 98832-8878](https://wa.me/5521988328878)
- **E-mail:** [dalmirbenicio@gmail.com](mailto:dalmirbenicio@gmail.com)
<!-- contatos:fim -->
