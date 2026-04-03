/*
=====================================================
    FORMULÁRIO PARA ABERTURA DE CHAMADOS DE TI
=====================================================
*/
const HTML_FORM_TI = `
    <div class="modal-header border-0">
        <h5 class="modal-title fw-bold text-success"><i class="fas fa-headset me-2"></i>Suporte TI</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body" style="min-height: 300px;">
        <div id="ti-form-section">
            <form id="form-ti">
                <div class="mb-3">
                    <label class="form-label small fw-bold text-muted">Nome (Opcional)</label>
                    <input type="text" 
                    id="nome-ti" 
                    class="form-control rounded-3" 
                    placeholder="Seu nome">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">E-mail para Contato *</label>
                    <input type="email" 
                    id="email-ti" 
                    class="form-control rounded-3" 
                    placeholder="email@cprh.pe.gov.br"
                    required>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">Setor *</label>
                    <input type="text" 
                        id="setor-ti" 
                        class="form-control rounded-3" 
                        placeholder="Ex: NTIC" 
                        input type="text" 
                        required>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-bold">Descrição *</label>
                    <textarea id="problema-ti" class="form-control rounded-3" rows="3" maxlength="300" placeholder="O que está acontecendo?" required></textarea>
                    <div id="char-count" class="form-text text-end small">0 / 300</div>
                </div>
            </form>
        </div>
        <div id="ti-success-section" class="d-none text-center py-4">
            <i class="fas fa-check-circle text-success display-1 mb-3"></i>
            <h4 class="fw-bold text-success">Enviado!</h4>
            <p class="text-muted">Recebemos seu chamado.</p>
        </div>
    </div>
    <div class="modal-footer border-0 justify-content-center pb-4" id="ti-footer">
        <div id="container-btn-enviar" class="d-none w-100 text-center">
            <button type="button" class="btn btn-success px-5 rounded-pill fw-bold" onclick="enviarSolicitacaoTI()">
                Enviar Solicitação
            </button>
        </div>
    </div>
`;

function montarModalTI() {
    const container = document.getElementById('content-modal-ti');
    if (container) {
        container.innerHTML = HTML_FORM_TI;
        inicializarSuporteTI(); 
    }

    const modalElement = document.getElementById('modalTI'); 
    if (modalElement) {
        // CORREÇÃO: Remove instância anterior para evitar conflitos de abertura
        const modalExistente = bootstrap.Modal.getInstance(modalElement);
        if (modalExistente) {
            modalExistente.dispose();
        }

        // Criando e exibindo a nova instância
        const meuModal = new bootstrap.Modal(modalElement);
        meuModal.show();
    } else {
        console.error("O elemento #modalTI não foi encontrado no DOM.");
    }
}

/*
==============================================
          LÓGICA DE SUPORTE T.I.
==============================================
 */
const CONFIG_TI = {
    whatsapp: "5581994883045",
    charLimit: 300
};

function inicializarSuporteTI() {
    const form = document.getElementById('form-ti');
    const inputProblema = document.getElementById('problema-ti');
    
    if (!form || !inputProblema) return;

    form.addEventListener('input', () => {
        const email = document.getElementById('email-ti').value.trim();
        const setor = document.getElementById('setor-ti').value.trim();
        const problema = inputProblema.value.trim();
        const btnContainer = document.getElementById('container-btn-enviar');
        const charCount = document.getElementById('char-count');

        charCount.textContent = `${inputProblema.value.length} / ${CONFIG_TI.charLimit}`;

        const isValid = email !== "" && setor !== "" && problema !== "";
        btnContainer.classList.toggle('d-none', !isValid);
    });
}

function enviarSolicitacaoTI() {
    const nomeInput = document.getElementById('nome-ti').value;
    const emailInput = document.getElementById('email-ti').value;
    const setorInput = document.getElementById('setor-ti').value;
    const problemaInput = document.getElementById('problema-ti').value;

    const textoMensagem = encodeURIComponent(
        `*Solicitação de Suporte TI*\n` +
        `----------------------------------\n` +
        `*Nome:* ${nomeInput || "Não informado"}\n` +
        `*E-mail:* ${emailInput}\n` +
        `*Setor:* ${setorInput}\n` +
        `*Descrição:* ${problemaInput}`
    );

    window.open(`https://api.whatsapp.com/send?phone=${CONFIG_TI.whatsapp}&text=${textoMensagem}`, '_blank');

    alternarSecaoSucesso(true);

    setTimeout(() => {
        const modalEl = document.getElementById('modalTI');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        setTimeout(() => {
            const form = document.getElementById('form-ti');
            if(form) form.reset();
            
            const charCount = document.getElementById('char-count');
            if(charCount) charCount.textContent = `0 / ${CONFIG_TI.charLimit}`;
            
            alternarSecaoSucesso(false);
            
            const btn = document.getElementById('container-btn-enviar');
            if(btn) btn.classList.add('d-none');
        }, 500);
    }, 3000);
}

function alternarSecaoSucesso(sucesso) {
    const formSec = document.getElementById('ti-form-section');
    const footerSec = document.getElementById('ti-footer');
    const successSec = document.getElementById('ti-success-section');

    if(formSec) formSec.classList.toggle('d-none', sucesso);
    if(footerSec) footerSec.classList.toggle('d-none', sucesso);
    if(successSec) successSec.classList.toggle('d-none', !sucesso);
}

document.addEventListener('DOMContentLoaded', inicializarSuporteTI);