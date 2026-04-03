/* ==========================================================
    LÓGICA DE REQUISIÇÃO DE VEÍCULOS
    Integrado com Autenticação Centralizada LDAP
========================================= */

/**
 * Ponto de entrada chamado pelo carrossel
 */
function iniciarFluxoVeiculos() {
    if (typeof solicitarAcesso === "function") {
        solicitarAcesso('Veiculos'); // Chama a portaria global
    } else {
        console.error("Erro: script_PortalAcesso.js não carregado.");
    }
}

/**
 * Monta o Modal de Veículos com dados validados
 * @param {Object} dadosUsuario - Contém {nome, email}
 */
function montarModalVeiculos(dadosUsuario) {
    const container = document.getElementById('content-modal-veiculos');
    if (!container) return;

    const nomeServidor = dadosUsuario.nome || "";
    const emailServidor = dadosUsuario.email || "";

    container.innerHTML = `
        <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold text-success">
                <i class="fas fa-car-side me-2"></i>Requisição de Veículo
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <form id="form-veiculos">
                
                <div class="bg-light p-3 rounded-3 mb-4 border shadow-sm">
                    <h6 class="text-success fw-bold mb-3 small text-uppercase border-bottom pb-2">
                        <i class="fas fa-user-shield me-2"></i>Identificação Validada
                    </h6>
                    <div class="col-12 mt-2 mb-3">
                        <div class="form-check form-switch bg-white p-2 rounded-3 border d-flex align-items-center justify-content-between shadow-sm">
                            <label class="form-check-label small fw-bold text-muted ms-5" for="veic-motorista">
                                <i class="fas fa-steering-wheel me-2"></i>Eu serei o motorista desta viagem
                            </label>
                            <input class="form-check-input me-2" type="checkbox" id="veic-motorista" onchange="ajustarCapacidadeERecalcular()">
                        </div>
                    </div>
                    <div class="row g-2">
                        <div class="col-md-7">
                            <label class="small text-muted fw-bold">Nome do Solicitante</label>
                            <input type="text" id="veic-solicitante" class="form-control form-control-sm bg-white fw-bold" 
                                   value="${nomeServidor}" readonly>
                        </div>
                        <div class="col-md-5">
                            <label class="small text-muted fw-bold">E-mail Corporativo</label>
                            <input type="text" id="veic-email" class="form-control form-control-sm bg-white fw-bold" 
                                   value="${emailServidor}" readonly>
                        </div>
                    </div>
                </div>

                <div class="px-2">
                    <p class="text-success fw-bold small mb-2"><i class="fas fa-arrow-right me-1"></i> Primeiro Trecho (Saída)</p>
                    <div class="row g-2 mb-3">
                        <div class="col-6"><label class="small text-muted fw-bold">Data saída *</label><input type="date" id="veic-data-1" class="form-control form-control-sm" required></div>
                        <div class="col-6"><label class="small text-muted fw-bold">Hora saída *</label><input type="time" id="veic-hora-1" class="form-control form-control-sm" required></div>
                        <div class="col-6"><label class="small text-muted fw-bold">Origem *</label><input type="text" id="veic-origem-1" class="form-control form-control-sm" placeholder="Local" required></div>
                        <div class="col-6"><label class="small text-muted fw-bold">Destino *</label><input type="text" id="veic-destino-1" class="form-control form-control-sm" placeholder="Local" required></div>
                    </div>

                    <hr class="my-3 opacity-25">

                    <p class="text-success fw-bold small mb-2"><i class="fas fa-undo me-1"></i> Segundo Trecho (Retorno)</p>
                    <div class="row g-2 mb-2">
                        <div class="col-6"><label class="small text-muted fw-bold">Data retorno *</label><input type="date" id="veic-data-2" class="form-control form-control-sm" required></div>
                        <div class="col-6"><label class="small text-muted fw-bold">Hora retorno *</label><input type="time" id="veic-hora-2" class="form-control form-control-sm" required></div>
                        <div class="col-6"><label class="small text-muted fw-bold">Origem *</label><input type="text" id="veic-origem-2" class="form-control form-control-sm" placeholder="Local" required></div>
                        <div class="col-6"><label class="small text-muted fw-bold">Destino *</label><input type="text" id="veic-destino-2" class="form-control form-control-sm" placeholder="Local" required></div>
                    </div>
                </div>

                <hr class="my-3 opacity-25">

                <div class="px-2">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <p class="text-success fw-bold small mb-0"><i class="fas fa-users me-1"></i> Passageiros Adicionais</p>
                        <button type="button" class="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold shadow-sm" onclick="adicionarPassageiro()">
                            <i class="fas fa-user-plus me-1"></i> Adicionar
                        </button>
                    </div>
                    <div id="container-passageiros" class="row g-2"></div>
                </div>
            </form>

            <div class="modal-footer border-0 d-none p-0 mt-4" id="container-footer-veiculos">
                <div class="d-flex flex-column w-100">
                    <div class="w-100 mb-3 text-start px-2">
                        <label class="form-label small fw-bold text-muted">Status / Tempo Estimado</label>
                        <input type="text" id="veic-tempo-total" class="form-control border-success bg-light fw-bold text-success shadow-none" readonly>
                    </div>
                    <div class="d-flex justify-content-end w-100 gap-2 pb-3 px-2">
                        <button type="button" id="btn-veic-corrigir" class="btn btn-danger px-4 rounded-pill fw-bold d-none" onclick="limparFormularioVeiculos()">
                            <i class="fas fa-eraser me-2"></i>Limpar
                        </button>
                        <button type="button" id="btn-veic-enviar" class="btn btn-success px-4 rounded-pill fw-bold d-none" onclick="enviarSolicitacaoVeiculo()">
                            <i class="fas fa-paper-plane me-2"></i>Enviar Requisição
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    configurarDatasMinimas();
    document.getElementById('form-veiculos').addEventListener('input', validarERecalcularVeiculos);
}

/* --- LÓGICA DE NEGÓCIO (PASSAGEIROS E VALIDAÇÃO) --- */

let contadorPassageiros = 0;

function adicionarPassageiro() {
    const container = document.getElementById('container-passageiros');
    const passageirosAtuais = container.querySelectorAll('.animate__animated').length;
    const souMotorista = document.getElementById('veic-motorista').checked;
    
    const limiteMax = souMotorista ? 4 : 3;
    if (passageirosAtuais >= limiteMax) return;

    contadorPassageiros++;
    const div = document.createElement('div');
    div.id = `pass-row-${contadorPassageiros}`;
    div.className = "col-12 animate__animated animate__fadeInDown mb-2";
    
    div.innerHTML = `
        <div class="bg-white border rounded-3 p-2 shadow-sm d-flex align-items-center gap-2">
            <div class="flex-grow-1">
                <input type="text" class="form-control form-control-sm border-0 bg-light pass-nome" 
                       placeholder="Nome do Passageiro" oninput="validarERecalcularVeiculos()">
            </div>
            <div style="width: 130px;">
                <input type="email" class="form-control form-control-sm border-0 bg-light pass-email" 
                       placeholder="E-mail corporativo" oninput="validarERecalcularVeiculos()">
            </div>
            <button type="button" class="btn btn-link text-danger p-0" onclick="removerPassageiro('${div.id}')">
                <i class="fas fa-user-minus"></i>
            </button>
        </div>
    `;
    container.appendChild(div);
    gerenciarEstadoBotaoAdicionar();
    validarERecalcularVeiculos();
}

function removerPassageiro(id) {
    const el = document.getElementById(id);
    if (el) {
        el.remove();
        gerenciarEstadoBotaoAdicionar();
        validarERecalcularVeiculos();
    }
}

function ajustarCapacidadeERecalcular() {
    const container = document.getElementById('container-passageiros');
    const passageiros = container.querySelectorAll('.animate__animated');
    const souMotorista = document.getElementById('veic-motorista').checked;
    
    if (!souMotorista && passageiros.length > 3) {
        passageiros[passageiros.length - 1].remove();
    }
    
    gerenciarEstadoBotaoAdicionar();
    validarERecalcularVeiculos();
}

function gerenciarEstadoBotaoAdicionar() {
    const passageirosAdicionais = document.querySelectorAll('.pass-nome').length;
    const souMotorista = document.getElementById('veic-motorista').checked;
    const btnAdd = document.querySelector('button[onclick="adicionarPassageiro()"]');
    
    const limiteMax = souMotorista ? 4 : 3;

    if (btnAdd) {
        if (passageirosAdicionais >= limiteMax) {
            btnAdd.classList.replace('btn-outline-success', 'btn-outline-secondary');
            btnAdd.disabled = true;
            btnAdd.innerHTML = `<i class="fas fa-users-slash me-1"></i> Limite (${limiteMax+1} Ocupantes)`;
        } else {
            btnAdd.classList.replace('btn-outline-secondary', 'btn-outline-success');
            btnAdd.disabled = false;
            btnAdd.innerHTML = '<i class="fas fa-user-plus me-1"></i> Adicionar';
        }
    }
}

function configurarDatasMinimas() {
    const hoje = new Date().toISOString().split('T')[0];
    ['veic-data-1', 'veic-data-2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('min', hoje);
    });
}

function validarERecalcularVeiculos() {
    const idsFixo = ['veic-data-1', 'veic-hora-1', 'veic-origem-1', 'veic-destino-1', 'veic-data-2', 'veic-hora-2', 'veic-origem-2', 'veic-destino-2'];
    const campos = idsFixo.map(id => document.getElementById(id));
    const footer = document.getElementById('container-footer-veiculos');
    const campoStatus = document.getElementById('veic-tempo-total');

    const emailSolicitante = document.getElementById('veic-email').value.trim().toLowerCase();
    const passageirosNomes = document.querySelectorAll('.pass-nome');
    const passageirosEmails = document.querySelectorAll('.pass-email');
    
    let erroPassageiro = false;
    let erroDuplicado = false;

    // Validação de Passageiros Adicionais
    passageirosNomes.forEach((input, index) => {
        const nomeP = input.value.trim();
        const emailP = passageirosEmails[index].value.trim().toLowerCase();
        
        if (!nomeP || !emailP) erroPassageiro = true;
        else if (emailP === emailSolicitante) erroDuplicado = true;
    });

    const algumPreenchido = campos.some(c => c && c.value.trim() !== "") || passageirosNomes.length > 0;
    footer.classList.toggle('d-none', !algumPreenchido);

    const vazios = campos.filter(c => c && c.value.trim() === "");

    if (vazios.length > 0) {
        campoStatus.value = "ERRO: Faltam campos obrigatórios (*)";
        toggleBotoesVeiculo(false);
    } else if (erroPassageiro) {
        campoStatus.value = "ERRO: Preencha os dados dos passageiros";
        toggleBotoesVeiculo(false);
    } else if (erroDuplicado) {
        campoStatus.value = "ERRO: O solicitante já está na lista";
        toggleBotoesVeiculo(false);
    } else {
        // Lógica de datas e horas
        const inicio = new Date(`${campos[0].value}T${campos[1].value}`);
        const fim = new Date(`${campos[4].value}T${campos[5].value}`);
        const agora = new Date();

        if (inicio < agora) {
            campoStatus.value = "ERRO: Horário de saída inválido";
            toggleBotoesVeiculo(false);
        } else if (fim <= inicio) {
            campoStatus.value = "ERRO: Retorno deve ser após a saída";
            toggleBotoesVeiculo(false);
        } else {
            const diffMin = Math.floor((fim - inicio) / 60000);
            const h = Math.floor(diffMin / 60);
            const m = diffMin % 60;
            const totalOcupantes = 1 + passageirosNomes.length;
            const msgMot = document.getElementById('veic-motorista').checked ? " (Você dirige)" : " (+ Motorista)";

            campoStatus.value = `ESTIMADO: ${h}h ${m}min | ${totalOcupantes} Ocupantes${msgMot}`;
            toggleBotoesVeiculo(true);
        }
    }
}

function toggleBotoesVeiculo(valido) {
    const status = document.getElementById('veic-tempo-total');
    status.classList.toggle('text-danger', !valido);
    status.classList.toggle('text-success', valido);
    document.getElementById('btn-veic-enviar').classList.toggle('d-none', !valido);
    document.getElementById('btn-veic-corrigir').classList.toggle('d-none', valido);
}

function enviarSolicitacaoVeiculo() {
    const protocolo = `VEIC-${Math.floor(1000 + Math.random() * 9000)}`;
    const container = document.getElementById('content-modal-veiculos');
    
    container.innerHTML = `
        <div class="modal-body text-center py-5 animate__animated animate__bounceIn">
            <i class="fas fa-check-circle text-success mb-4" style="font-size: 5rem;"></i>
            <h4 class="fw-bold">Requisição Enviada!</h4>
            <p class="text-muted">Sua solicitação de veículo foi encaminhada para aprovação.</p>
            <div class="bg-light mx-5 p-3 rounded-3 mb-4 border shadow-sm">
                <small class="text-muted d-block fw-bold">PROTOCOLO</small>
                <span class="fw-bold text-success" style="font-size: 1.2rem;">#${protocolo}</span>
            </div>
            <button type="button" class="btn btn-success rounded-pill px-5 fw-bold shadow" data-bs-dismiss="modal">Entendido</button>
        </div>
    `;
}

function limparFormularioVeiculos() {
    document.getElementById('form-veiculos').reset();
    document.getElementById('container-passageiros').innerHTML = "";
    document.getElementById('container-footer-veiculos').classList.add('d-none');
}