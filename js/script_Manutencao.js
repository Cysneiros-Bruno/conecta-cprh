/* ==========================================================
    LÓGICA DE MANUTENÇÃO (PREDIAL / ELÉTRICA / HIDRÁULICA)
        Integrado com Autenticação Centralizada LDAP
========================================================== */

/**
 * Função chamada pelo clique no carrossel.
 * Agora utiliza o interceptor de segurança global.
 */
function iniciarFluxoManutencao() {
    // Chama a função global de script_PortalAcesso.js
    // 'Manutencao' deve ser exatamente o nome tratado no switch do abridor
    if (typeof solicitarAcesso === "function") {
        solicitarAcesso('Manutencao');
    } else {
        console.error("Erro: script_PortalAcesso.js não carregado.");
    }
}

/**
 * Monta a estrutura do Modal de Manutenção com dados do LDAP
 * @param {Object} dadosUsuario - Contém {nome, email}
 */
function montarModalManutencao(dadosUsuario) {
    const container = document.getElementById('content-modal-manutencao');
    if (!container) return;

    const nomeServidor = dadosUsuario.nome || "";
    const emailServidor = dadosUsuario.email || "";

    container.innerHTML = `
        <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold text-success">
                <i class="fas fa-screwdriver-wrench me-2"></i>Abertura de Chamado - Manutenção
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <form id="form-manutencao">
                <div class="bg-light p-3 rounded-3 mb-4 border shadow-sm">
                    <h6 class="text-success fw-bold mb-3 small text-uppercase border-bottom pb-2">
                        <i class="fas fa-user-shield me-2"></i>Identificação Validada
                    </h6>
                    <div class="row g-2">
                        <div class="col-md-7">
                            <label class="small text-muted fw-bold">Nome do Solicitante</label>
                            <input type="text" id="manut-nome" class="form-control form-control-sm bg-white fw-bold" 
                                   value="${nomeServidor}" readonly>
                        </div>
                        <div class="col-md-5">
                            <label class="small text-muted fw-bold">E-mail Corporativo</label>
                            <input type="text" id="manut-email" class="form-control form-control-sm bg-white fw-bold" 
                                   value="${emailServidor}" readonly>
                        </div>
                        <div class="col-md-12">
                            <label class="small text-muted fw-bold">Setor / Localização Exata *</label>
                            <input type="text" id="manut-local" class="form-control form-control-sm" 
                                   placeholder="Ex: Bloco A - Sala 04 (Protocolo)" required>
                        </div>
                    </div>
                </div>

                <div class="px-2">
                    <h6 class="text-success fw-bold mb-3 small text-uppercase border-bottom pb-2">
                        <i class="fas fa-clipboard-list me-2"></i>Detalhes da Ocorrência
                    </h6>
                    <div class="row g-3">
                        <div class="col-md-12">
                            <label class="small text-muted fw-bold">Tipo de Reparo *</label>
                            <select class="form-select form-select-sm border-0 bg-light rounded-3" id="manut-tipo" required>
                                <option value="" selected disabled>Selecione uma categoria...</option>
                                <option value="Ar-condicionado">Ar-condicionado</option>
                                <option value="Elétrica">Elétrica (Lâmpadas/Tomadas)</option>
                                <option value="Hidráulica">Hidráulica (Vazamentos/Banheiros)</option>
                                <option value="Civil">Civil (Pintura/Portas/Chaves)</option>
                                <option value="Mobiliário">Mobiliário (Cadeiras/Mesas)</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>

                        <div class="col-md-12">
                            <label class="small text-muted fw-bold">Descrição do Problema *</label>
                            <textarea class="form-control form-control-sm border-0 bg-light rounded-3" 
                                      id="manut-descricao" rows="4" 
                                      placeholder="Descreva detalhadamente o defeito ou solicitação..." required></textarea>
                        </div>

                        <div class="col-md-12 mt-3">
                            <label class="small text-muted fw-bold mb-2 d-block">
                                <i class="fas fa-camera me-1 text-success"></i> Anexar foto do problema (Opcional)
                            </label>
                            
                            <div class="input-group mb-2 shadow-sm">
                                <input type="text" id="manut-nome-arquivo" 
                                    class="form-control form-control-sm border-0 bg-light" 
                                    placeholder="Nenhum arquivo selecionado" readonly style="font-size: 0.8rem;">
                                
                                <button class="btn btn-light border-0 text-danger d-none" type="button" id="btn-remover-arquivo" 
                                        onclick="removerArquivoManutencao()" title="Remover arquivo">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>

                            <div class="d-flex align-items-center gap-3">
                                <label for="manut-imagem" class="btn btn-success btn-sm rounded-pill px-4 fw-bold shadow-sm mb-0" style="cursor: pointer;">
                                    <i class="fas fa-upload me-2"></i>Escolher Arquivo
                                </label>
                                <input type="file" id="manut-imagem" accept=".jpg, .jpeg, .png" 
                                       onchange="validarArquivoManutencao(this)" class="d-none">

                                <div class="d-flex flex-column justify-content-center" style="line-height: 1.2;">
                                    <span class="text-success fw-bold" style="font-size: 0.7rem;">Formatos: .jpg, .jpeg, .png</span>
                                    <span class="text-muted" style="font-size: 0.65rem;">Máx 300 Kb</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>

        <div class="modal-footer border-0 d-none p-0 mt-4" id="container-footer-manut">
            <div class="d-flex flex-column w-100 px-3 pb-4">
                <div class="w-100 mb-3">
                    <label class="form-label small fw-bold text-muted">Status</label>
                    <input type="text" id="manut-status-footer" class="form-control border-success bg-light fw-bold text-success shadow-none" readonly>
                </div>
                <div class="d-flex justify-content-end gap-2">
                    <button type="button" id="btn-manut-corrigir" class="btn btn-danger px-4 rounded-pill fw-bold d-none" onclick="limparFormularioManutencao()">
                        <i class="fas fa-eraser me-2"></i>Limpar
                    </button>
                    <button type="button" id="btn-manut-enviar" class="btn btn-success px-4 rounded-pill fw-bold d-none" onclick="enviarChamadoManutencao()">
                        <i class="fas fa-paper-plane me-2"></i>Enviar Chamado
                    </button>
                </div>
            </div>
        </div>
    `;

    // Reatribui o ouvinte de entrada para validação
    document.getElementById('form-manutencao').addEventListener('input', validarManutencao);
}

/* --- FUNÇÕES DE APOIO --- */

function validarArquivoManutencao(input) {
    const campoNome = document.getElementById('manut-nome-arquivo');
    const btnLixeira = document.getElementById('btn-remover-arquivo');
    const arquivo = input.files[0];
    
    if (!arquivo) return removerArquivoManutencao();

    const extensaoOk = ['image/jpeg', 'image/jpg', 'image/png'].includes(arquivo.type);
    const tamanhoOk = arquivo.size <= 300 * 1024; 

    if (btnLixeira) btnLixeira.classList.remove('d-none');

    if (!extensaoOk || !tamanhoOk) {
        campoNome.value = "Arquivo inválido ou muito grande!";
        campoNome.classList.add('text-danger', 'border', 'border-danger');
        input.value = ""; 
    } else {
        campoNome.classList.remove('text-danger', 'border', 'border-danger');
        campoNome.classList.add('text-success', 'fw-bold');
        campoNome.value = arquivo.name;
    }
    validarManutencao();
}

function removerArquivoManutencao() {
    const input = document.getElementById('manut-imagem');
    const campoNome = document.getElementById('manut-nome-arquivo');
    if (input) input.value = "";
    if (campoNome) {
        campoNome.value = "";
        campoNome.classList.remove('text-success', 'text-danger', 'fw-bold', 'border-danger');
    }
    document.getElementById('btn-remover-arquivo')?.classList.add('d-none');
    validarManutencao();
}

function validarManutencao() {
    const ids = ['manut-local', 'manut-tipo', 'manut-descricao'];
    const campos = ids.map(id => document.getElementById(id));
    const footer = document.getElementById('container-footer-manut');
    const campoStatus = document.getElementById('manut-status-footer');

    const algumPreenchido = campos.some(c => c && c.value.trim() !== "");
    footer.classList.toggle('d-none', !algumPreenchido);
    
    const todosPreenchidos = campos.every(c => c && c.value.trim() !== "");

    if (!todosPreenchidos) {
        campoStatus.value = "Aguardando preenchimento obrigatório...";
        campoStatus.classList.remove('text-success');
        campoStatus.classList.add('text-danger');
        toggleBotoesManut(false);
    } else {
        campoStatus.value = "PRONTO PARA ENVIAR";
        campoStatus.classList.remove('text-danger');
        campoStatus.classList.add('text-success');
        toggleBotoesManut(true);
    }
}

function toggleBotoesManut(valido) {
    document.getElementById('btn-manut-enviar').classList.toggle('d-none', !valido);
    document.getElementById('btn-manut-corrigir').classList.toggle('d-none', valido);
}

function limparFormularioManutencao() {
    document.getElementById('form-manutencao').reset();
    removerArquivoManutencao();
    document.getElementById('container-footer-manut').classList.add('d-none');
}

/*
=============================================================
    Envio final da solicitação com protocolo sequencial
=============================================================
 */
function enviarChamadoManutencao() {
    // CHAMA O GERADOR CENTRALIZADO (Padrão: MANUT-2026.000001)
    const protocoloManut = GeradorProtocolo.gerar('MANUTENCAO');

    // COLETA OS DADOS (Útil para o console ou futura integração com banco)
    const dados = {
        nome: document.getElementById('manut-nome').value,
        email: document.getElementById('manut-email').value,
        local: document.getElementById('manut-local').value,
        tipo: document.getElementById('manut-tipo').value,
        descricao: document.getElementById('manut-descricao').value,
        protocolo: protocoloManut
    };

    console.log("Enviando chamado de manutenção:", dados);

    // SELECIONA O CONTAINER DO MODAL
    const container = document.getElementById('content-modal-manutencao');
    if (!container) return;

    // RENDERIZA A TELA DE SUCESSO PADRONIZADA (Identidade Visual CPRH)
    container.innerHTML = `
        <div class="modal-body text-center py-5 animate__animated animate__fadeIn">
            <i class="fas fa-screwdriver-wrench text-success mb-4" style="font-size: 5rem;"></i>
            
            <h4 class="fw-bold text-dark">Solicitação Enviada!</h4>
            <p class="text-muted px-4 small">
                A equipe de manutenção da CPRH foi notificada e analisará o seu chamado em breve.
            </p>
            
            <div class="bg-light mx-auto p-3 rounded-4 border shadow-sm mb-4" style="max-width: 300px;">
                <small class="text-muted d-block fw-bold" style="letter-spacing: 1px; font-size: 0.7rem;">PROTOCOLO</small>
                <span class="fw-bold text-success" style="font-size: 1.5rem;">${dados.protocolo}</span>
            </div>
            
            <button type="button" class="btn btn-success rounded-pill px-5 fw-bold shadow-sm" data-bs-dismiss="modal">
                Finalizar
            </button>
        </div>
    `;
}