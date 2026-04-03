/*
================================================
    BANCO DE DADOS PARA PESQUISA NA INTRANET
================================================
 */
const BASE_DOCUMENTOS = [
    // --- SISTEMAS EXTERNOS (CHAMAM PÁGINAS - REDIRECTS) ---
    { nome: "Acesso e-mail (Expresso)", categoria: "Sistemas Externos", link: "https://www.expresso.pe.gov.br/", chaves: "email correio mensagem" },
    { nome: "Acesso SEI", categoria: "Sistemas Externos", link: "https://sei.pe.gov.br/", chaves: "processo eletronico documentos" },
    { nome: "Acesso NPS", categoria: "Sistemas Externos", link: "https://www.nps.pe.gov.br/", chaves: "nps sistema contra-cheque" },
    { nome: "Avaliação de Desempenho", categoria: "Sistemas Externos", link: "https://www.gestaododesempenho.pe.gov.br/", chaves: "avaliacao desempenho" },
    { nome: "Acesso MDComune", categoria: "Sistemas Externos", link: "https://www.mdcomune.com.br/", chaves: "mdcomune registro ponto" },

    // --- SISTEMAS INTERNOS (CHAMAM MODAIS OU PÁGINAS) ---
    { nome: "Acesso SILIA", categoria: "Sistemas Internos", link: "https://silia.cprh.pe.gov.br:83", chaves: "silia licenciamento" },
    { nome: "Acesso SISAM", categoria: "Sistemas Internos", link: "https://sistemas.cprh.pe.gov.br:8383/siliaweb/selis/", chaves: "sisam siliaweb licenciamento" },
    { nome: "Agenda Telefônica", categoria: "Sistemas Internos", link: "agenda.html", chaves: "contatos ramais telefones" },
    { nome: "Suporte TI (WhatsApp)", categoria: "Sistemas Internos", link: "#", modal: "modalTI", funcao: "montarModalTI", chaves: "ajuda computador impressora chamado" },
    { nome: "Solicitação de Veículos", categoria: "Sistemas Internos", link: "#", modal: "modalVeiculos", funcao: "montarModalVeiculos", chaves: "carro viagem transporte motorista" },
    { nome: "Solicitação Almoxarifado", categoria: "Sistemas Internos", link: "#", modal: "modalAlmoxarifado", funcao: "montarModalAlmoxarifado", chaves: "almoxarifado almox material escritorio" },
    { nome: "Solicitação de Manutenção", categoria: "Sistemas Internos", link: "#", modal: "modalManutencao", funcao: "montarModalManutencao", chaves: "ar-condicionado eletrica hidraulica lampadas manutencao" },

    // --- LEGISLAÇÃO E DOCUMENTOS (CHAMAM PDFs LOCAIS) ---
    { nome: "I.S. 06/2024 - Estabelece os procedimentos e os critérios para pagamento em ordem cronológica", categoria: "Legislação", link: "instrucoes_servicos/is_06-2024.pdf", chaves: "is instrucao servico pagamento financeiro contas" },
    { nome: "I.S. 05/2024 - Estabelece as orientações e procedimentos referentes ao Controle de Frequência", categoria: "Legislação", link: "instrucoes_servicos/is_05-2024.pdf", chaves: "is instrucao servico controle procedimentos ponto horario frequencia" },
    { nome: "I.S. 04/2024 - Estabelece procedimentos para Gestão e Fiscalização de Contratos e Convênios", categoria: "Legislação", link: "instrucoes_servicos/is_04-2024.pdf", chaves: "is instrucao servico fiscalizacao gestao contratos convenios" },
    { nome: "I.S. 03/2024 - Disciplina as regras, procedimentos e rotinas do Controle de Frequência", categoria: "Legislação", link: "instrucoes_servicos/is_03-2024.pdf", chaves: "is instrucao servico regras procedimentos rotinas controle frequencia" },
    { nome: "I.S. 02/2024 - Disciplina as regras e rotinas à Área de Tecnologia da Informação", categoria: "Legislação", link: "instrucoes_servicos/is_02-2024.pdf", chaves: "is instrucao servico regras rotinas ti tecnologia informacao" },
    { nome: "I.S. 01/2024 - Estabelece orientações de manutenção dos Termos de Compromissos no SILIA", categoria: "Legislação", link: "instrucoes_servicos/is_01-2024.pdf", chaves: "is instrucao servico orientacoes manutencao termos compromissos silia" },
    { nome: "I.S. 01/2019 - Estabelece a contagem de prazos em dias úteis", categoria: "Legislação", link: "instrucoes_servicos/is_01-2019.pdf", chaves: "is contagem prazo dias uteis" }
];

/*
====================================
    FUNÇÃO PRINCIPAL DE BUSCA
====================================
 */
function executarBuscaGlobal() {
    const input = document.getElementById('busca-input');
    const containerLista = document.getElementById('lista-documentos');
    const containerMenu = document.getElementById('container-principal-menu');
    const botaoFechar = document.getElementById('container-botao-fechar');

    if (!input || !containerLista) return;

    const termo = input.value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    if (termo.length < 2) {
        containerLista.innerHTML = "";
        if (containerMenu) containerMenu.style.opacity = "1";
        if (containerMenu) containerMenu.style.pointerEvents = "auto";
        if (botaoFechar) botaoFechar.classList.add('d-none');
        return;
    }

    if (botaoFechar) botaoFechar.classList.remove('d-none');

    const resultados = BASE_DOCUMENTOS.filter(doc => {
        const nomeNorm = doc.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        const chavesNorm = doc.chaves.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        const catNorm = doc.categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

        return nomeNorm.includes(termo) || chavesNorm.includes(termo) || catNorm.includes(termo);
    });

    if (containerMenu) {
        containerMenu.style.opacity = "0.1";
        containerMenu.style.pointerEvents = "none";
    }

    if (resultados.length > 0) {
        containerLista.innerHTML = resultados.map(item => {
            const ehModal = !!item.modal;
            
            // --- NOVA LÓGICA DE FORMATAÇÃO ---
            // Aplica negrito apenas no prefixo I.S. até o hífen
            const nomeExibicao = item.nome.replace(/^(I\.S\..*?-)/, '<strong>$1</strong>');
            
            const acao = ehModal 
                ? `onclick="if(typeof ${item.funcao} === 'function') { ${item.funcao}(); } fecharListaSuave();" 
                   data-bs-toggle="modal" 
                   data-bs-target="#${item.modal}" 
                   href="javascript:void(0)"` 
                : `href="${item.link}" target="_blank" onclick="fecharListaSuave()"`;

            return `
                <div class="card mb-2 shadow-sm border-0 animate__animated animate__fadeInUp">
                    <div class="card-body p-2">
                        <a ${acao} class="text-decoration-none d-flex justify-content-between align-items-center">
                            <div class="ps-2">
                                <small class="text-success fw-bold d-block" style="font-size:0.65rem; text-transform: uppercase;">${item.categoria}</small>
                                <strong class="text-dark d-block fw-normal">${nomeExibicao}</strong>
                            </div>
                            <div class="pe-2">
                                <i class="fas ${ehModal ? 'fa-window-restore' : 'fa-external-link-alt'} text-muted opacity-50"></i>
                            </div>
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        containerLista.innerHTML = `<div class="text-center py-4 text-muted border rounded-4 bg-light small">Nenhum resultado para "${input.value}"</div>`;
    }
}

/*
========================
    LIMPEZA DA BUSCA
========================
 */
function fecharListaSuave() {
    const input = document.getElementById('busca-input');
    const containerLista = document.getElementById('lista-documentos');
    const containerMenu = document.getElementById('container-principal-menu');
    const botaoFechar = document.getElementById('container-botao-fechar');

    if (input) input.value = "";
    if (containerLista) containerLista.innerHTML = "";
    if (containerMenu) {
        containerMenu.style.opacity = "1";
        containerMenu.style.pointerEvents = "auto";
    }
    if (botaoFechar) botaoFechar.classList.add('d-none');
}