/* =========================================================================
   INTRANET CPRH - PORTAL DE ACESSO (VERSÃO MODULARIZADA ES6)
========================================================================= */

// 1. IMPORTAMOS O NOSSO MOTOR DE API
import { fetchPublico, fetchAutenticado } from './services/apiService.js';

// Variáveis de Escopo (Protegidas dentro da bolha do módulo)
let dadosUsuarioLogado = null; 
let permissoesSessao = { visualizar: false, cadastrar: false, editar: false, excluir: false, manutencao: false };
let moduloAcessoSessao = 'TODOS';

function solicitarAcesso(moduloDestino) {
    if (dadosUsuarioLogado) {
        abrirModalDestino(moduloDestino);
    } else {
        document.getElementById('destino-apos-login').value = moduloDestino;
        const modalEl = document.getElementById('modalLoginAcesso');
        const modalLogin = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalLogin.show();
    }
}

async function processarLoginPortal() {
    const userField = document.getElementById('login-user');
    const passField = document.getElementById('login-pass');
    const btn = document.getElementById('btn-executar-login');

    const usuario = userField.value.trim();
    const senha = passField.value.trim();

    if (!usuario || !senha) {
        Swal.fire('Atenção', 'Preencha usuário e senha da rede.', 'warning');
        return;
    }

    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Validando...';
    btn.disabled = true;

    try {
        // VEJA COMO FICA LIMPO! Usamos fetchPublico e só passamos o pedaço final da rota
        const data = await fetchPublico('/login-ldap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });

        if (data.success) {
            dadosUsuarioLogado = { nome: data.nome, email: data.email };
            const modalLogin = bootstrap.Modal.getInstance(document.getElementById('modalLoginAcesso'));
            if (modalLogin) modalLogin.hide();

            userField.value = ''; passField.value = '';
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Bem-vindo, ${data.nome}`, showConfirmButton: false, timer: 2000 });

            const destino = document.getElementById('destino-apos-login').value;
            if (destino) abrirModalDestino(destino);
        } else {
            Swal.fire('Acesso Negado', data.message, 'error');
            passField.value = ''; 
        }
    } catch (error) {
        Swal.fire('Erro', 'Servidor inacessível. Verifique sua conexão.', 'error');
    } finally {
        btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Validar e Acessar';
        btn.disabled = false;
    }
}

function abrirModalDestino(modulo) {
    const containerBase = document.getElementById('conteudo-modal-base');
    containerBase.innerHTML = '<div class="p-5 text-center"><span class="spinner-border text-success"></span></div>';
    
    if (modulo === 'Manutencao' && window.montarModalManutencao) window.montarModalManutencao(dadosUsuarioLogado);
    else if (modulo === 'Patrimonio' && window.montarModalPatrimonio) window.montarModalPatrimonio(dadosUsuarioLogado);
    else if (modulo === 'Almoxarifado' && window.montarModalAlmoxarifado) window.montarModalAlmoxarifado(dadosUsuarioLogado);
    else if (modulo === 'ServicosGerais' && window.montarModalServicosGerais) window.montarModalServicosGerais(dadosUsuarioLogado);
    
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalBaseChamados')).show();
}

async function autenticarAdmin() {
    const userField = document.getElementById('admin-user');
    const passField = document.getElementById('admin-pass');
    const btn = document.getElementById('btn-admin-login');

    const usuario = userField.value.trim();
    const senha = passField.value.trim();
    if (!usuario || !senha) return;

    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    btn.disabled = true;

    try {
        // Uso do fetchPublico, pois a rota de login não exige token
        const data = await fetchPublico('/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });

        if (data.success) {
            sessionStorage.setItem('cprh_token', data.token);

            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalAdminLogin'));
            if (modalInstance) modalInstance.hide();
            
            userField.value = ''; passField.value = '';
            permissoesSessao = data.permissoes;
            moduloAcessoSessao = data.modulo_acesso || 'TODOS'; 

            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Acesso Administrativo Liberado', showConfirmButton: false, timer: 2000 });
            renderizarPainelAdmin(data.admin); 
        } else {
            Swal.fire('Acesso Negado', data.message, 'error');
            passField.value = ''; 
        }
    } catch (error) { Swal.fire('Erro', 'Servidor inacessível.', 'error'); } 
    finally { btn.innerHTML = 'Acessar Painel'; btn.disabled = false; }
}

function renderizarPainelAdmin(nomeAdmin) {
    const spanNomeAdmin = document.getElementById('nome-admin-logado');
    if (spanNomeAdmin) spanNomeAdmin.innerText = nomeAdmin;
    
    const visaoUsuario = document.getElementById('visao-usuario');
    if (visaoUsuario) visaoUsuario.classList.add('d-none');
    
    const visaoAdmin = document.getElementById('visao-admin');
    if (visaoAdmin) visaoAdmin.classList.remove('d-none');

    // Mapeamento global de permissões para o script_Admin enxergar
    window.permissoesSessao = permissoesSessao;
    window.moduloAcessoSessao = moduloAcessoSessao;

    const cards = {
        setores: document.getElementById('card-admin-setores'),
        relatorios: document.getElementById('card-admin-relatorios'),
        catalogos: document.getElementById('card-admin-catalogos'),
        manutencao: document.getElementById('card-admin-manutencao'),
        acessos: document.getElementById('card-admin-acessos'),
        auditoria: document.getElementById('card-admin-auditoria')
    };

    if (moduloAcessoSessao === 'TODOS') {
        Object.values(cards).forEach(card => { if(card) card.classList.remove('d-none'); });
    } else {
        Object.values(cards).forEach(card => { if(card) card.classList.add('d-none'); });
        if(cards.relatorios) cards.relatorios.classList.remove('d-none');
        if ((moduloAcessoSessao === 'almoxarifado' || moduloAcessoSessao === 'patrimonio') && cards.catalogos) {
            cards.catalogos.classList.remove('d-none');
        }
    }
}

function sairPainelAdmin() {
    const spanNomeAdmin = document.getElementById('nome-admin-logado');
    if (spanNomeAdmin) spanNomeAdmin.innerText = '';
    
    const instrucaoHeader = document.querySelector('.instrucao-header');
    if (instrucaoHeader) instrucaoHeader.classList.remove('d-none');

    const visaoAdmin = document.getElementById('visao-admin');
    if (visaoAdmin) visaoAdmin.classList.add('d-none');
    
    const visaoUsuario = document.getElementById('visao-usuario');
    if (visaoUsuario) visaoUsuario.classList.remove('d-none');

    const conteudoDinamico = document.getElementById('conteudo-dinamico-admin');
    if (conteudoDinamico) conteudoDinamico.innerHTML = '';

    permissoesSessao = { visualizar: false, cadastrar: false, editar: false, excluir: false, manutencao: false };
    moduloAcessoSessao = 'TODOS';
    sessionStorage.removeItem('cprh_token');

    Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Sessão administrativa encerrada.', showConfirmButton: false, timer: 2000 });
}


// =========================================================================
// EXPONDO AS FUNÇÕES PARA O HTML (A mágica do window)
// Como este arquivo agora é um módulo, o HTML não enxerga as funções acima.
// Precisamos "plugá-las" explicitamente na janela do navegador.
// =========================================================================
window.solicitarAcesso = solicitarAcesso;
window.processarLoginPortal = processarLoginPortal;
window.autenticarAdmin = autenticarAdmin;
window.sairPainelAdmin = sairPainelAdmin;
window.abrirModalDestino = abrirModalDestino;
window.renderizarPainelAdmin = renderizarPainelAdmin;
// Exportamos essa variável para os outros scripts ainda antigos enxergarem
window.obterAdminLogado = () => document.querySelector('#subtitulo-header strong') ? document.querySelector('#subtitulo-header strong').innerText : 'Admin Desconhecido';