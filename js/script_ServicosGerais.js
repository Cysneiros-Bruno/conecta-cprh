/* ======================================================================
    LÓGICA DE SERVIÇOS GERAIS (PADRÃO 1-N / MODAL BASE)
    FRONTEND: Limpeza, Copa, Jardinagem, etc.
    VERSÃO MODULARIZADA ES6
====================================================================== */

// 1. IMPORTAÇÃO DO MOTOR DE API PÚBLICO
import { fetchPublico } from './services/apiService.js';

let itensServicosGeraisTemp = [];

function iniciarFluxoServicosGerais() {
    if (typeof window.solicitarAcesso === "function") {
        window.solicitarAcesso('ServicosGerais');
    }
}

function montarModalServicosGerais(dadosUsuario) {
    const container = document.getElementById('conteudo-modal-base');
    if (!container) return;

    itensServicosGeraisTemp = []; 

    container.innerHTML = `
        <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold text-success">
                <i class="fas fa-broom me-2"></i>Abertura de Chamado - Serviços Gerais
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            
            <form id="form-servicos-gerais">
                <div class="bg-light p-3 rounded-3 mb-4 border shadow-sm">
                    <div class="row g-2">
                        <div class="col-md-7">
                            <label class="small text-muted fw-bold">Solicitante</label>
                            <input type="text" id="sg_nome" class="form-control form-control-sm bg-white fw-bold" value="${dadosUsuario.nome}" readonly>
                        </div>
                        <div class="col-md-5">
                            <label class="small text-muted fw-bold">E-mail Corporativo</label>
                            <input type="email" id="sg_email" class="form-control form-control-sm bg-white fw-bold" value="${dadosUsuario.email}" readonly>
                        </div>
                        <div class="col-12 mt-1">
                            <label class="small text-muted fw-bold">Setor / Localização Exata *</label>
                            <select id="sg_localizacao" class="form-select form-select-sm shadow-sm border-success" onchange="validarEnvioSG()" required></select>
                        </div>
                    </div>
                </div>

                <div class="px-2">
                    <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <h6 class="fw-bold text-dark mb-0"><i class="fas fa-hands-bubbles me-2 text-info"></i>Adicionar Serviços</h6>
                        <button type="button" class="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold shadow-sm" onclick="addLinhaSG()">
                            <i class="fas fa-plus me-1"></i> Adicionar Serviço
                        </button>
                    </div>

                    <div class="card border-0 shadow-sm mb-3">
                        <div class="card-body p-2 bg-light rounded-3 border">
                            <div class="row g-2">
                                <div class="col-md-4">
                                    <label class="small text-muted fw-bold d-block mb-1">Categoria *</label>
                                    <select id="sg_categoria" class="form-select form-select-sm">
                                        <option value="" disabled selected>Selecione...</option>
                                        <option value="Limpeza">Limpeza Geral</option>
                                        <option value="Copa">Copa (Água/Café)</option>
                                        <option value="Jardinagem">Jardinagem</option>
                                        <option value="Descarte">Descarte de Material</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>
                                <div class="col-md-8">
                                    <label class="small text-muted fw-bold d-block mb-1">Descrição da Solicitação *</label>
                                    <input type="text" id="sg_descricao" class="form-control form-control-sm" placeholder="Ex: Substituição do garrafão de água">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="table-responsive bg-white rounded-3 shadow-sm border" style="min-height: 120px;">
                        <table class="table table-sm table-hover align-middle mb-0" style="font-size: 0.85rem;">
                            <thead class="table-light">
                                <tr>
                                    <th style="width: 30%;">Categoria</th>
                                    <th>Descrição</th>
                                    <th class="text-center" style="width: 50px;">Ação</th>
                                </tr>
                            </thead>
                            <tbody id="tabela-itens-sg">
                                <tr><td colspan="3" class="text-center text-muted py-4">Nenhum serviço adicionado ainda.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </form>
        </div>
        
        <div class="modal-footer border-0 p-0 mt-2 px-3 pb-4">
            <div class="d-flex justify-content-between align-items-center w-100">
                <span id="sg-status-texto" class="small fw-bold text-danger">Aguardando serviços...</span>
                <button type="button" id="btn-enviar-sg" class="btn btn-success px-4 rounded-pill fw-bold disabled shadow-sm" onclick="enviarServicosGerais()">
                    <i class="fas fa-paper-plane me-2"></i>Enviar Chamado
                </button>
            </div>
        </div>
    `;

    if (typeof window.popularSelectSetores === 'function') window.popularSelectSetores('sg_localizacao');
}

function addLinhaSG() {
    const categoria = document.getElementById('sg_categoria').value;
    const desc = document.getElementById('sg_descricao').value.trim();
    
    if (!categoria || !desc) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Preencha a Categoria e a Descrição!', showConfirmButton: false, timer: 2000 });
        return;
    }

    itensServicosGeraisTemp.push({ categoria: categoria, descricao: desc });
    
    document.getElementById('sg_categoria').value = '';
    document.getElementById('sg_descricao').value = '';
    document.getElementById('sg_descricao').focus();
    
    renderizarTabelaSG();
    validarEnvioSG();
}

function renderizarTabelaSG() {
    const corpo = document.getElementById('tabela-itens-sg');
    
    if (itensServicosGeraisTemp.length === 0) {
        corpo.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">Nenhum serviço adicionado ainda.</td></tr>';
        return;
    }

    corpo.innerHTML = itensServicosGeraisTemp.map((it, index) => `
        <tr>
            <td class="fw-bold"><span class="badge bg-info text-dark">${it.categoria}</span></td>
            <td class="text-wrap">${it.descricao}</td>
            <td class="text-center">
                <button type="button" class="btn btn-sm text-danger p-0 border-0 shadow-none" onclick="removerItemSG(${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function removerItemSG(index) {
    itensServicosGeraisTemp.splice(index, 1);
    renderizarTabelaSG();
    validarEnvioSG();
}

function validarEnvioSG() {
    const setorElement = document.getElementById('sg_localizacao');
    if (!setorElement) return;

    const setor = setorElement.value;
    const btn = document.getElementById('btn-enviar-sg');
    const status = document.getElementById('sg-status-texto');
    const total = itensServicosGeraisTemp.length;

    if (!btn || !status) return;

    if (!setor || setor === "") {
        status.textContent = "Selecione a localização exata.";
        status.className = "small fw-bold text-danger";
        btn.classList.add('disabled');
    } else if (total === 0) {
        status.textContent = "Adicione ao menos um serviço.";
        status.className = "small fw-bold text-danger";
        btn.classList.add('disabled');
    } else {
        status.textContent = `${total} serviço(s) pronto(s).`;
        status.className = "small fw-bold text-success";
        btn.classList.remove('disabled');
    }
}

async function enviarServicosGerais() {
    if (itensServicosGeraisTemp.length === 0) return;

    const dadosForm = {
        nome: document.getElementById('sg_nome').value,
        email: document.getElementById('sg_email').value,
        local: document.getElementById('sg_localizacao').value,
        itens: itensServicosGeraisTemp 
    };

    const btn = document.getElementById('btn-enviar-sg');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
    btn.disabled = true;

    try {
        // CORREÇÃO: Utilização do fetchPublico
        const data = await fetchPublico('/servicos-gerais', {
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
window.iniciarFluxoServicosGerais = iniciarFluxoServicosGerais;
window.montarModalServicosGerais = montarModalServicosGerais;
window.addLinhaSG = addLinhaSG;
window.removerItemSG = removerItemSG;
window.validarEnvioSG = validarEnvioSG;
window.enviarServicosGerais = enviarServicosGerais;