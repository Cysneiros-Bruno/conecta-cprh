/*
=====================================================
      MÓDULO DE SOLICITAÇÃO DE DIÁRIAS - CPRH
=====================================================
*/

const HTML_FORM_DIARIAS = `
    <div class="modal-header border-0">
        <h5 class="modal-title fw-bold text-success">
            <i class="fa-solid fa-file-invoice-dollar me-2"></i>Solicitação de Diárias
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
        <div id="diarias-form-section">
            <form id="form-diarias">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label small fw-bold text-muted">Solicitante</label>
                        <input type="text" id="nome-diarias" class="form-control bg-light form-control-sm" readonly>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label small fw-bold text-muted">E-mail</label>
                        <input type="email" id="email-diarias" class="form-control bg-light form-control-sm" readonly>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label small fw-bold">Motivo da Viagem *</label>
                    <textarea id="motivo-diarias" class="form-control form-control-sm" rows="2" placeholder="Ex: Fiscalização em Petrolina..." required></textarea>
                </div>

                <div class="mb-3 p-2 border-start border-success border-3 bg-light rounded-1 shadow-sm">
                    <label class="form-label small fw-bold text-success d-block mb-1">
                        <i class="fas fa-plane-departure me-1"></i> PARTIDA
                    </label>
                    <div class="row g-2">
                        <div class="col-7">
                            <label class="mb-0" style="font-size: 0.65rem; font-weight: bold; color: #666;">DATA</label>
                            <input type="date" id="data-partida" class="form-control form-control-sm" required>
                        </div>
                        <div class="col-5">
                            <label class="mb-0" style="font-size: 0.65rem; font-weight: bold; color: #666;">HORA</label>
                            <input type="time" id="hora-partida" class="form-control form-control-sm" required>
                        </div>
                    </div>
                </div>

                <div class="mb-3 p-2 border-start border-danger border-3 bg-light rounded-1 shadow-sm">
                    <label class="form-label small fw-bold text-danger d-block mb-1">
                        <i class="fas fa-plane-arrival me-1"></i> RETORNO
                    </label>
                    <div class="row g-2">
                        <div class="col-7">
                            <label class="mb-0" style="font-size: 0.65rem; font-weight: bold; color: #666;">DATA</label>
                            <input type="date" id="data-retorno" class="form-control form-control-sm" required disabled>
                        </div>
                        <div class="col-5">
                            <label class="mb-0" style="font-size: 0.65rem; font-weight: bold; color: #666;">HORA</label>
                            <input type="time" id="hora-retorno" class="form-control form-control-sm" required disabled>
                        </div>
                    </div>
                </div>

                <div id="info-tempo-viagem" class="alert alert-success border-0 py-2 d-none text-center mb-0" style="font-size: 0.8rem;">
                    <i class="fas fa-clock me-1"></i> Duração estimada: <strong id="tempo-total-texto">0h</strong>
                </div>

                <div id="alerta-data" class="text-danger small d-none mt-2 text-center">
                    <i class="fas fa-exclamation-triangle me-1"></i> A volta não pode ser antes da ida!
                </div>
            </form>
        </div>

        <div id="diarias-success-section" class="d-none text-center py-4 animate__animated animate__fadeIn">
            <div class="mb-3">
                <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
            </div>
            <h4 class="fw-bold text-dark">Solicitação Enviada!</h4>
            <p class="text-muted small">Sua demanda foi enviada para o Setor Financeiro.</p>
            
            <div class="bg-light p-3 rounded-4 border mb-3">
                <span class="d-block small text-muted text-uppercase fw-bold" style="letter-spacing: 1px;">Protocolo</span>
                <h3 class="fw-bold text-success m-0" id="protocolo-diaria-gerado">---</h3>
            </div>
            
            <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-4" data-bs-dismiss="modal">
                Finalizar
            </button>
        </div>
    </div>

    <div class="modal-footer border-0 justify-content-center pb-4" id="diarias-footer">
        <div id="container-btn-diarias" class="d-none w-100 text-center">
            <button type="button" class="btn btn-success px-5 rounded-pill fw-bold shadow-sm" onclick="enviarDiarias()">
                <i class="fas fa-paper-plane me-2"></i>Confirmar Solicitação
            </button>
        </div>
    </div>
`;

function montarModalDiarias(dadosUsuario) {
    const container = document.getElementById('content-modal-diarias');
    if (!container) return;
    container.innerHTML = HTML_FORM_DIARIAS;

    document.getElementById('nome-diarias').value = dadosUsuario.nome;
    document.getElementById('email-diarias').value = dadosUsuario.email;

    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('data-partida').setAttribute('min', hoje);

    inicializarLogicaDiarias();
}

function inicializarLogicaDiarias() {
    const inputPartida = document.getElementById('data-partida');
    const inputRetorno = document.getElementById('data-retorno');
    const form = document.getElementById('form-diarias');

    inputPartida.addEventListener('change', () => {
        if (inputPartida.value) {
            inputRetorno.disabled = false;
            document.getElementById('hora-retorno').disabled = false;
            inputRetorno.setAttribute('min', inputPartida.value);
        }
        validarBotaoDiarias();
    });

    form.addEventListener('input', validarBotaoDiarias);
}

function validarBotaoDiarias() {
    const motivo = document.getElementById('motivo-diarias').value.trim();
    const d1 = document.getElementById('data-partida').value;
    const h1 = document.getElementById('hora-partida').value;
    const d2 = document.getElementById('data-retorno').value;
    const h2 = document.getElementById('hora-retorno').value;
    
    const alerta = document.getElementById('alerta-data');
    const infoTempo = document.getElementById('info-tempo-viagem');
    const textoTempo = document.getElementById('tempo-total-texto');
    const btnContainer = document.getElementById('container-btn-diarias');

    let isValid = false;

    if (d1 && h1 && d2 && h2) {
        const dataInicio = new Date(`${d1}T${h1}`);
        const dataFim = new Date(`${d2}T${h2}`);

        if (dataFim > dataInicio) {
            alerta.classList.add('d-none');
            const diffMs = dataFim - dataInicio;
            const diffHorasTotal = diffMs / (1000 * 60 * 60);
            const dias = Math.floor(diffHorasTotal / 24);
            const horas = Math.floor(diffHorasTotal % 24);

            let resumo = dias > 0 ? `${dias} dia(s) e ${horas} hora(s)` : `${horas} hora(s)`;
            textoTempo.textContent = resumo;
            infoTempo.classList.remove('d-none');
            
            if (motivo !== "") isValid = true;
        } else {
            alerta.classList.remove('d-none');
            infoTempo.classList.add('d-none');
        }
    } else {
        infoTempo.classList.add('d-none');
    }

    btnContainer.classList.toggle('d-none', !isValid);
}

function enviarDiarias() {
    // CHAMA O GERADOR CENTRALIZADO
    // Toda a lógica de Ano, LocalStorage e 6 dígitos agora acontece dentro deste objeto
    const protocolo = GeradorProtocolo.gerar('DIARIAS');

    // EXIBE O PROTOCOLO NA TELA DE SUCESSO
    // Atribuímos o valor diretamente ao elemento
    const campoProtocolo = document.getElementById('protocolo-diaria-gerado');
    if (campoProtocolo) {
        campoProtocolo.textContent = protocolo;
    }

    // COLETA DE DADOS PARA LOG/BANCO (Opcional)
    const dadosParaEnvio = {
        protocolo: protocolo,
        solicitante: document.getElementById('nome-diarias').value,
        email: document.getElementById('email-diarias').value,
        motivo: document.getElementById('motivo-diarias').value,
        partida: `${document.getElementById('data-partida').value} ${document.getElementById('hora-partida').value}`,
        retorno: `${document.getElementById('data-retorno').value} ${document.getElementById('hora-retorno').value}`,
        duracao: document.getElementById('tempo-total-texto').textContent
    };

    // TRANSIÇÃO DE TELAS (Esconde formulário, mostra sucesso)
    // Usando as seções que definimos no HTML_FORM_DIARIAS
    const formSection = document.getElementById('diarias-form-section');
    const footerSection = document.getElementById('diarias-footer');
    const successSection = document.getElementById('diarias-success-section');

    if (formSection) formSection.classList.add('d-none');
    if (footerSection) footerSection.classList.add('d-none');
    if (successSection) {
        successSection.classList.remove('d-none');
        // Adiciona uma animação suave se você estiver usando Animate.css
        successSection.classList.add('animate__animated', 'animate__fadeIn');
    }

    console.log(`Solicitação ${protocolo} processada com sucesso:`, dadosParaEnvio);
}