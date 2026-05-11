/*
==========================================================
    CONFIGURAÇÃO DE CARDS E BOTÕES (Menu e Documentos)
==========================================================
*/
const menuDados = {
    externos: {
        titulo: "Sistemas Externos",
        descricao: "Sistemas hospedados fora ou na ATI, como e-mail, SEI, NPS, MDComune, etc",
        icon: "fas fa-network-wired",
        botoes: [
            { label: "Acesso e-mail", img: "imagens/sogo-logo.png", action: () => window.open('https://sogo.pe.gov.br/SOGo/', '_blank') },
            { label: "Acesso SEI", img: "imagens/sei-ico2.PNG", action: () => window.open('https://sei.pe.gov.br/', '_blank') },
            { label: "Acesso NPS", img: "imagens/nps-logo.png", action: () => window.open('https://www.nps.pe.gov.br/', '_blank') },
            { label: "Avaliação de Desempenho", img: "imagens/desempenho.JPG", action: () => window.open('https://www.gestaododesempenho.pe.gov.br/', '_blank') },
            { label: "Acesso MDComune", img: "imagens/md-comune-logo.webp", action: () => window.open('https://www.mdcomune.com.br/', '_blank') }
        ]
    },
    internos: {
        titulo: "Sistemas Internos",
        descricao: "Sistemas hospedados na CPRH, como SILIA, SISAM, Solicitação de Veículos, etc",
        icon: "fas fa-laptop-house",
        botoes: [
            { 
                label: "Acesso SILIA", 
                img: "imagens/Silia-logo.PNG", 
                action: () => window.open('https://silia.cprh.pe.gov.br:83', '_blank') 
            },
            { 
                label: "Acesso SISAM", 
                img: "imagens/sisam-logo.png", 
                action: () => window.open('https://sistemas.cprh.pe.gov.br:8383/siliaweb/selis/', '_blank') 
            },
            { 
                label: "Agenda Telefônica", 
                icon: "fas fa-address-book", 
                action: () => window.location.href='agenda.html' 
            },
            { 
                label: "Abertura Chamado T.I.", 
                img: "imagens/whatsapp-logo.jpg", 
                action: () => {
                    if (typeof montarModalTI === 'function') {
                        montarModalTI();
                    }
                }
            },
            { 
                label: "Painel CPRH", 
                icon: "fas fa-chart-pie", 
                action: () => window.open('https://sistemas.cprh.pe.gov.br:8383/dashboard_cprh/?year=2026', '_blank')
            },
            { 
                label: "Solicitação de Veículos", 
                icon: "fa-solid fa-car", 
                action: () => window.open('https://silia.cprh.pe.gov.br:83//silian/silia/silia.php?id_redir=2', '_blank')
            },
            { 
                label: "Solicitação de Diárias", 
                icon: "fa-solid fa-file-invoice-dollar", 
                action: () => window.open('https://silia.cprh.pe.gov.br:83//silian/silia/silia.php?id_redir=1', '_blank')
            },
            { 
                label: "Solicitação de Almoxarifado", 
                icon: "fa-solid fa-dolly", 
                action: () => solicitarAcesso('Almoxarifado') 
            },
            { 
                label: "Controle de Patrimônio", 
                icon: "fas fa-barcode", 
                action: () => solicitarAcesso('Patrimonio') 
            },
            { 
                label: "Abertura Chamado Manutenção", 
                icon: "fa-solid fa-screwdriver-wrench", 
                action: () => solicitarAcesso('Manutencao')
            },
            { 
                label: "Solicitação Serviços Gerais", 
                icon: "fas fa-broom", 
                // CORREÇÃO: Apontando para o destino correto
                action: () => solicitarAcesso('ServicosGerais')
            }    
        ]
    },
    legislacao: {
        titulo: "Legislação e Procedimentos",
        descricao: "Documentos Oficiais da CPRH como Instruções Normativas, de Serviço e Orientações Gerais",
        icon: "fas fa-gavel",
        botoes: [
            { label: "Instruções Normativas", icon: "fas fa-scale-balanced", action: () => window.open('https://www2.cprh.pe.gov.br/publicacoes-e-transparencia/legislacoes-e-instrucoes-normativas/instrucoes-normativas/', '_blank') },
            { label: "Instruções de Serviços", icon: "fas fa-tools", action: () => mostrarLista('servicos') },
            { label: "Orientações Gerais", icon: "fas fa-list-check", action: () => mostrarLista('procedimentos') }
        ]
    }
};

const documentos = {
    servicos: [
        { nome: "I.S. 06/2024 - Estabelece os procedimentos e os critérios para pagamento em ordem cronológica", url: "instrucoes_servicos/is_06-2024.pdf" },
        { nome: "I.S. 05/2024 - Estabelece as orientações e procedimentos referentes ao Controle de Frequência", url: "instrucoes_servicos/is_05-2024.pdf" },
        { nome: "I.S. 04/2024 - Estabelece procedimentos para Gestão e Fiscalização de Contratos e Convênios", url: "instrucoes_servicos/is_04-2024.pdf" },
        { nome: "I.S. 03/2024 - Disciplina as regras, procedimentos e rotinas do Controle de Frequência", url: "instrucoes_servicos/is_03-2024.pdf" },
        { nome: "I.S. 02/2024 - Disciplina as regras e rotinas à Área de Tecnologia da Informação", url: "instrucoes_servicos/is_02-2024.pdf" },
        { nome: "I.S. 01/2024 - Estabelece orientações de manutenção dos Termos de Compromissos no SILIA", url: "instrucoes_servicos/is_01-2024.pdf" },
        { nome: "I.S. 01/2019 - Estabelece a contagem de prazos em dias úteis", url: "instrucoes_servicos/is_01-2019.pdf" }
    ],
    procedimentos: []
};

let swiperInstancia = null;

/*
========================================================
    LIMPEZA Forçada do Tootip (balões explicativos)
========================================================
*/
function limparTooltips() {
    // Procura todos os tooltips abertos e os remove da memória e da tela
    const tooltips = document.querySelectorAll('.tooltip');
    tooltips.forEach(t => t.remove());
}

// E para garantir que novos elementos tenham tooltip, use esta:
function ativarTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            // Garante que o tooltip apareça apenas no hover e suma no clique/saída
            trigger: 'hover', 
            // Opcional: Adiciona um pequeno delay, em milissegundos, para não poluir a tela ao mover o mouse rápido
            delay: { "show": 300, "hide": 100 } 
        });
    });
}

/*
=============================================
    NÍVEL 1: Cards Iniciais + Mais Acessados
=============================================
*/
function renderizarCardsNivel1() {
    limparTooltips(); // <--- LIMPA SE O USUÁRIO VOLTOU DO NÍVEL 2
    const container = document.getElementById('container-principal-menu');
    if (!container) return;

    if (typeof fecharListaSuave === 'function') fecharListaSuave();
    if (swiperInstancia) {
        swiperInstancia.destroy(true, true);
        swiperInstancia = null;
    }

    container.innerHTML = `<div class="categoria-cards-container"></div>`;
    const gridCategorias = container.querySelector('.categoria-cards-container');

    Object.keys(menuDados).forEach(chave => {
        const cat = menuDados[chave];
        const card = document.createElement('div');
        card.className = 'card-categoria animate__animated animate__fadeIn';
        // configurando o balão de explicação
        card.setAttribute('data-bs-toggle', 'tooltip');
        card.setAttribute('data-bs-placement', 'top'); // O balão aparece em cima
        card.setAttribute('title', cat.descricao || ''); // O texto que vai no balão

        card.innerHTML = `<i class="${cat.icon}"></i><h5>${cat.titulo}</h5>`;
        card.onclick = () => carregarSegundoNivel(chave);
        gridCategorias.appendChild(card);
    });

    const secaoMaisAcessados = document.createElement('div');
    secaoMaisAcessados.className = 'animate__animated animate__fadeInUp';
    secaoMaisAcessados.style.animationDelay = '0.3s';
    
    secaoMaisAcessados.innerHTML = `
        <div class="mt-5 mb-4 position-relative">
            <hr style="border: 0; height: 1px; background: linear-gradient(to right, transparent, #198754, transparent); opacity: 0.3;">
            <div class="position-absolute top-50 start-50 translate-middle bg-white px-4">
                <h6 class="text-success fw-bold text-uppercase m-0" style="letter-spacing: 3px; font-size: 0.75rem;">
                    <i class="fas fa-bolt me-1"></i> Acesso Rápido
                </h6>
            </div>
        </div>
        <div class="d-flex flex-wrap justify-content-center gap-4 mb-5" id="atalhos-mais-acessados"></div>
    `;
    container.appendChild(secaoMaisAcessados);

    const atalhosContainer = document.getElementById('atalhos-mais-acessados');
    const labelsDesejados = ["Acesso SILIA", "Painel CPRH", "Acesso e-mail", "Acesso SEI", "Agenda Telefônica", "Abertura Chamado T.I."];
    
    let botoesParaRenderizar = [];
    Object.values(menuDados).forEach(cat => {
        cat.botoes.forEach(botao => {
            if (labelsDesejados.includes(botao.label)) botoesParaRenderizar.push(botao);
        });
    });

    botoesParaRenderizar.sort((a, b) => labelsDesejados.indexOf(a.label) - labelsDesejados.indexOf(b.label));

    botoesParaRenderizar.forEach((item, index) => {
        const divPai = document.createElement('div');
        divPai.className = "animate__animated animate__zoomIn";
        divPai.style.animationDelay = `${0.4 + (index * 0.1)}s`;
        divPai.style.width = "130px";

        const visual = item.img ? `<img src="${item.img}" class="btn-img-custom shadow-sm">` : `<i class="${item.icon}"></i>`;

        divPai.innerHTML = `
            <button class="btn-float w-100 btn-atalho-destaque" style="border: 1px solid rgba(25, 135, 84, 0.1);">
                ${visual}
                <span class="fw-bold" style="font-size: 0.7rem; color: #555;">${item.label}</span>
            </button>
        `;

        divPai.querySelector('button').onclick = () => item.action();
        atalhosContainer.appendChild(divPai);

        setTimeout(() => {
            // ... final da função ...
            ativarTooltips(); // <--- REATIVA NOS CARDS PRINCIPAIS
            container.style.opacity = '1';
        }, 200);

    });
}

/*
=============================================
    NÍVEL 2: Carrossel (Swiper)
=============================================
*/
function carregarSegundoNivel(chave) {
    limparTooltips(); // <--- LIMPA O "FANTASMA" DO NÍVEL 1
    const container = document.getElementById('container-principal-menu');
    const categoria = menuDados[chave];
    if (!container || !categoria) return;

    container.innerHTML = `
        <div class="d-flex align-items-center mb-4 animate__animated animate__fadeIn">
            <button class="btn btn-outline-secondary btn-sm me-3 rounded-pill px-3" onclick="renderizarCardsNivel1()">
                <i class="fas fa-arrow-left me-1"></i> Voltar
            </button>
            <h4 class="text-success fw-bold m-0">${categoria.titulo}</h4>
        </div>
        <div class="swiper-container-ajuste px-4 animate__animated animate__fadeIn"> 
            <div class="swiper mySwiper">
                <div class="swiper-wrapper" id="menu-container"></div>
                
                <div class="swiper-button-next" 
                    data-bs-toggle="tooltip" 
                    data-bs-placement="right" 
                    title="Ver mais sistemas">
                </div>
                <div class="swiper-button-prev" 
                    data-bs-toggle="tooltip" 
                    data-bs-placement="left" 
                    title="Ver anteriores">
                </div>

                <div class="swiper-pagination"></div>
            </div>
        </div>
    `;

    const wrapper = document.getElementById('menu-container');
    categoria.botoes.forEach(item => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        
        const visual = item.img ? `<img src="${item.img}" class="btn-img-custom">` : `<i class="${item.icon}"></i>`;
        
        slide.innerHTML = `
            <button class="btn-float">
                ${visual}
                <span>${item.label}</span>
            </button>
        `;
        
        slide.querySelector('button').onclick = (e) => {
            e.preventDefault();
            item.action();
        };
        wrapper.appendChild(slide);
    });

    // setTimeout(inicializarSwiper, 100);
    setTimeout(() => {
        inicializarSwiper();
        ativarTooltips(); // <--- ATIVA OS TOOLTIPS NAS SETAS E BOTÕES NOVOS
        container.style.opacity = '1';
    }, 300);
}

function inicializarSwiper() {
    if (swiperInstancia) {
        swiperInstancia.destroy(true, true);
    }

    // Adicionamos um pequeno delay para garantir que o navegador renderizou o HTML injetado
    swiperInstancia = new Swiper(".mySwiper", {
        slidesPerView: 1,
        spaceBetween: 20,
        grabCursor: true,
        loop: true, // Ativa o modo infinito
        centeredSlides: false,
        
        // Melhora a estabilidade em conteúdos dinâmicos
        observer: true, 
        observeParents: true,
        
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
            dynamicBullets: true,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        breakpoints: {
            768: { 
                slidesPerView: 2,
                spaceBetween: 20 
            },
            1200: { 
                slidesPerView: 4, 
                spaceBetween: 30 
            }
        }
    });
}

/*
=============================================
    LOGICA DE DOCUMENTOS (LISTAS)
=============================================
*/
function mostrarLista(cat) {
    const container = document.getElementById('lista-documentos');
    const botaoFechar = document.getElementById('container-botao-fechar');
    const lista = documentos[cat] || [];
    
    if (!container) return;

    container.innerHTML = `<h6 class="text-success fw-bold mb-3 animate__animated animate__fadeIn">DOCUMENTOS</h6>`;
    
    if (lista.length === 0) {
        container.innerHTML += `<p class="small text-muted">Nenhum documento disponível.</p>`;
    } else {
        lista.forEach(doc => {
            const nomeFormatado = doc.nome.replace(/^(I\.S\..*?-)/, '<strong>$1</strong>');
            container.innerHTML += `
                <a href="${doc.url}" class="pdf-link d-block mb-2 text-decoration-none text-dark animate__animated animate__fadeInUp" target="_blank">
                    <i class="fas fa-file-pdf text-danger me-2"></i>${nomeFormatado}
                </a>`;
        });
    }
    
    if (botaoFechar) botaoFechar.classList.remove('d-none');
}

document.addEventListener('DOMContentLoaded', function() {
    const modalAvisoEl = document.getElementById('modalAviso');
    if (modalAvisoEl) {
        const modalAviso = new bootstrap.Modal(modalAvisoEl);
        modalAviso.show();
    }
    renderizarCardsNivel1();
    // Ativa todos os tooltips da página
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});