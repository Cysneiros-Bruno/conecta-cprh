/* ==========================================================
    LÓGICA DE ALMOXARIFADO (VERSÃO FINAL 100% MODULAR)
   ========================================================== 
*/

import { fetchPublico } from './services/apiService.js';

let contadorItensAlmox = 0; 
let catalogoMateriaisMemoria = []; 
let categoriasDisponiveis = [];
const LIMITE_MAXIMO_ITENS = 10;

function iniciarFluxoAlmoxarifado() {
    if (typeof window.solicitarAcesso === "function") {
        window.solicitarAcesso('Almoxarifado'); 
    }
}

function montarModalAlmoxarifado(dadosUsuario) {
    const container = document.getElementById('conteudo-modal-base');
    if (!container) return;

    contadorItensAlmox = 0; 

    container.innerHTML = `
        <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold text-success"><i class="fas fa-boxes me-2"></i>Requisição de Material</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            <form id="form-almoxarifado">
                
                <div class="bg-light p-3 rounded-3 mb-4 border shadow-sm">
                    <div class="row g-2">
                        <div class="col-md-7">
                            <label class="small text-muted fw-bold">Solicitante</label>
                            <input type="text" id="almox-nome" class="form-control form-control-sm bg-white fw-bold" value="${dadosUsuario.nome}" readonly>
                        </div>
                        <div class="col-md-5">
                            <label class="small text-muted fw-bold">E-mail Corporativo</label>
                            <input type="email" id="almox-email" class="form-control form-control-sm bg-white fw-bold" value="${dadosUsuario.email}" readonly>
                        </div>
                        <div class="col-12 mt-1">
                            <label class="small text-muted fw-bold">Setor / Unidade *</label>
                            <select id="almox-unidade" class="form-select form-select-sm shadow-sm" required></select>
                        </div>
                    </div>
                </div>

                <div class="px-2">
                    <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <h6 class="fw-bold text-dark mb-0"><i class="fas fa-box-open me-2 text-success"></i>Itens Solicitados</h6>
                        
                        <button type="button" id="btn-almox-add" class="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold shadow-sm" onclick="adicionarLinhaAlmox()">
                            <i class="fas fa-plus me-1"></i> Adicionar Item
                        </button>
                    </div>
                    
                    <div class="table-responsive" style="min-height: 150px; overflow-y: visible;">
                        <table class="table table-sm align-middle border-0" id="tabela-itens-almox">
                            <thead>
                                <tr class="text-muted small">
                                    <th style="width: 5%">#</th>
                                    <th style="width: 18%">Categoria</th>
                                    <th style="width: 12%">Código</th>
                                    <th style="width: 45%">Material Selecionado</th>
                                    <th style="width: 12%">Qtd.</th>
                                    <th style="width: 8%" class="text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-almox">
                            </tbody>
                        </table>
                    </div>
                </div>
            </form>
        </div>

        <div class="modal-footer border-0 p-0 mt-2 px-3 pb-4">
            <div class="d-flex justify-content-between align-items-center w-100">
                <span id="almox-status-texto" class="small fw-bold text-danger">Carregando catálogo...</span>
                <button type="button" id="btn-almox-enviar" class="btn btn-success px-4 rounded-pill fw-bold disabled" onclick="enviarSolicitacaoAlmoxarifado()">
                    <i class="fas fa-paper-plane me-2"></i>Enviar Requisição
                </button>
            </div>
        </div>
    `;

    if (typeof window.popularSelectSetores === 'function') window.popularSelectSetores('almox-unidade');
    
    carregarCatalogoAlmox().then(() => {
        adicionarLinhaAlmox();
    });
    
    document.getElementById('form-almoxarifado').addEventListener('input', validarAlmoxarifado);
    document.getElementById('form-almoxarifado').addEventListener('change', validarAlmoxarifado);
}

async function carregarCatalogoAlmox() {
    try {
        const data = await fetchPublico('/materiais');
        // CORRIGIDO: Removemos o "await response.json()" que estava a causar o erro
        catalogoMateriaisMemoria = Array.isArray(data) ? data : [];
        
        const setCategorias = new Set(catalogoMateriaisMemoria.map(item => item.categoria || 'Uso Geral'));
        categoriasDisponiveis = Array.from(setCategorias).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    } catch (error) {
        console.error('Erro ao carregar o catálogo:', error);
    }
}

function adicionarLinhaAlmox() {
    const tbody = document.getElementById('tbody-almox');
    const btnAdd = document.getElementById('btn-almox-add');
    const qtdAtual = tbody.querySelectorAll('tr').length;
    
    if (qtdAtual >= LIMITE_MAXIMO_ITENS) return; 

    contadorItensAlmox++;
    const idLinha = `linha-almox-${contadorItensAlmox}`;
    const tr = document.createElement('tr');
    tr.id = idLinha;
    tr.className = "animate__animated animate__fadeInDown";
    
    let optionsCategoria = `<option value="" selected disabled>Selecione...</option>`;
    categoriasDisponiveis.forEach(cat => { optionsCategoria += `<option value="${cat}">${cat}</option>`; });

    tr.innerHTML = `
        <td class="text-center fw-bold text-success index-item-almox" style="font-size: 0.9rem;">${contadorItensAlmox}</td>
        <td><select class="form-select form-select-sm bg-light item-categoria" onchange="aoSelecionarCategoria(this)">${optionsCategoria}</select></td>
        <td><input type="text" class="form-control form-control-sm bg-light text-muted item-codigo fw-bold" placeholder="Auto" readonly></td>
        <td><select class="form-select form-select-sm bg-light item-desc text-dark text-truncate" style="max-width: 350px;" onchange="aoSelecionarMaterial(this)" disabled><option value="" selected disabled>Aguardando Categoria...</option></select></td>
        <td>
            <div class="d-flex align-items-center bg-light rounded-3 p-1 border">
                <button type="button" class="btn btn-sm text-danger p-0 px-1" onclick="ajustarQtdAlmox('${idLinha}', -1)"><i class="fas fa-minus"></i></button>
                <input type="number" class="form-control form-control-sm border-0 bg-transparent text-center p-0 item-qtd fw-bold" value="1" readonly>
                <button type="button" class="btn btn-sm text-success p-0 px-1" onclick="ajustarQtdAlmox('${idLinha}', 1)"><i class="fas fa-plus"></i></button>
            </div>
        </td>
        <td class="text-center"><button type="button" class="btn btn-link text-danger btn-sm p-0" onclick="removerLinhaAlmox('${idLinha}')"><i class="fas fa-trash-alt"></i></button></td>
    `;
    
    tbody.appendChild(tr);
    renumerarItensAlmox();
    validarAlmoxarifado();

    if ((qtdAtual + 1) >= LIMITE_MAXIMO_ITENS) {
        if (btnAdd) {
            btnAdd.disabled = true;
            btnAdd.innerHTML = `<i class="fas fa-lock me-1"></i> Máximo Atingido`;
            btnAdd.classList.replace('btn-outline-success', 'btn-secondary');
        }
        Swal.fire({ title: 'Limite Atingido!', html: `Você adicionou a <b>${LIMITE_MAXIMO_ITENS}ª linha</b> de materiais.`, icon: 'info' });
    }
}

function aoSelecionarCategoria(selectCat) {
    const linha = selectCat.closest('tr');
    const inputCod = linha.querySelector('.item-codigo');
    const selectDesc = linha.querySelector('.item-desc');
    const categoriaSelecionada = selectCat.value;

    inputCod.value = '';
    selectDesc.innerHTML = '<option value="" selected disabled>Selecione o Material...</option>';

    if (categoriaSelecionada) {
        selectDesc.disabled = false;
        const itensDaFamilia = catalogoMateriaisMemoria.filter(m => (m.categoria || 'Uso Geral') === categoriaSelecionada);
        
        itensDaFamilia.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.codigo; 
            
            if (item.quantidade_estoque <= 0) {
                opt.text = `🚫 [ INDISPONÍVEL ] - ${item.descricao}`;
                opt.disabled = true; 
            } else {
                opt.text = item.descricao; 
            }
            selectDesc.appendChild(opt);
        });
    } else {
        selectDesc.disabled = true;
    }
    validarAlmoxarifado();
}

function aoSelecionarMaterial(selectDesc) {
    const linhaAtual = selectDesc.closest('tr');
    const inputCodAtual = linhaAtual.querySelector('.item-codigo');
    const codigoSelecionado = selectDesc.value; 

    const tbody = document.getElementById('tbody-almox');
    let idLinhaDuplicada = null;

    tbody.querySelectorAll('tr').forEach(linha => {
        if (linha.id !== linhaAtual.id) {
            const codOutraLinha = linha.querySelector('.item-codigo').value;
            if (codOutraLinha === codigoSelecionado && codigoSelecionado !== "") idLinhaDuplicada = linha.id;
        }
    });

    if (idLinhaDuplicada) {
        const linhaAntiga = document.getElementById(idLinhaDuplicada);
        const nomeMaterial = selectDesc.options[selectDesc.selectedIndex].text;

        Swal.fire({
            title: 'Material Duplicado!',
            html: `O item <b>${nomeMaterial}</b> já consta em outra linha. Somar quantidade?`,
            icon: 'question', showCancelButton: true, confirmButtonText: 'Sim', cancelButtonText: 'Não'
        }).then((result) => {
            if (result.isConfirmed) {
                ajustarQtdAlmox(idLinhaDuplicada, 1);
                linhaAntiga.classList.add('animate__pulse', 'bg-success', 'bg-opacity-25');
                setTimeout(() => linhaAntiga.classList.remove('animate__pulse', 'bg-success', 'bg-opacity-25'), 1500);
            }
            selectDesc.selectedIndex = 0;
            inputCodAtual.value = '';
            validarAlmoxarifado();
        });
        return; 
    }
    inputCodAtual.value = codigoSelecionado; 
    validarAlmoxarifado();
}

function ajustarQtdAlmox(idLinha, mudanca) {
    const linha = document.getElementById(idLinha);
    const inputQtd = linha.querySelector('.item-qtd');
    const inputCod = linha.querySelector('.item-codigo').value; 
    let valor = parseInt(inputQtd.value) || 0;
    
    let limiteMaximo = 99; 
    let nomeMaterial = "este item";

    if (inputCod) {
        const itemNoCatalogo = catalogoMateriaisMemoria.find(m => m.codigo === inputCod);
        if (itemNoCatalogo) {
            limiteMaximo = itemNoCatalogo.quantidade_estoque;
            nomeMaterial = itemNoCatalogo.descricao;
        }
    }

    let novaQtd = valor + mudanca;
    if (novaQtd < 1) novaQtd = 1;
    
    if (novaQtd > limiteMaximo) {
        Swal.fire({ title: 'Limite de Estoque!', html: `Máximo disponível para <b>${nomeMaterial}</b> atingido.`, icon: 'warning' });
        novaQtd = limiteMaximo; 
    }

    inputQtd.value = novaQtd;
    validarAlmoxarifado();
}

function removerLinhaAlmox(idLinha) {
    document.getElementById(idLinha).remove();
    renumerarItensAlmox();
    validarAlmoxarifado();

    const tbody = document.getElementById('tbody-almox');
    const btnAdd = document.getElementById('btn-almox-add');
    if (tbody.querySelectorAll('tr').length < LIMITE_MAXIMO_ITENS && btnAdd) {
        btnAdd.disabled = false;
        btnAdd.innerHTML = '<i class="fas fa-plus me-1"></i> Adicionar Item';
        btnAdd.classList.replace('btn-secondary', 'btn-outline-success');
    }
}

function renumerarItensAlmox() {
    document.querySelectorAll('#tbody-almox tr').forEach((linha, index) => {
        linha.querySelector('.index-item-almox').innerText = index + 1;
    });
}

function validarAlmoxarifado() {
    const unidade = document.getElementById('almox-unidade')?.value;
    let totalValidos = 0, erroCampos = false;

    document.querySelectorAll('#tbody-almox tr').forEach(linha => {
        const cat = linha.querySelector('.item-categoria').value;
        const cod = linha.querySelector('.item-codigo').value;
        const hasDesc = linha.querySelector('.item-desc').selectedIndex > 0; 
        
        if (cat !== "" && cod !== "" && hasDesc) totalValidos++;
        else erroCampos = true;
    });

    const btn = document.getElementById('btn-almox-enviar');
    const status = document.getElementById('almox-status-texto');

    if (!btn || !status) return;

    if (!unidade || unidade === "") {
        status.textContent = "Selecione sua unidade no topo.";
        status.className = "small fw-bold text-danger";
        btn.classList.add('disabled'); btn.disabled = true;
    } else if (totalValidos === 0 || erroCampos) {
        status.textContent = "Selecione corretamente a Categoria e o Material.";
        status.className = "small fw-bold text-danger";
        btn.classList.add('disabled'); btn.disabled = true;
    } else {
        status.textContent = `${totalValidos} item(ns) validado(s).`;
        status.className = "small fw-bold text-success";
        btn.classList.remove('disabled'); btn.disabled = false;
    }
}

async function enviarSolicitacaoAlmoxarifado() {
    const dados = {
        nome: document.getElementById('almox-nome').value,
        email: document.getElementById('almox-email').value,
        unidade: document.getElementById('almox-unidade').value,
        itens: [] 
    };

    document.querySelectorAll('#tbody-almox tr').forEach(linha => {
        const cat = linha.querySelector('.item-categoria').value;
        const cod = linha.querySelector('.item-codigo').value;
        const selectDesc = linha.querySelector('.item-desc');
        const desc = selectDesc.options[selectDesc.selectedIndex]?.text || '';
        const qtd = parseInt(linha.querySelector('.item-qtd').value) || 1;
        
        if (cat && cod && desc) dados.itens.push({ categoria: cat, codigo: cod, descricao: desc.substring(0, 200), quantidade: qtd });
    });

    const btn = document.getElementById('btn-almox-enviar');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
    btn.disabled = true;

    try {
        // CORREÇÃO CRÍTICA: Totalmente integrado ao nosso apiService
        const data = await fetchPublico('/almoxarifado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (data.success) {
            document.getElementById('conteudo-modal-base').innerHTML = `
                <div class="modal-body text-center py-5 animate__animated animate__fadeIn">
                    <i class="fas fa-box-open text-success mb-4" style="font-size: 5rem;"></i>
                    <h4 class="fw-bold">Requisição Concluída!</h4>
                    <div class="bg-light p-3 mx-auto rounded-4 border my-4" style="max-width: 300px;">
                        <small class="text-muted fw-bold d-block">PROTOCOLO</small>
                        <span class="fw-bold text-success" style="font-size: 1.5rem;">${data.protocolo}</span>
                    </div>
                    <button type="button" class="btn btn-success px-5 rounded-pill" data-bs-dismiss="modal">Finalizar</button>
                </div>
            `;
        } else {
            Swal.fire('Erro', 'Falha no banco: ' + data.message, 'error');
            btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Enviar Requisição';
            btn.disabled = false;
        }
    } catch (error) {
        Swal.fire('Erro', 'Servidor inacessível.', 'error');
        btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Enviar Requisição';
        btn.disabled = false;
    }
}

// =========================================================================
// EXPORTANDO AS FUNÇÕES PARA O HTML
// =========================================================================
window.iniciarFluxoAlmoxarifado = iniciarFluxoAlmoxarifado;
window.montarModalAlmoxarifado = montarModalAlmoxarifado;
window.carregarCatalogoAlmox = carregarCatalogoAlmox;
window.adicionarLinhaAlmox = adicionarLinhaAlmox;
window.aoSelecionarCategoria = aoSelecionarCategoria;
window.aoSelecionarMaterial = aoSelecionarMaterial;
window.ajustarQtdAlmox = ajustarQtdAlmox;
window.removerLinhaAlmox = removerLinhaAlmox;
window.validarAlmoxarifado = validarAlmoxarifado;
window.enviarSolicitacaoAlmoxarifado = enviarSolicitacaoAlmoxarifado;