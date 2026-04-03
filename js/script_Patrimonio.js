/*
==============================================
      MÓDULO DE CONTROLE DE PATRIMÔNIO 
==============================================
*/

const HTML_FORM_PATRIMONIO = `
    <div class="modal-header border-0">
        <h5 class="modal-title fw-bold text-success">
            <i class="fas fa-barcode me-2"></i>Movimentação de Patrimônio
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
        <div id="patrimonio-form-section">
            <form id="form-patrimonio">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label small fw-bold text-muted">Solicitante</label>
                        <input type="text" id="nome-patri" class="form-control bg-light form-control-sm" readonly>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label small fw-bold text-muted">E-mail</label>
                        <input type="email" id="email-patri" class="form-control bg-light form-control-sm" readonly>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label small fw-bold">Nº de Tombamento (Etiqueta) *</label>
                    <input type="text" id="patri-tombamento" class="form-control form-control-sm" placeholder="Ex: 123456" required>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label small fw-bold">Local de Origem *</label>
                        <select id="patri-origem" class="form-select form-select-sm" required>
                            <option value="">Selecione...</option>
                            <option value="Sede - Recife">Sede - Recife</option>
                            <option value="Unidade Regional">Unidade Regional</option>
                            <option value="Arcos do Poço">Arcos do Poço</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label small fw-bold">Setor de Destino *</label>
                        <input type="text" id="patri-destino" class="form-control form-control-sm" placeholder="Ex: Financeiro / RH" required>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label small fw-bold">Descrição do Item *</label>
                    <textarea id="patri-descricao" class="form-control form-control-sm" rows="2" placeholder="Ex: Monitor Dell 24 polegadas, Cadeira Giratória..." required></textarea>
                </div>

                <div class="alert alert-info border-0 py-2 mb-0 shadow-sm" style="font-size: 0.75rem;">
                    <i class="fas fa-info-circle me-1"></i> Certifique-se de que a etiqueta de patrimônio esteja visível no item.
                </div>
            </form>
        </div>

        <div id="patrimonio-success-section" class="d-none text-center py-4 animate__animated animate__fadeIn">
            <div class="mb-3">
                <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
            </div>
            <h4 class="fw-bold text-dark">Movimentação Registrada!</h4>
            <p class="text-muted small">O registro foi enviado ao Setor de Patrimônio para atualização.</p>
            
            <div class="bg-light p-3 rounded-4 border mb-3">
                <span class="d-block small text-muted text-uppercase fw-bold" style="letter-spacing: 1px;">Protocolo</span>
                <h3 class="fw-bold text-success m-0" id="protocolo-patri-gerado">---</h3>
            </div>
            
            <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-4" data-bs-dismiss="modal">
                Finalizar
            </button>
        </div>
    </div>

    <div class="modal-footer border-0 justify-content-center pb-4" id="patrimonio-footer">
        <div id="container-btn-patri" class="d-none w-100 text-center">
            <button type="button" class="btn btn-success px-5 rounded-pill fw-bold shadow-sm" onclick="enviarPatrimonio()">
                <i class="fas fa-barcode me-2"></i>Confirmar Movimentação
            </button>
        </div>
    </div>
`;

/**
 * Função principal chamada pelo Portal de Acesso
 */
function montarModalPatrimonio(dadosUsuario) {
    const container = document.getElementById('content-modal-patrimonio');
    if (!container) return;
    
    container.innerHTML = HTML_FORM_PATRIMONIO;

    // Preenche dados do LDAP
    document.getElementById('nome-patri').value = dadosUsuario.nome;
    document.getElementById('email-patri').value = dadosUsuario.email;

    inicializarLogicaPatrimonio();
}

/**
 * Gerencia a ativação do botão apenas quando campos obrigatórios estão preenchidos
 */
function inicializarLogicaPatrimonio() {
    const form = document.getElementById('form-patrimonio');
    const btnContainer = document.getElementById('container-btn-patri');
    
    // Escuta qualquer digitação no formulário para validar o botão
    form.addEventListener('input', () => {
        const tombamento = document.getElementById('patri-tombamento').value.trim();
        const origem = document.getElementById('patri-origem').value;
        const destino = document.getElementById('patri-destino').value.trim();
        const descricao = document.getElementById('patri-descricao').value.trim();
        
        // Validação: Todos os campos devem ter conteúdo
        const isValid = (tombamento !== "" && origem !== "" && destino !== "" && descricao !== "");
        
        // Mostra ou esconde o botão de confirmação
        if (isValid) {
            btnContainer.classList.remove('d-none');
        } else {
            btnContainer.classList.add('d-none');
        }
    });
}

/**
 * Processa o envio, gera protocolo e alterna telas
 */
function enviarPatrimonio() {
    // Gera o protocolo usando o padrão centralizado
    const protocolo = GeradorProtocolo.gerar('PATRIMONIO');

    // Exibe o protocolo na tela de sucesso
    const campoProtocolo = document.getElementById('protocolo-patri-gerado');
    if (campoProtocolo) {
        campoProtocolo.textContent = protocolo;
    }

    // Coleta de dados (preparado para futura integração com banco/e-mail)
    const dadosParaEnvio = {
        protocolo: protocolo,
        solicitante: document.getElementById('nome-patri').value,
        tombamento: document.getElementById('patri-tombamento').value,
        origem: document.getElementById('patri-origem').value,
        destino: document.getElementById('patri-destino').value,
        descricao: document.getElementById('patri-descricao').value
    };

    // Transição de telas
    const formSection = document.getElementById('patrimonio-form-section');
    const footerSection = document.getElementById('patrimonio-footer');
    const successSection = document.getElementById('patrimonio-success-section');

    if (formSection) formSection.classList.add('d-none');
    if (footerSection) footerSection.classList.add('d-none');
    
    if (successSection) {
        successSection.classList.remove('d-none');
        successSection.classList.add('animate__animated', 'animate__fadeIn');
    }

    console.log(`Sucesso! Protocolo Patrimônio: ${protocolo}`, dadosParaEnvio);
}