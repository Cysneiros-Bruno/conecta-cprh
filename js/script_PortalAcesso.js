/* ==========================================================
    CONTROLE DE SESSÃO E PORTARIA DE ACESSO (LDAP)
    Responsável por validar usuários e injetar dados nos módulos
   ========================================================== */

// Armazena Nome e E-mail em memória (limpa ao fechar aba ou F5)
let sessaoAtiva = null; 

/**
 * Função principal chamada pelos botões do Carrossel/Menu
 * @param {string} moduloId - ID do modal (Manutencao, Veiculos ou Almoxarifado)
 */
function solicitarAcesso(moduloId) {
    // 1. Se já existe uma sessão ativa nesta aba, abre o formulário direto
    if (sessaoAtiva) {
        console.log(`Sessão ativa para: ${sessaoAtiva.nome}. Acessando ${moduloId}...`);
        abrirFormularioDestino(moduloId, sessaoAtiva);
        return;
    }

    // 2. Se não houver sessão, prepara e abre o Modal de Login
    const inputDestino = document.getElementById('destino-apos-login');
    if (inputDestino) {
        inputDestino.value = moduloId;
    }

    const modalLoginEl = document.getElementById('modalLoginAcesso');
    if (modalLoginEl) {
        const modalLogin = new bootstrap.Modal(modalLoginEl);
        modalLogin.show();
    } else {
        console.error("Erro: Estrutura HTML do modalLoginAcesso não encontrada.");
    }
}

/**
 * Processa a autenticação via API Node.js/LDAP
 */
async function processarLoginPortal() {
    const userField = document.getElementById('login-user');
    const passField = document.getElementById('login-pass');
    const destino = document.getElementById('destino-apos-login').value;
    const btn = document.getElementById('btn-executar-login');

    const usuario = userField.value.trim();
    const senha = passField.value.trim();

    if (!usuario || !senha) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos Obrigatórios',
            text: 'Por favor, informe seu usuário de rede e senha corporativa.',
            confirmButtonColor: '#198754'
        });
        return;
    }

    // Feedback visual de carregamento
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Validando Credenciais...';

    try {
        // Altere 'localhost' para o IP do seu servidor Ubuntu em produção
        const response = await fetch('http://10.0.1.70:3000/api/login-ldap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });

        const dados = await response.json();

        if (dados.success) {
            // Salva os dados retornados do LDAP (Nome completo e E-mail)
            sessaoAtiva = {
                nome: dados.nome,
                email: dados.email
            };

            // Fecha o modal de login
            const modalLoginEl = document.getElementById('modalLoginAcesso');
            const instanciaModal = bootstrap.Modal.getInstance(modalLoginEl);
            if (instanciaModal) instanciaModal.hide();

            // Limpa o campo de senha por segurança
            passField.value = "";

            // Sucesso! Encaminha para o formulário desejado
            abrirFormularioDestino(destino, sessaoAtiva);

        } else {
            Swal.fire({
                icon: 'error',
                title: 'Falha na Autenticação',
                text: dados.message || 'Usuário ou senha incorretos. Tente novamente.',
                confirmButtonColor: '#d33'
            });
            passField.value = ""; // Limpa senha em caso de erro
        }
    } catch (error) {
        console.error("Erro na requisição LDAP:", error);
        Swal.fire({
            icon: 'error',
            title: 'Servidor Indisponível',
            text: 'Não foi possível conectar ao serviço de autenticação. Verifique se o servidor Node.js está rodando.',
            confirmButtonColor: '#d33'
        });
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar e Acessar';
    }
}

/**
 * Encaminha os dados para o script específico e abre o modal correspondente
 * @param {string} moduloId 
 * @param {Object} dadosUsuario 
 */
function abrirFormularioDestino(moduloId, dadosUsuario) {
    try {
        switch (moduloId) {
            case 'Manutencao':
                if (typeof montarModalManutencao === "function") {
                    montarModalManutencao(dadosUsuario);
                    new bootstrap.Modal(document.getElementById('modalManutencao')).show();
                }
                break;

            case 'Veiculos':
                if (typeof montarModalVeiculos === "function") {
                    montarModalVeiculos(dadosUsuario);
                    new bootstrap.Modal(document.getElementById('modalVeiculos')).show();
                }
                break;

            case 'Almoxarifado':
                if (typeof montarModalAlmoxarifado === "function") {
                    montarModalAlmoxarifado(dadosUsuario);
                    new bootstrap.Modal(document.getElementById('modalAlmoxarifado')).show();
                }
                break;

            case 'Patrimonio':
                if (typeof montarModalPatrimonio === "function") {
                    montarModalPatrimonio(dadosUsuario);
                    new bootstrap.Modal(document.getElementById('modalPatrimonio')).show();
                }
                break;
                
            case 'Diarias':
                if (typeof montarModalDiarias === "function") {
                    montarModalDiarias(dadosUsuario);
                    // Supondo que você criará um <div id="modalDiarias"> no seu index.html
                    const modalEl = document.getElementById('modalDiarias');
                    if (modalEl) new bootstrap.Modal(modalEl).show();
                } else {
                    console.error("Script de Diárias não carregado.");
                }
                break;

            default:
                console.warn("Módulo desconhecido:", moduloId);
                break;
        }
    } catch (e) {
        console.error(`Erro ao abrir módulo ${moduloId}:`, e);
        Swal.fire('Erro', 'Ocorreu um problema ao carregar o formulário.', 'error');
    }
}

/**
 * Opcional: Função para encerrar a sessão sem precisar atualizar a página
 */
function encerrarSessaoPortal() {
    sessaoAtiva = null;
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Sessão encerrada',
        showConfirmButton: false,
        timer: 2000
    });
}