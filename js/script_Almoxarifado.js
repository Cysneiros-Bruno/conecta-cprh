/* ==========================================================
    LÓGICA DE ALMOXARIFADO (SOLICITAÇÃO DE MATERIAIS)
    Integrado com Autenticação Centralizada LDAP
========================================================== 
*/

/**
 * Ponto de entrada chamado pelo carrossel
 */
function iniciarFluxoAlmoxarifado() {
    if (typeof solicitarAcesso === "function") {
        solicitarAcesso('Almoxarifado'); // Chama a portaria global
    } else {
        console.error("Erro: script_PortalAcesso.js não carregado.");
    }
}

let contadorItensAlmox = 0; 

/**
 * Monta o Modal de Almoxarifado com dados validados
 * @param {Object} dadosUsuario - Contém {nome, email}
 */
function montarModalAlmoxarifado(dadosUsuario) {
    const container = document.getElementById('content-modal-almoxarifado');
    if (!container) return;

    contadorItensAlmox = 0; 
    const nomeServidor = dadosUsuario.nome || "";
    const emailServidor = dadosUsuario.email || "";

    container.innerHTML = `
        <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold text-success">
                <i class="fas fa-boxes me-2"></i>Requisição de Material
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <form id="form-almoxarifado">
                
                <div class="bg-light p-3 rounded-3 mb-4 border shadow-sm">
                    <h6 class="text-success fw-bold mb-3 small text-uppercase border-bottom pb-2">
                        <i class="fas fa-user-shield me-2"></i>Identificação Validada
                    </h6>
                    <div class="row g-2">
                        <div class="col-md-7">
                            <label class="small text-muted fw-bold">Solicitante</label>
                            <input type="text" id="almox-nome" class="form-control form-control-sm bg-white fw-bold" 
                                   value="${nomeServidor}" readonly>
                        </div>
                        <div class="col-md-5">
                            <label class="small text-muted fw-bold">E-mail Corporativo</label>
                            <input type="email" id="almox-email" class="form-control form-control-sm bg-white fw-bold" 
                                   value="${emailServidor}" readonly>
                        </div>
                        <div class="col-12 mt-1">
                            <label class="small text-muted fw-bold">Setor / Unidade *</label>
                            <input type="text" id="almox-unidade" class="form-control form-control-sm shadow-sm" 
                                   placeholder="Informe sua unidade de trabalho" required oninput="validarAlmoxarifado()">
                        </div>
                    </div>
                </div>

                <div class="px-2">
                    <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <h6 class="text-success fw-bold mb-0 small text-uppercase">
                            <i class="fas fa-list-ol me-2"></i>Itens Solicitados
                        </h6>
                        <button type="button" class="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold shadow-sm" onclick="adicionarLinhaAlmox()">
                            <i class="fas fa-plus me-1"></i> Adicionar Item
                        </button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm align-middle border-0">
                            <thead>
                                <tr class="text-muted small">
                                    <th style="width: 5%">#</th>
                                    <th style="width: 70%">Descrição do Material</th>
                                    <th style="width: 15%">Qtd.</th>
                                    <th style="width: 10%" class="text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-almox"></tbody>
                        </table>
                    </div>
                </div>
            </form>
        </div>

        <div class="modal-footer border-0 d-none p-0 mt-4" id="container-footer-almox">
            <div class="d-flex flex-column w-100">
                <div class="w-100 mb-3 text-start px-3">
                    <label class="form-label small fw-bold text-muted">Status / Itens Totais</label>
                    <input type="text" id="almox-status-footer" class="form-control border-success bg-light fw-bold text-success shadow-none" readonly>
                </div>
                <div class="d-flex justify-content-end w-100 gap-2 pb-4 px-3">
                    <button type="button" id="btn-almox-corrigir" class="btn btn-danger px-4 rounded-pill fw-bold" onclick="limparFormularioAlmoxarifado()">
                        <i class="fas fa-eraser me-2"></i>Limpar
                    </button>
                    <button type="button" id="btn-almox-enviar" class="btn btn-success px-4 rounded-pill fw-bold" onclick="enviarSolicitacaoAlmoxarifado()">
                        <i class="fas fa-paper-plane me-2"></i>Enviar Requisição
                    </button>
                </div>
            </div>
        </div>
    `;

    // Inicia com uma linha vazia
    adicionarLinhaAlmox();
    
    // Ativa o ouvinte de entrada
    document.getElementById('form-almoxarifado').addEventListener('input', validarAlmoxarifado);
}

function adicionarLinhaAlmox() {
    contadorItensAlmox++;
    const tbody = document.getElementById('tbody-almox');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.id = `linha-almox-${contadorItensAlmox}`;
    tr.className = "animate__animated animate__fadeInDown";
    
    tr.innerHTML = `
        <td class="text-center fw-bold text-success index-item-almox" style="font-size: 0.9rem;">${contadorItensAlmox}</td>
        <td>
            <input type="text" class="form-control form-control-sm border-0 bg-light rounded-3 item-desc" 
                   maxlength="60" placeholder="Ex: Resma Papel A4" oninput="validarAlmoxarifado()">
        </td>
        <td>
            <div class="d-flex align-items-center justify-content-center bg-light rounded-3 p-1 border">
                <button type="button" class="btn btn-sm btn-link text-danger p-0 me-2" 
                        onclick="ajustarQtdAlmox('${tr.id}', -1); validarAlmoxarifado();">
                    <i class="fas fa-minus-circle"></i>
                </button>
                <input type="text" class="form-control form-control-sm border-0 bg-transparent text-center item-qtd" 
                       style="width: 35px; font-weight: bold;" value="1"
                       oninput="this.value=this.value.replace(/[^0-9]/g,''); validarAlmoxarifado();">
                <button type="button" class="btn btn-sm btn-link text-success p-0 ms-2" 
                        onclick="ajustarQtdAlmox('${tr.id}', 1); validarAlmoxarifado();">
                    <i class="fas fa-plus-circle"></i>
                </button>
            </div>
        </td>
        <td class="text-center">
            <button type="button" class="btn btn-link text-danger btn-sm p-0" onclick="removerLinhaAlmox('${tr.id}')">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;
    tbody.appendChild(tr);
    renumerarItensAlmox();
    validarAlmoxarifado();
}

function ajustarQtdAlmox(idLinha, mudanca) {
    const linha = document.getElementById(idLinha);
    if (!linha) return;
    const inputQtd = linha.querySelector('.item-qtd');
    let valor = parseInt(inputQtd.value) || 0;
    valor = Math.max(1, Math.min(99, valor + mudanca));
    inputQtd.value = valor;
}

function removerLinhaAlmox(idLinha) {
    const linha = document.getElementById(idLinha);
    if (linha) {
        linha.classList.replace('animate__fadeInDown', 'animate__fadeOutRight'); 
        setTimeout(() => {
            linha.remove();
            renumerarItensAlmox();
            validarAlmoxarifado();
        }, 300);
    }
}

function renumerarItensAlmox() {
    const linhas = document.querySelectorAll('#tbody-almox tr');
    linhas.forEach((linha, index) => {
        const idxEl = linha.querySelector('.index-item-almox');
        if (idxEl) idxEl.innerText = index + 1;
    });
}

function validarAlmoxarifado() {
    const footer = document.getElementById('container-footer-almox');
    const status = document.getElementById('almox-status-footer');
    const unidade = document.getElementById('almox-unidade').value.trim();
    const linhas = document.querySelectorAll('#tbody-almox tr');

    let totalItensValidos = 0;
    let erroDescricao = false;

    linhas.forEach(linha => {
        const desc = linha.querySelector('.item-desc').value.trim();
        const qtd = parseInt(linha.querySelector('.item-qtd').value) || 0;

        if (desc !== "") {
            totalItensValidos++;
        } else {
            erroDescricao = true;
        }
    });

    const temInteracao = unidade !== "" || totalItensValidos > 0;
    footer.classList.toggle('d-none', !temInteracao);

    if (!unidade) {
        status.value = "ERRO: Informe sua unidade de trabalho";
        toggleBotoesAlmox(false);
    } else if (totalItensValidos === 0) {
        status.value = "ERRO: Adicione pelo menos 1 item";
        toggleBotoesAlmox(false);
    } else if (erroDescricao) {
        status.value = "ERRO: Existem itens sem descrição";
        toggleBotoesAlmox(false);
    } else {
        const textoItens = totalItensValidos > 1 ? 'itens listados' : 'item listado';
        status.value = `PRONTO: ${totalItensValidos} ${textoItens} para envio.`;
        toggleBotoesAlmox(true);
    }
}

function toggleBotoesAlmox(valido) {
    const status = document.getElementById('almox-status-footer');
    status.classList.toggle('text-danger', !valido);
    status.classList.toggle('text-success', valido);
    document.getElementById('btn-almox-enviar').classList.toggle('d-none', !valido);
    document.getElementById('btn-almox-corrigir').classList.toggle('d-none', valido);
}

function limparFormularioAlmoxarifado() {
    document.getElementById('almox-unidade').value = "";
    document.getElementById('tbody-almox').innerHTML = "";
    adicionarLinhaAlmox();
    document.getElementById('container-footer-almox').classList.add('d-none');
}

function enviarSolicitacaoAlmoxarifado() {
    // CHAMA O GERADOR CENTRALIZADO (Padrão: ALMOX-2026-000001)
    const protocolo = GeradorProtocolo.gerar('ALMOXARIFADO');

    // BUSCA O CONTAINER DO MODAL
    const container = document.getElementById('content-modal-almoxarifado');
    if (!container) return;

    // RENDERIZA A TELA DE SUCESSO PADRONIZADA
    container.innerHTML = `
        <div class="modal-body text-center py-5 animate__animated animate__fadeIn">
            <i class="fas fa-box-open text-success mb-4" style="font-size: 5rem;"></i>
            
            <h4 class="fw-bold text-dark">Requisição Concluída!</h4>
            <p class="text-muted px-4 small">
                Sua solicitação de materiais foi registrada e enviada para a equipe do Almoxarifado.
            </p>
            
            <div class="bg-light mx-auto p-3 rounded-4 border shadow-sm mb-4" style="max-width: 300px;">
                <small class="text-muted d-block fw-bold" style="letter-spacing: 1px; font-size: 0.7rem;">PROTOCOLO</small>
                <span class="fw-bold text-success" style="font-size: 1.4rem;">${protocolo}</span>
            </div>
            
            <button type="button" class="btn btn-success rounded-pill px-5 fw-bold shadow-sm" data-bs-dismiss="modal">
                Finalizar
            </button>
        </div>
    `;

    // Log para fins de auditoria no console do desenvolvedor
    console.log(`[ALMOXARIFADO] Requisição ${protocolo} processada.`);
}