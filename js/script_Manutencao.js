/* ===============================================================
    LÓGICA DE MANUTENÇÃO (PADRÃO 1-N / MODAL BASE)
    FRONTEND: Roda no navegador. Coleta os dados e envia para o Node.js.
    VERSÃO MODULARIZADA ES6
   =============================================================== */

// 1. IMPORTAÇÃO DO MOTOR DE API PÚBLICO
import { fetchPublico } from './services/apiService.js';

// Variável global (protegida na bolha) para armazenar os itens temporários antes do envio
let itensManutencaoTemp = [];

function iniciarFluxoManutencao() {
    // Chamada segura através do objeto window para funções de outros módulos
    if (typeof window.solicitarAcesso === "function") {
        window.solicitarAcesso('Manutencao');
    } else {
        console.error("Erro: script_PortalAcesso.js não carregado.");
    }
}

// Monta a interface idêntica à do Almoxarifado, focada em adicionar múltiplos itens
function montarModalManutencao(dadosUsuario) {
    const container = document.getElementById('conteudo-modal-base');
    if (!container) return;

    itensManutencaoTemp = []; // Reseta a lista sempre que o modal abrir

    container.innerHTML = `
        <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold text-success">
                <i class="fas fa-screwdriver-wrench me-2"></i>Abertura de Chamado - Manutenção
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            
            <form id="form-manutencao">
                <div class="bg-light p-3 rounded-3 mb-4 border shadow-sm">
                    <div class="row g-2">
                        <div class="col-md-7">
                            <label class="small text-muted fw-bold">Solicitante</label>
                            <input type="text" id="nome_solicitante" class="form-control form-control-sm bg-white fw-bold" value="${dadosUsuario.nome}" readonly>
                        </div>
                        <div class="col-md-5">
                            <label class="small text-muted fw-bold">E-mail Corporativo</label>
                            <input type="email" id="email_solicitante" class="form-control form-control-sm bg-white fw-bold" value="${dadosUsuario.email}" readonly>
                        </div>
                        <div class="col-12 mt-1">
                            <label class="small text-muted fw-bold">Setor / Localização Exata *</label>
                            <select id="localizacao_manut" class="form-select form-select-sm shadow-sm border-success" onchange="validarEnvioManut()" required></select>
                        </div>
                    </div>
                </div>

                <div class="px-2">
                    <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <h6 class="fw-bold text-dark mb-0"><i class="fas fa-tools me-2 text-warning"></i>Adicionar Reparos</h6>
                        <button type="button" class="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold shadow-sm" onclick="addLinhaManut()">
                            <i class="fas fa-plus me-1"></i> Adicionar Reparo
                        </button>
                    </div>

                    <div class="card border-0 shadow-sm mb-3">
                        <div class="card-body p-2 bg-light rounded-3 border">
                            <div class="row g-2">
                                <div class="col-md-4">
                                    <label class="small text-muted fw-bold d-block mb-1">Categoria *</label>
                                    <select id="tipo_manut" class="form-select form-select-sm">
                                        <option value="" disabled selected>Selecione...</option>
                                        <option value="Ar-condicionado">Ar-condicionado</option>
                                        <option value="Civil">Civil (Pintura/Portas/Chaves)</option>
                                        <option value="Elétrica">Elétrica (Lâmpadas/Tomadas)</option>
                                        <option value="Hidráulica">Hidráulica (Vazamento/Banheiros)</option>
                                        <option value="Mobiliário">Mobiliário (Cadeiras/Mesas)</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>
                                <div class="col-md-8">
                                    <label class="small text-muted fw-bold d-block mb-1">Descrição do Defeito *</label>
                                    <input type="text" id="desc_manut" class="form-control form-control-sm" placeholder="Ex: Lâmpada piscando e porta rangendo">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="table-responsive bg-white rounded-3 shadow-sm border" style="min-height: 120px;">
                        <table class="table table-sm table-hover align-middle mb-0" style="font-size: 0.85rem;">
                            <thead class="table-light">
                                <tr>
                                    <th style="width: 30%;">Tipo</th>
                                    <th>Descrição do Defeito</th>
                                    <th class="text-center" style="width: 50px;">Ação</th>
                                </tr>
                            </thead>
                            <tbody id="tabela-itens-manut">
                                <tr><td colspan="3" class="text-center text-muted py-4">Nenhum reparo adicionado ainda.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </form>
        </div>
        
        <div class="modal-footer border-0 p-0 mt-2 px-3 pb-4">
            <div class="d-flex justify-content-between align-items-center w-100">
                <span id="manut-status-texto" class="small fw-bold text-danger">Aguardando reparos...</span>
                <button type="button" id="btn-enviar-manut" class="btn btn-success px-4 rounded-pill fw-bold disabled shadow-sm" onclick="enviarManutencao()">
                    <i class="fas fa-paper-plane me-2"></i>Enviar Chamado
                </button>
            </div>
        </div>
    `;

    // Busca setores ativos (via script utilitário exportado globalmente)
    if (typeof window.popularSelectSetores === 'function') window.popularSelectSetores('localizacao_manut');
}

function addLinhaManut() {
    const tipo = document.getElementById('tipo_manut').value;
    const desc = document.getElementById('desc_manut').value.trim();
    
    if (!tipo || !desc) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Preencha a Categoria e a Descrição!', showConfirmButton: false, timer: 2000 });
        return;
    }

    itensManutencaoTemp.push({ tipo: tipo, descricao: desc });
    
    document.getElementById('tipo_manut').value = '';
    document.getElementById('desc_manut').value = '';
    document.getElementById('desc_manut').focus();
    
    renderizarTabelaManut();
    validarEnvioManut();
}

function renderizarTabelaManut() {
    const corpo = document.getElementById('tabela-itens-manut');
    
    if (itensManutencaoTemp.length === 0) {
        corpo.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">Nenhum reparo adicionado ainda.</td></tr>';
        return;
    }

    corpo.innerHTML = itensManutencaoTemp.map((it, index) => `
        <tr>
            <td class="fw-bold"><span class="badge bg-secondary">${it.tipo}</span></td>
            <td class="text-wrap">${it.descricao}</td>
            <td class="text-center">
                <button type="button" class="btn btn-sm text-danger p-0 border-0 shadow-none" onclick="removerItemManut(${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function removerItemManut(index) {
    itensManutencaoTemp.splice(index, 1);
    renderizarTabelaManut();
    validarEnvioManut();
}

function validarEnvioManut() {
    const setorElement = document.getElementById('localizacao_manut');
    const btn = document.getElementById('btn-enviar-manut');
    const status = document.getElementById('manut-status-texto');
    
    if (!setorElement || !btn || !status) return;

    const setor = setorElement.value;
    const total = itensManutencaoTemp.length;

    if (!setor || setor === "") {
        status.textContent = "Selecione a localização exata.";
        status.className = "small fw-bold text-danger";
        btn.classList.add('disabled');
        btn.disabled = true; 
    } else if (total === 0) {
        status.textContent = "Adicione ao menos um reparo.";
        status.className = "small fw-bold text-danger";
        btn.classList.add('disabled');
        btn.disabled = true; 
    } else {
        status.textContent = `${total} reparo(s) pronto(s).`;
        status.className = "small fw-bold text-success";
        btn.classList.remove('disabled');
        btn.disabled = false; 
    }
}

async function enviarManutencao() {
    const local = document.getElementById('localizacao_manut').value;
    
    if (!local || local === "") {
        Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Selecione o Setor/Localização!', showConfirmButton: false, timer: 2500 });
        return; 
    }

    if (itensManutencaoTemp.length === 0) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Adicione ao menos um reparo!', showConfirmButton: false, timer: 2500 });
        return; 
    }

    const dadosForm = {
        nome: document.getElementById('nome_solicitante').value,
        email: document.getElementById('email_solicitante').value,
        local: local,
        itens: itensManutencaoTemp 
    };

    const btn = document.getElementById('btn-enviar-manut');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
    btn.disabled = true;

    try {
        // CORREÇÃO: Utilização do fetchPublico e remoção do IP direto
        const data = await fetchPublico('/manutencao', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosForm)
        });

        if (data.success) {
            const container = document.getElementById('conteudo-modal-base');
            container.innerHTML = `
                <div class="modal-body text-center py-5 animate__animated animate__fadeIn">
                    <i class="fas fa-check-circle text-success mb-4" style="font-size: 5rem;"></i>
                    <h4 class="fw-bold">Solicitação Realizada!</h4>                    
                    <div class="bg-light p-3 rounded-4 border my-4 mx-auto" style="max-width: 300px;">
                        <small class="text-muted d-block fw-bold">PROTOCOLO</small>
                        <span class="fw-bold text-success" style="font-size: 1.5rem;">${data.protocolo}</span>
                    </div>
                    <p class="text-muted small mb-4">Um e-mail de confirmação foi enviado para o Setor Responsável</p>
                    <button type="button" class="btn btn-success rounded-pill px-5" data-bs-dismiss="modal">Fechar</button>
                </div>
            `;
        } else {
            Swal.fire('Erro', 'Falha ao gravar no banco: ' + data.message, 'error');
            btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Enviar Chamado';
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Erro na integração:", error);
        Swal.fire('Erro', 'Não foi possível conectar ao servidor.', 'error');
        btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Enviar Chamado';
        btn.disabled = false;
    }
}

// =========================================================================
// EXPORTANDO AS FUNÇÕES PARA O HTML (Furar a bolha do ES6 Module)
// =========================================================================
window.iniciarFluxoManutencao = iniciarFluxoManutencao;
window.montarModalManutencao = montarModalManutencao;
window.addLinhaManut = addLinhaManut;
window.removerItemManut = removerItemManut;
window.validarEnvioManut = validarEnvioManut;
window.enviarManutencao = enviarManutencao;