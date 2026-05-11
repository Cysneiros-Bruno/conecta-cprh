/* ======================================================================
    MÓDULO DE CONTROLE DE PATRIMÔNIO (VERSÃO MODULARIZADA ES6)
    FRONTEND: Permite Transferência, Empréstimo e Baixa de Bens.
====================================================================== */

// 1. IMPORTAMOS O NOSSO MOTOR DE API PÚBLICO
import { fetchPublico } from './services/apiService.js';

let itensPatrimonioTemp = [];
let catalogoPatrimonioUserMemoria = []; 
let setorOrigemAnterior = ""; 

function iniciarFluxoPatrimonio() {
    if (typeof window.solicitarAcesso === "function") {
        window.solicitarAcesso('Patrimonio');
    } else {
        console.error("Erro: script_PortalAcesso.js não carregado.");
    }
}

// Monta a interface interativa
function montarModalPatrimonio(dadosUsuario) {
    const container = document.getElementById('conteudo-modal-base');
    if (!container) return;

    itensPatrimonioTemp = []; 

    container.innerHTML = `
        <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold text-success">
                <i class="fas fa-barcode me-2"></i>Gestão de Patrimônio
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            
            <form id="form-patrimonio">
                <div class="bg-light p-3 rounded-3 mb-4 border shadow-sm">
                    <div class="row g-2 mb-3">
                        <div class="col-md-7">
                            <label class="small text-muted fw-bold">Solicitante Responsável</label>
                            <input type="text" id="patri_nome" class="form-control form-control-sm bg-white fw-bold" value="${dadosUsuario.nome}" readonly>
                        </div>
                        <div class="col-md-5">
                            <label class="small text-muted fw-bold">E-mail Corporativo</label>
                            <input type="email" id="patri_email" class="form-control form-control-sm bg-white fw-bold" value="${dadosUsuario.email}" readonly>
                        </div>
                    </div>
                    
                    <div class="row g-2">
                        <div class="col-md-4">
                            <label class="small text-muted fw-bold text-primary">Tipo da Requisição *</label>
                            <select id="patri_tipo" class="form-select form-select-sm shadow-sm border-primary fw-bold" onchange="alternarCamposPatri()">
                                <option value="Transferência">Transferência (Definitiva)</option>
                                <option value="Empréstimo">Empréstimo (Temporário)</option>
                                <option value="Baixa">Baixa de Bem (Descarte)</option>
                                <option value="Novo/Aquisição">Novo/Aquisição (Não Tombado)</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="small text-muted fw-bold" id="label-origem">Setor de Origem *</label>
                            <select id="patri_origem" class="form-select form-select-sm shadow-sm" onchange="aoSelecionarOrigem()"></select>
                        </div>
                        
                        <div class="col-md-4" id="box-destino">
                            <label class="small text-muted fw-bold">Setor de Destino *</label>
                            <select id="patri_destino" class="form-select form-select-sm shadow-sm border-success" onchange="validarEnvioPatri()"></select>
                        </div>
                        
                        <div class="col-md-4 d-none" id="box-motivo">
                            <label class="small text-muted fw-bold text-danger">Motivo da Baixa *</label>
                            <select id="patri_motivo" class="form-select form-select-sm shadow-sm border-danger" onchange="validarEnvioPatri()">
                                <option value="">Selecione o motivo...</option>
                                <option value="Inservível / Quebrado">Inservível / Quebrado</option>
                                <option value="Obsoleto / Desatualizado">Obsoleto / Desatualizado</option>
                                <option value="Roubo / Furto">Roubo / Furto</option>
                                <option value="Extravio">Extravio</option>
                            </select>
                        </div>

                        <div class="col-md-4 d-none" id="box-aquisicao">
                            <label class="small text-muted fw-bold text-success">Forma da Aquisição *</label>
                            <select id="patri_forma_aquisicao" class="form-select form-select-sm shadow-sm border-success" onchange="validarEnvioPatri()">
                                <option value="">Selecione a forma...</option>
                                <option value="Compra direta">Compra direta</option>
                                <option value="Compensação">Compensação</option>
                                <option value="Convênio">Convênio</option>
                                <option value="Cessão">Cessão</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="px-2">
                    <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <h6 class="fw-bold text-dark mb-0" id="titulo-lista-bens"><i class="fas fa-desktop me-2 text-primary"></i>Adicionar Bens à Lista</h6>
                        <button type="button" class="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold shadow-sm" onclick="addLinhaPatri()">
                            <i class="fas fa-plus me-1"></i> Adicionar Bem
                        </button>
                    </div>

                    <div class="card border-0 shadow-sm mb-3">
                        <div class="card-body p-2 bg-light rounded-3 border">
                            
                            <div class="row g-2" id="bloco-inserir-padrao">
                                <div class="col-md-5">
                                    <select id="patri_tombamento" class="form-select form-select-sm shadow-sm"></select>
                                </div>
                                <div class="col-md-7">
                                    <input type="text" id="patri_descricao" class="form-control form-control-sm bg-white text-dark fw-bold" placeholder="A descrição será preenchida automaticamente..." readonly>
                                </div>
                            </div>

                            <div class="row g-2 d-none" id="bloco-inserir-novo">
                                <div class="col-12">
                                    <input type="text" id="patri_descricao_nova" class="form-control form-control-sm border-success bg-white text-dark" placeholder="Descreva o bem de forma mais detalhada possivel...">
                                </div>
                            </div>

                        </div>
                    </div>

                    <div class="table-responsive bg-white rounded-3 shadow-sm border" style="min-height: 120px;">
                        <table class="table table-sm table-hover align-middle mb-0" style="font-size: 0.85rem;">
                            <thead class="table-light">
                                <tr>
                                    <th style="width: 30%;">Tombamento</th>
                                    <th>Descrição do Bem</th>
                                    <th class="text-center" style="width: 50px;">Ação</th>
                                </tr>
                            </thead>
                            <tbody id="tabela-itens-patri">
                                <tr><td colspan="3" class="text-center text-muted py-4">Nenhum bem adicionado ainda.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </form>
        </div>
        
        <div class="modal-footer border-0 p-0 mt-2 px-3 pb-4">
            <div class="d-flex justify-content-between align-items-center w-100">
                <span id="patri-status-texto" class="small fw-bold text-danger">Aguardando preenchimento...</span>
                <button type="button" id="btn-enviar-patri" class="btn btn-success px-4 rounded-pill fw-bold disabled shadow-sm" onclick="enviarPatrimonio()">
                    <i class="fas fa-paper-plane me-2"></i>Confirmar Requisição
                </button>
            </div>
        </div>
    `;

    // Garante que o select será populado se a função for global (script_Utilitarios ou similar)
    if(window.popularSelectSetores) {
        window.popularSelectSetores('patri_origem');
        window.popularSelectSetores('patri_destino');
    }
    
    const selectTombamento = document.getElementById('patri_tombamento');
    if (selectTombamento && !selectTombamento.tomselect) {
        new TomSelect(selectTombamento, {
            plugins: ['dropdown_input'],
            create: false,
            sortField: { field: "text", direction: "asc" },
            placeholder: "Selecione o Setor de Origem primeiro...",
            valueField: 'value',
            labelField: 'text',
            searchField: ['text', 'value'], 
            onChange: function(valorSelecionado) {
                const inputDesc = document.getElementById('patri_descricao');
                if (!valorSelecionado) {
                    inputDesc.value = '';
                    return;
                }
                const bem = catalogoPatrimonioUserMemoria.find(b => String(b.tombamento) === String(valorSelecionado));
                inputDesc.value = bem ? bem.descricao : '';
            }
        });
        selectTombamento.tomselect.disable();
    }

    setorOrigemAnterior = ""; 
}

async function carregarCatalogoPatrimonioUser(setor) {
    const selectEl = document.getElementById('patri_tombamento');

    if (!selectEl || !selectEl.tomselect) {
        console.warn("Aguardando inicialização do TomSelect...");
        return;
    }

    const tom = selectEl.tomselect;

    if (!setor || setor === "" || setor === "undefined") {
        tom.clearOptions();
        tom.clear();
        tom.disable();
        tom.control_input.placeholder = "Selecione o Setor de Origem primeiro...";
        return;
    }

    try {
        tom.enable();
        tom.control_input.placeholder = "Buscando bens no servidor...";

        // LÓGICA SIMPLIFICADA GRAÇAS A NOSSA API SERVICE
        const data = await fetchPublico(`/patrimonio/itens?setor=${encodeURIComponent(setor)}`);
        
        // A rota pública já retorna os ativos, não precisa de .filter(ativo===1)
        catalogoPatrimonioUserMemoria = Array.isArray(data) ? data : [];

        tom.clearOptions();
        tom.clear();

        if (catalogoPatrimonioUserMemoria.length === 0) {
            tom.control_input.placeholder = "Nenhum bem cadastrado neste setor.";
            tom.disable();
        } else {
            tom.control_input.placeholder = "Digite o Nº ou Nome do Bem...";
            
            catalogoPatrimonioUserMemoria.forEach(bem => {
                tom.addOption({
                    value: String(bem.tombamento), 
                    text: `${bem.tombamento} - ${bem.descricao}`
                });
            });
            tom.refreshOptions(false);
        }
        
        validarEnvioPatri();

    } catch (error) {
        console.error("Falha detalhada na busca de bens:", error);
        tom.control_input.placeholder = "Erro ao buscar bens. Tente novamente.";
        tom.disable();
    }
}

function alternarCamposPatri() {
    const tipo = document.getElementById('patri_tipo').value;
    const boxDestino = document.getElementById('box-destino');
    const boxMotivo = document.getElementById('box-motivo');
    const boxAquisicao = document.getElementById('box-aquisicao');
    const labelOrigem = document.getElementById('label-origem');
    const tituloLista = document.getElementById('titulo-lista-bens');
    const blocoPadrao = document.getElementById('bloco-inserir-padrao');
    const blocoNovo = document.getElementById('bloco-inserir-novo');

    if (itensPatrimonioTemp.length > 0) {
        itensPatrimonioTemp = [];
        renderizarTabelaPatri();
    }

    if (tipo === 'Baixa') {
        boxDestino.classList.add('d-none');
        boxAquisicao.classList.add('d-none');
        boxMotivo.classList.remove('d-none');
        labelOrigem.innerText = 'Setor Atual (Onde o bem está) *';
        tituloLista.innerHTML = '<i class="fas fa-trash-alt me-2 text-danger"></i>Bens para Descarte/Baixa';
        blocoPadrao.classList.remove('d-none');
        blocoNovo.classList.add('d-none');

    } else if (tipo === 'Novo/Aquisição') {
        boxDestino.classList.add('d-none');
        boxMotivo.classList.add('d-none');
        boxAquisicao.classList.remove('d-none');
        labelOrigem.innerText = 'Setor Atual (Onde o bem está) *';
        tituloLista.innerHTML = '<i class="fas fa-plus-circle me-2 text-success"></i>Bens Adquiridos';
        blocoPadrao.classList.add('d-none');
        blocoNovo.classList.remove('d-none');

    } else {
        boxDestino.classList.remove('d-none');
        boxMotivo.classList.add('d-none');
        boxAquisicao.classList.add('d-none');
        labelOrigem.innerText = 'Setor de Origem *';
        tituloLista.innerHTML = '<i class="fas fa-desktop me-2 text-primary"></i>Adicionar Bens à Lista';
        blocoPadrao.classList.remove('d-none');
        blocoNovo.classList.add('d-none');
    }
    
    validarEnvioPatri();
}

function addLinhaPatri() {
    const tipo = document.getElementById('patri_tipo').value;
    let tombamento = "";
    let desc = "";

    if (tipo === 'Novo/Aquisição') {
        desc = document.getElementById('patri_descricao_nova').value.trim();
        if (!desc) {
            Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Descreva o bem adquirido!', showConfirmButton: false, timer: 2000 });
            return;
        }
        tombamento = "S/N"; 
        document.getElementById('patri_descricao_nova').value = ''; 
        
    } else {
        const selectTombamento = document.getElementById('patri_tombamento');
        tombamento = selectTombamento.value.trim();
        desc = document.getElementById('patri_descricao').value.trim();
        
        if (!tombamento || !desc) {
            Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Selecione um bem válido!', showConfirmButton: false, timer: 2000 });
            return;
        }

        const jaExiste = itensPatrimonioTemp.some(item => item.tombamento === tombamento);
        if (jaExiste) {
            Swal.fire('Atenção', `O bem [${tombamento}] já foi adicionado.`, 'warning');
            return;
        }

        selectTombamento.tomselect.clear();
        document.getElementById('patri_descricao').value = '';
    }

    itensPatrimonioTemp.push({ tombamento: tombamento, descricao: desc });
    
    renderizarTabelaPatri();
    validarEnvioPatri();
}

function renderizarTabelaPatri() {
    const corpo = document.getElementById('tabela-itens-patri');
    
    if (itensPatrimonioTemp.length === 0) {
        corpo.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">Nenhum bem adicionado ainda.</td></tr>';
        return;
    }

    corpo.innerHTML = itensPatrimonioTemp.map((it, index) => `
        <tr>
            <td class="fw-bold"><span class="badge border border-dark text-dark bg-light"><i class="fas fa-barcode me-1"></i>${it.tombamento}</span></td>
            <td class="text-wrap">${it.descricao}</td>
            <td class="text-center">
                <button type="button" class="btn btn-sm text-danger p-0 border-0 shadow-none" onclick="removerItemPatri(${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function removerItemPatri(index) {
    itensPatrimonioTemp.splice(index, 1);
    renderizarTabelaPatri();
    validarEnvioPatri();
}

function validarEnvioPatri() {
    const tipo = document.getElementById('patri_tipo').value;
    const origem = document.getElementById('patri_origem').value;
    const destino = document.getElementById('patri_destino').value;
    const motivo = document.getElementById('patri_motivo').value;
    const formaAquisicao = document.getElementById('patri_forma_aquisicao').value;
    const btn = document.getElementById('btn-enviar-patri');
    const status = document.getElementById('patri-status-texto');
    const total = itensPatrimonioTemp.length;

    if (!status || !btn) return;

    if (!origem || origem === "") {
        status.textContent = "Selecione o setor atual.";
        status.className = "small fw-bold text-danger";
        btn.classList.add('disabled');
    } else if ((tipo === 'Transferência' || tipo === 'Empréstimo') && (!destino || destino === "")) {
        status.textContent = "Selecione o setor de destino.";
        status.className = "small fw-bold text-danger";
        btn.classList.add('disabled');
    } else if ((tipo === 'Transferência' || tipo === 'Empréstimo') && origem === destino) {
        status.textContent = "Origem e destino devem ser diferentes.";
        status.className = "small fw-bold text-danger";
        btn.classList.add('disabled');
    } else if (tipo === 'Baixa' && (!motivo || motivo === "")) {
        status.textContent = "Selecione o motivo da baixa.";
        status.className = "small fw-bold text-danger";
        btn.classList.add('disabled');
    } else if (tipo === 'Novo/Aquisição' && (!formaAquisicao || formaAquisicao === "")) {
        status.textContent = "Selecione a forma da aquisição.";
        status.className = "small fw-bold text-danger";
        btn.classList.add('disabled');
    } else if (total === 0) {
        status.textContent = "Adicione ao menos um bem à lista.";
        status.className = "small fw-bold text-danger";
        btn.classList.add('disabled');
    } else {
        status.textContent = `${total} bem(ns) pronto(s) para registro.`;
        status.className = "small fw-bold text-success";
        btn.classList.remove('disabled');
    }
}

async function enviarPatrimonio() {
    if (itensPatrimonioTemp.length === 0) return;

    const tipo = document.getElementById('patri_tipo').value;
    const origem = document.getElementById('patri_origem').value;
    let destino = document.getElementById('patri_destino').value;
    let motivo = document.getElementById('patri_motivo').value;
    let formaAquisicao = document.getElementById('patri_forma_aquisicao').value;

    if (tipo === 'Baixa') {
        destino = 'Depósito de Patrimônio (Baixa)'; 
    } else if (tipo === 'Novo/Aquisição') {
        destino = 'Patrimônio (Aguardando Tombamento)'; 
        motivo = formaAquisicao; 
    } else {
        motivo = 'N/A';
    }

    const dadosForm = {
        solicitante: document.getElementById('patri_nome').value,
        email: document.getElementById('patri_email').value,
        tipo_solicitacao: tipo, 
        motivo: motivo,         
        origem: origem,
        destino: destino,
        itens: itensPatrimonioTemp 
    };

    const btn = document.getElementById('btn-enviar-patri');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registrando...';
    btn.disabled = true;

    try {
        // USO DO FETCH PÚBLICO
        const data = await fetchPublico('/patrimonio', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosForm)
        });

        if (data.success) {
            const container = document.getElementById('conteudo-modal-base');
            container.innerHTML = `
                <div class="modal-body text-center py-5 animate__animated animate__fadeIn">
                    <i class="fas fa-check-circle text-success mb-4" style="font-size: 5rem;"></i>
                    <h4 class="fw-bold">Requisição Registrada!</h4>
                    <div class="bg-light p-3 rounded-4 border my-4 mx-auto" style="max-width: 300px;">
                        <small class="text-muted d-block fw-bold">PROTOCOLO DE ${tipo.toUpperCase()}</small>
                        <span class="fw-bold text-success" style="font-size: 1.5rem;">${data.protocolo}</span>
                    </div>
                    <p class="text-muted small mb-4">Um e-mail com os detalhes foi enviado para o Setor de Patrimônio</p>
                    <button type="button" class="btn btn-success rounded-pill px-5" data-bs-dismiss="modal">Fechar</button>
                </div>
            `;
        } else {
            Swal.fire('Erro', 'Falha ao gravar no banco: ' + data.message, 'error');
            btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Confirmar Requisição';
            btn.disabled = false;
        }
    } catch (error) {
        Swal.fire('Erro', 'Não foi possível conectar ao servidor.', 'error');
        btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Confirmar Requisição';
        btn.disabled = false;
    }
}

async function aoSelecionarOrigem() {
    const selectOrigem = document.getElementById('patri_origem');
    const novoSetor = selectOrigem.value;

    if (itensPatrimonioTemp.length === 0) {
        setorOrigemAnterior = novoSetor;
        carregarCatalogoPatrimonioUser(novoSetor);
        validarEnvioPatri(); 
        return;
    }

    if (novoSetor !== setorOrigemAnterior) {
        const confirmacao = await Swal.fire({
            title: 'Mudar Setor de Origem?',
            text: "Você já adicionou itens do setor anterior. Se mudar a origem agora, a lista de itens abaixo será descartada. Deseja continuar?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, descartar',
            cancelButtonText: 'Não, manter'
        });

        if (confirmacao.isConfirmed) {
            itensPatrimonioTemp = [];
            renderizarTabelaPatri(); 
            setorOrigemAnterior = novoSetor;
            carregarCatalogoPatrimonioUser(novoSetor); 
            validarEnvioPatri(); 
            
            Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Lista reiniciada com sucesso', showConfirmButton: false, timer: 2000 });
        } else {
            if (selectOrigem.tomselect) {
                selectOrigem.tomselect.addItem(setorOrigemAnterior, true); 
            } else {
                selectOrigem.value = setorOrigemAnterior;
            }
        }
    }
}

// =========================================================================
// EXPORTANDO AS FUNÇÕES PARA O HTML (A mágica do window)
// =========================================================================
window.iniciarFluxoPatrimonio = iniciarFluxoPatrimonio;
window.montarModalPatrimonio = montarModalPatrimonio;
window.carregarCatalogoPatrimonioUser = carregarCatalogoPatrimonioUser;
window.alternarCamposPatri = alternarCamposPatri;
window.addLinhaPatri = addLinhaPatri;
window.removerItemPatri = removerItemPatri;
window.validarEnvioPatri = validarEnvioPatri;
window.enviarPatrimonio = enviarPatrimonio;
window.aoSelecionarOrigem = aoSelecionarOrigem;