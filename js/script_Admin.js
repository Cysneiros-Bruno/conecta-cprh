/* =========================================================================
   INTRANET CPRH - BACKOFFICE (VERSÃO MODULARIZADA ES6)
========================================================================= */

// 1. IMPORTAÇÃO DO MOTOR CENTRAL DE COMUNICAÇÃO
import { fetchAutenticado } from './services/apiService.js';

// ==========================================
// VARIÁVEIS DE ESCOPO DO MÓDULO ADMIN
// ==========================================
let dadosRelatorioAtual = [];
let catalogoAdminMemoria = []; 
let catalogoPatrimonioMemoria = [];
let ordemAtualCatalogo = { campo: 'categoria', direcao: 'asc' };
let ordemAtualPatrimonio = { campo: 'tombamento', direcao: 'asc' };

let graficoAtual = null; 
let chartSetores = null;
let chartDemandas = null;
let chartItens = null;

/* =========================================================================
   SEGURANÇA E CONTROLE DE ACESSO INTERNO
========================================================================= */
function verificarAcesso(tipoPermissao) {
    // Agora lemos as permissões que foram salvas globalmente pelo Portal de Acesso
    if (window.permissoesSessao && window.permissoesSessao[tipoPermissao] === true) return true; 

    Swal.fire({
        title: 'Acesso Restrito',
        text: 'Você não possui permissão para realizar esta operação.',
        icon: 'error', confirmButtonColor: '#d33'
    });
    return false;
}

function obterAdmin() {
    return window.obterAdminLogado ? window.obterAdminLogado() : 'Admin';
}


/* =========================================================================
   MÓDULO: GESTÃO DE SETORES
========================================================================= */
async function gerenciarSetores() {
    const container = document.getElementById('conteudo-dinamico-admin');
    container.innerHTML = '<div class="text-center py-5"><span class="spinner-border text-success"></span></div>';

    try {
        // Uso do nosso import da camada de serviços
        const data = await fetchAutenticado(`/admin/setores?t=${new Date().getTime()}`);
        const setores = data.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

        let html = `
            <div class="animate__animated animate__fadeIn">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h5 class="fw-bold"><i class="fas fa-sitemap me-2 text-success"></i>Gestão de Setores</h5>
                    <button class="btn btn-success btn-sm rounded-pill px-3 shadow-sm" onclick="mostrarModalNovoSetor()">
                        <i class="fas fa-plus me-1"></i> Novo Setor
                    </button>
                </div>
                <div class="row mb-3"><div class="col-md-6"><div class="input-group shadow-sm rounded-pill overflow-hidden border bg-white">
                    <span class="input-group-text bg-transparent border-0 text-muted ps-3"><i class="fas fa-search"></i></span>
                    <input type="text" id="input-busca-setor" class="form-control border-0 shadow-none" placeholder="Pesquisar setor..." onkeyup="filtrarSetores()">
                </div></div></div>
                <div class="table-responsive bg-white rounded-4 shadow-sm p-3" style="max-height: 500px; overflow-y: auto;">
                    <table class="table table-hover align-middle mb-0" id="tabela-setores">
                        <thead class="table-light position-sticky top-0 shadow-sm"><tr><th>Nome do Setor</th><th class="text-center" style="width: 150px;">Status</th><th class="text-center" style="width: 100px;">Ações</th></tr></thead>
                        <tbody>
        `;

        setores.forEach(setor => {
            const isAtivo = setor.ativo === 1;
            const toggleIcon = isAtivo ? 'fa-toggle-on text-success' : 'fa-toggle-off text-secondary';
            html += `
                <tr class="${isAtivo ? '' : 'opacity-50'}">
                    <td class="fw-bold text-dark nome-setor-celula">${setor.nome}</td>
                    <td class="text-center"><button class="btn btn-link p-0 text-decoration-none shadow-none" onclick="alternarStatusSetor('${setor.nome}', ${isAtivo ? 0 : 1})"><i class="fas ${toggleIcon} fs-3 transition-all"></i></button></td>
                    <td class="text-center">
                        <button class="btn btn-outline-primary btn-sm border-0 me-2" onclick="renomearSetor('${setor.nome}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-outline-danger btn-sm border-0" onclick="confirmarExclusaoSetor('${setor.nome}')"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `;
        });
        container.innerHTML = html + `</tbody></table></div></div>`;
    } catch (error) { container.innerHTML = '<div class="alert alert-danger">Erro ao carregar setores.</div>'; }
}

function filtrarSetores() {
    const input = document.getElementById('input-busca-setor').value.toLowerCase();
    document.querySelectorAll('#tabela-setores tbody tr').forEach(linha => {
        const celula = linha.querySelector('.nome-setor-celula');
        if (celula) linha.style.display = celula.innerText.toLowerCase().includes(input) ? '' : 'none';
    });
}

function mostrarModalNovoSetor() {
    if (!verificarAcesso('cadastrar')) return; 
    Swal.fire({ title: 'Novo Setor', input: 'text', inputLabel: 'Nome do local', showCancelButton: true, confirmButtonText: 'Salvar', confirmButtonColor: '#198754'
    }).then(async (result) => {
        if (result.isConfirmed && result.value.trim() !== "") {
            try {
                const data = await fetchAutenticado('/admin/setores', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome: result.value.trim(), usuarioLogado: obterAdmin() })
                });
                if (data.success) { Swal.fire('Salvo!', '', 'success'); gerenciarSetores(); } 
                else Swal.fire('Erro', data.message, 'error');
            } catch (error) { Swal.fire('Erro', 'Falha ao conectar.', 'error'); }
        }
    });
}

function renomearSetor(nomeAntigo) {
    if (!verificarAcesso('editar')) return; 
    Swal.fire({ title: 'Renomear Setor', input: 'text', inputValue: nomeAntigo, showCancelButton: true, confirmButtonText: 'Atualizar'
    }).then(async (result) => {
        if (result.isConfirmed && result.value.trim() !== "" && result.value.trim() !== nomeAntigo) {
            try {
                const data = await fetchAutenticado('/admin/setores/renomear', {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nomeAntigo, nomeNovo: result.value.trim(), usuarioLogado: obterAdmin() })
                });
                if (data.success) { Swal.fire('Atualizado!', '', 'success'); gerenciarSetores(); } 
                else Swal.fire('Aviso', data.message, 'warning');
            } catch (error) { Swal.fire('Erro', 'Falha de comunicação.', 'error'); }
        }
    });
}

async function alternarStatusSetor(nomeSetor, novoStatus) {
    if (!verificarAcesso('editar')) return; 
    try {
        const data = await fetchAutenticado('/admin/setores/status', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: nomeSetor, ativo: novoStatus, usuarioLogado: obterAdmin() })
        });
        if (data.success) gerenciarSetores();
        else Swal.fire('Erro', data.message, 'error');
    } catch (error) { Swal.fire('Erro', 'Falha.', 'error'); }
}

function confirmarExclusaoSetor(nomeSetor) {
    if (!verificarAcesso('excluir')) return; 
    Swal.fire({ title: 'Excluir Definitivamente?', html: `Deseja apagar <b>"${nomeSetor}"</b>?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Excluir'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const data = await fetchAutenticado(`/admin/setores/${encodeURIComponent(nomeSetor)}`, {
                    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuarioLogado: obterAdmin() })
                });
                if (data.success) { Swal.fire('Excluído!', '', 'success'); gerenciarSetores(); } 
                else Swal.fire('Atenção', data.message, 'info');
            } catch (error) { Swal.fire('Erro', 'Falha.', 'error'); }
        }
    });
}


/* =========================================================================
   MÓDULO: GESTÃO DE USUÁRIOS (RBAC)
========================================================================= */
async function abrirGestaoUsuarios() {
    const container = document.getElementById('conteudo-dinamico-admin');
    container.innerHTML = '<div class="text-center py-5"><span class="spinner-border text-primary"></span></div>';

    try {
        const result = await fetchAutenticado(`/admin/usuarios?t=${new Date().getTime()}`);
        if (result.success) {
            let html = `
                <div class="animate__animated animate__fadeIn">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h5 class="fw-bold"><i class="fas fa-users-cog me-2 text-dark"></i>Controle de Acesso (RBAC)</h5>
                        <button class="btn btn-dark btn-sm rounded-pill px-3" onclick="mostrarModalNovoUsuario()"><i class="fas fa-user-plus me-1"></i> Novo Gestor</button>
                    </div>
                    <div class="table-responsive bg-white rounded-4 shadow-sm p-3">
                        <table class="table table-hover align-middle mb-0 text-center" style="font-size: 0.85rem;">
                            <thead class="table-light">
                                <tr><th class="text-start">Usuário</th><th>Escopo</th><th>Ativo</th><th>Ver</th><th>Criar</th><th>Editar</th><th>Excluir</th><th class="text-danger">DB</th><th>Ações</th></tr>
                            </thead>
                            <tbody>
            `;
            result.dados.forEach(user => {
                const criarToggle = (coluna, valor) => `<div class="form-check form-switch d-flex justify-content-center m-0"><input class="form-check-input cursor-pointer" type="checkbox" ${valor === 1 ? 'checked' : ''} onchange="alternarPermissaoUsuario(${user.id}, '${coluna}', this.checked ? 1 : 0)"></div>`;
                let badgeModulo = user.modulo_acesso === 'TODOS' ? 'bg-dark' : 'bg-info text-dark';
                
                html += `
                    <tr>
                        <td class="text-start fw-bold text-secondary"><i class="fas fa-user-shield me-2"></i>${user.usuario}</td>
                        <td><span class="badge ${badgeModulo} p-2 cursor-pointer shadow-sm" onclick="alterarEscopoUsuario(${user.id}, '${user.usuario}', '${user.modulo_acesso}')">${user.modulo_acesso ? user.modulo_acesso.toUpperCase() : 'TODOS'} <i class="fas fa-edit ms-1"></i></span></td>
                        <td>${criarToggle('ativo', user.ativo)}</td>
                        <td>${criarToggle('perm_visualizar', user.perm_visualizar)}</td>
                        <td>${criarToggle('perm_cadastrar', user.perm_cadastrar)}</td>
                        <td>${criarToggle('perm_editar', user.perm_editar)}</td>
                        <td>${criarToggle('perm_excluir', user.perm_excluir)}</td>
                        <td class="bg-light">${criarToggle('perm_manutencao', user.perm_manutencao)}</td>
                        <td class="text-center text-nowrap">
                            <button class="btn btn-outline-primary btn-sm border-0" onclick="renomearUsuarioAdmin(${user.id}, '${user.usuario}')"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-outline-warning btn-sm border-0 text-dark" onclick="redefinirSenhaAdmin(${user.id}, '${user.usuario}')"><i class="fas fa-key"></i></button>
                            <button class="btn btn-outline-danger btn-sm border-0" onclick="excluirUsuarioAdmin(${user.id}, '${user.usuario}')"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                `;
            });
            container.innerHTML = html + `</tbody></table></div></div>`;
        }
    } catch (error) { container.innerHTML = `<div class="alert alert-danger">Erro ao carregar usuários.</div>`; }
}

function alterarEscopoUsuario(id, nomeUsuario, moduloAtual) {
    if (!verificarAcesso('manutencao')) return;
    Swal.fire({
        title: `Escopo de ${nomeUsuario}`,
        html: `<select id="swal-select-modulo" class="form-select text-center fw-bold mt-3">
                <option value="TODOS" ${moduloAtual === 'TODOS' ? 'selected' : ''}>ADMIN GLOBAL (Todos)</option>
                <option value="manutencao" ${moduloAtual === 'manutencao' ? 'selected' : ''}>Manutenção</option>
                <option value="servicos-gerais" ${moduloAtual === 'servicos-gerais' ? 'selected' : ''}>Serviços Gerais</option>
                <option value="patrimonio" ${moduloAtual === 'patrimonio' ? 'selected' : ''}>Patrimônio</option>
                <option value="almoxarifado" ${moduloAtual === 'almoxarifado' ? 'selected' : ''}>Almoxarifado</option>
            </select>`,
        showCancelButton: true, confirmButtonText: 'Atualizar',
        preConfirm: () => document.getElementById('swal-select-modulo').value
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetchAutenticado('/admin/usuarios/modulo', {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, novoModulo: result.value, usuarioLogado: obterAdmin() })
                });
                if (res.success) abrirGestaoUsuarios();
            } catch (error) { Swal.fire('Erro', 'Falha.', 'error'); }
        }
    });
}

async function alternarPermissaoUsuario(idUsuario, colunaPermissao, novoValor) {
    if (!verificarAcesso('manutencao')) { abrirGestaoUsuarios(); return; }
    try {
        const res = await fetchAutenticado('/admin/usuarios/permissao', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idUsuario, colunaPermissao, valor: novoValor, usuarioLogado: obterAdmin() })
        });
        if (!res.success) abrirGestaoUsuarios(); 
    } catch (error) { abrirGestaoUsuarios(); }
}

function mostrarModalNovoUsuario() {
    if (!verificarAcesso('manutencao')) return; 
    Swal.fire({
        title: 'Novo Administrador',
        html: `<input id="swal-input-usuario" class="swal2-input" placeholder="Nome/Login"><input id="swal-input-senha" class="swal2-input" type="password" placeholder="Senha">`,
        showCancelButton: true, confirmButtonText: 'Criar',
        preConfirm: () => {
            const u = document.getElementById('swal-input-usuario').value.trim();
            const p = document.getElementById('swal-input-senha').value.trim();
            if (!u || !p) Swal.showValidationMessage('Preencha ambos');
            return { usuario: u, senha: p };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const data = await fetchAutenticado('/admin/usuarios', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...result.value, usuarioLogado: obterAdmin() })
                });
                if (data.success) abrirGestaoUsuarios(); else Swal.fire('Erro', data.message, 'warning');
            } catch (error) { Swal.fire('Erro', 'Falha no servidor', 'error'); }
        }
    });
}

function renomearUsuarioAdmin(id, nomeAtual) {
    if (!verificarAcesso('manutencao')) return;
    Swal.fire({ title: 'Renomear', input: 'text', inputValue: nomeAtual, showCancelButton: true, confirmButtonText: 'Salvar'
    }).then(async (result) => {
        if (result.isConfirmed && result.value.trim() !== "") {
            const data = await fetchAutenticado('/admin/usuarios/renomear', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, novoNome: result.value.trim(), usuarioLogado: obterAdmin() })
            });
            if (data.success) abrirGestaoUsuarios();
        }
    });
}

function redefinirSenhaAdmin(id, nomeUsuario) {
    if (!verificarAcesso('manutencao')) return;
    Swal.fire({ title: `Senha: ${nomeUsuario}`, input: 'password', showCancelButton: true, confirmButtonText: 'Salvar'
    }).then(async (result) => {
        if (result.isConfirmed && result.value.trim() !== "") {
            const data = await fetchAutenticado('/admin/usuarios/senha', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, novaSenha: result.value.trim(), usuarioLogado: obterAdmin() })
            });
            if (data.success) Swal.fire('Senha Redefinida!', '', 'success');
        }
    });
}

function excluirUsuarioAdmin(id, nomeUsuario) {
    if (!verificarAcesso('excluir')) return;
    Swal.fire({ title: 'Excluir?', html: `Revogar acesso de <b>${nomeUsuario}</b>.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const data = await fetchAutenticado(`/admin/usuarios/${id}`, {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuarioLogado: obterAdmin() })
            });
            if (data.success) abrirGestaoUsuarios();
        }
    });
}


/* =========================================================================
   MÓDULO: RELATÓRIOS E AUDITORIA
========================================================================= */
async function abrirRelatorios() {
    const container = document.getElementById('conteudo-dinamico-admin');
    container.innerHTML = `
        <div class="animate__animated animate__fadeIn">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="fw-bold"><i class="fas fa-chart-pie me-2 text-primary"></i>Dashboard Gerencial</h5>
                <div class="d-flex gap-2">
                    <select id="filtro-modulo-relatorio" class="form-select shadow-sm border-primary fw-bold text-primary" onchange="carregarDadosRelatorio()">
                        <option value="manutencao" selected>Módulo: Manutenção</option>
                        <option value="servicos-gerais">Módulo: Serviços Gerais</option>
                        <option value="patrimonio">Módulo: Patrimônio</option>
                        <option value="almoxarifado">Módulo: Almoxarifado</option>
                    </select>
                    <select id="filtro-ano-relatorio" class="form-select shadow-sm" onchange="carregarDadosRelatorio()">
                        <option value="2026" selected>2026</option>
                        <option value="2025">2025</option>
                    </select>
                    <button class="btn btn-outline-dark shadow-sm fw-bold d-flex align-items-center" onclick="imprimirRelatorioAtual()"><i class="fas fa-print me-2"></i> Imprimir</button>
                </div>
            </div>
            <ul class="nav nav-tabs mb-3" role="tablist">
                <li class="nav-item"><button class="nav-link active fw-bold text-dark" data-bs-toggle="tab" data-bs-target="#tab-grafico"><i class="fas fa-chart-bar me-1 text-primary"></i> Gráficos</button></li>
                <li class="nav-item"><button class="nav-link fw-bold text-dark" data-bs-toggle="tab" data-bs-target="#tab-lista"><i class="fas fa-list me-1 text-secondary"></i> Lista</button></li>
            </ul>
            <div class="tab-content">
                <div class="tab-pane fade show active" id="tab-grafico">
                    <div class="row g-3 mb-4">
                        <div class="col-md-3"><div class="card border-0 shadow-sm bg-primary text-white h-100 p-3"><h5>Total</h5><h3 id="kpi-total" class="fw-bold">0</h3></div></div>
                        <div class="col-md-3"><div class="card border-0 shadow-sm bg-warning text-dark h-100 p-3"><h5>Andamento</h5><h3 id="kpi-andamento" class="fw-bold">0</h3></div></div>
                        <div class="col-md-3"><div class="card border-0 shadow-sm bg-success text-white h-100 p-3"><h5>Resolvidos</h5><h3 id="kpi-resolvidos" class="fw-bold">0</h3></div></div>
                        <div class="col-md-3"><div class="card border-0 shadow-sm bg-info text-dark h-100 p-3"><h5>Taxa</h5><h3 id="kpi-taxa" class="fw-bold">0%</h3></div></div>
                    </div>
                    <div class="card border-0 shadow-sm p-3 bg-white mb-4"><h6 class="text-center text-muted fw-bold mb-3" id="titulo-grafico-view">Comparativo</h6><div style="height: 300px;"><canvas id="canvasDashboard"></canvas></div></div>
                </div>
                <div class="tab-pane fade" id="tab-lista">
                    <div class="table-responsive bg-white shadow-sm p-3"><table class="table table-hover align-middle mb-0"><tbody id="tbody-relatorio-lista"></tbody></table></div>
                </div>
            </div>
        </div>
    `;
    if (window.moduloAcessoSessao && window.moduloAcessoSessao !== 'TODOS') {
        const s = document.getElementById('filtro-modulo-relatorio');
        s.value = window.moduloAcessoSessao; s.disabled = true;
    }
    carregarDadosRelatorio();
}

async function carregarDadosRelatorio() {
    const modulo = document.getElementById('filtro-modulo-relatorio').value;
    const ano = document.getElementById('filtro-ano-relatorio').value;
    
    document.getElementById('tbody-relatorio-lista').innerHTML = `<tr><td class="text-center py-4">Atualizando dados...</td></tr>`;

    try {
        const dataGrafico = await fetchAutenticado(`/admin/relatorios/estatisticas?modulo=${modulo}&ano=${ano}`);
        if (dataGrafico.success) desenharGraficoDashboard(dataGrafico.abertos, dataGrafico.solucionados);

        const dataLista = await fetchAutenticado(`/admin/chamados/${modulo}`);
        if (dataLista.success) {
            dadosRelatorioAtual = dataLista.dados.filter(c => new Date(c.data_solicitacao || c.data_abertura).getFullYear().toString() === ano.toString());
            desenharTabelaRelatorio(dadosRelatorioAtual, modulo);
            atualizarKPIs(dadosRelatorioAtual);
        }
    } catch (error) { Swal.fire('Erro', 'Falha ao processar.', 'error'); }
}

function desenharGraficoDashboard(abertos, solucionados) {
    const ctx = document.getElementById('canvasDashboard');
    if (!ctx) return;
    if (graficoAtual) graficoAtual.destroy();
    graficoAtual = new Chart(ctx, {
        type: 'bar', data: { labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'], datasets: [ { label: 'Abertos', data: abertos, backgroundColor: '#36a2eb' }, { label: 'Solucionados', data: solucionados, backgroundColor: '#4bc0c0' } ] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function atualizarKPIs(lista) {
    let total = lista.length, and = 0, res = 0;
    lista.forEach(c => { if (['Solucionado', 'Fechado'].includes(c.status)) res++; else if (c.status !== 'Cancelado') and++; });
    document.getElementById('kpi-total').innerText = total;
    document.getElementById('kpi-andamento').innerText = and;
    document.getElementById('kpi-resolvidos').innerText = res;
    document.getElementById('kpi-taxa').innerText = total > 0 ? Math.round((res / total) * 100) + '%' : '0%';
}

function desenharTabelaRelatorio(chamados, modulo) {
    const tbody = document.getElementById('tbody-relatorio-lista');
    if (chamados.length === 0) { tbody.innerHTML = `<tr><td class="text-center py-5">Nenhum registro.</td></tr>`; return; }

    let html = '';
    chamados.forEach((c, i) => {
        let op = ['Novo', 'Em atendimento', 'Pendente', 'Solucionado', 'Fechado', 'Cancelado'].map(s => `<option value="${s}" ${c.status === s ? 'selected' : ''}>${s}</option>`).join('');
        html += `<tr><td class="fw-bold text-success">${c.protocolo}</td><td>${new Date(c.data_solicitacao).toLocaleDateString()}</td><td>${c.origem || c.unidade || c.localizacao || 'N/A'}</td>
                <td><select class="form-select form-select-sm fw-bold" onchange="confirmarTrocaStatus('${c.protocolo}', this.value, '${c.status}', '${modulo}')">${op}</select></td>
                <td><button class="btn btn-sm btn-outline-primary" onclick="verDetalhesChamado('${modulo}', ${i})"><i class="fas fa-search"></i> Detalhes</button></td></tr>`;
    });
    tbody.innerHTML = html;
}

function verDetalhesChamado(modulo, index) {
    const c = dadosRelatorioAtual[index];
    let itHtml = (c.itens || []).map(i => `<tr><td>${i.codigo || i.tombamento || i.tipo || i.categoria || '-'}</td><td>${i.descricao || i.descricao_item || '-'}</td></tr>`).join('');
    Swal.fire({ title: c.protocolo, html: `<div class="text-start"><p><b>Solicitante:</b> ${c.nome_solicitante}</p><table class="table table-sm"><thead><tr><th>Item/Cod</th><th>Detalhe</th></tr></thead><tbody>${itHtml}</tbody></table></div>`, width: 600 });
}

async function confirmarTrocaStatus(prot, novoS, antigoS, mod) {
    if (novoS === antigoS) return;
    const r = await Swal.fire({ title: 'Alterar Status?', html: `De: <b>${antigoS}</b> Para: <b>${novoS}</b>?`, showCancelButton: true, confirmButtonText: 'Sim' });
    if (r.isConfirmed) {
        const data = await fetchAutenticado('/admin/relatorios/status', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ protocolo: prot, novoStatus: novoS, modulo: mod, usuarioLogado: obterAdmin() })
        });
        if (data.success) Swal.fire({ toast: true, icon: 'success', title: 'Atualizado', timer: 2000 }); else Swal.fire('Erro', data.message, 'error');
    }
    carregarDadosRelatorio();
}

function imprimirRelatorioAtual() { window.print(); }


/* =========================================================================
   MÓDULO: CATÁLOGOS (ALMOXARIFADO E PATRIMÔNIO)
========================================================================= */
async function abrirPainelCatalogos() {
    if (!verificarAcesso('visualizar')) return;
    document.getElementById('conteudo-dinamico-admin').innerHTML = `
        <div class="animate__animated animate__fadeIn">
            <h5 class="fw-bold mb-4"><i class="fas fa-book-open me-2 text-info"></i>Gestão de Catálogos</h5>
            <select id="filtro-modulo-catalogo" class="form-select shadow-sm border-info w-50 mb-4" onchange="carregarVisaoCatalogo()">
                <option value="almoxarifado" selected>Almoxarifado (Materiais)</option>
                <option value="patrimonio">Patrimônio (Bens Tombados)</option>
            </select>
            <div id="area-trabalho-catalogo"></div>
        </div>
    `;
    if (window.moduloAcessoSessao && window.moduloAcessoSessao !== 'TODOS') {
        const s = document.getElementById('filtro-modulo-catalogo');
        s.value = window.moduloAcessoSessao; s.disabled = true;
    }
    carregarVisaoCatalogo();
}

function carregarVisaoCatalogo() {
    const m = document.getElementById('filtro-modulo-catalogo').value;
    if (m === 'almoxarifado') renderizarVisaoAlmoxarifado(); else renderizarVisaoPatrimonio();
}

// ---- ALMOXARIFADO ----
async function renderizarVisaoAlmoxarifado() {
    const area = document.getElementById('area-trabalho-catalogo');
    try {
        catalogoAdminMemoria = await fetchAutenticado(`/admin/materiais?t=${new Date().getTime()}`);
        area.innerHTML = `
            <div class="d-flex justify-content-between mb-3">
                <input type="text" id="input-busca-cat" class="form-control w-25" placeholder="Pesquisar..." onkeyup="filtrarCatalogo()">
                <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm" onclick="mostrarModalNovoMaterial()">+ Novo Material</button>
                    <button class="btn btn-outline-dark btn-sm" onclick="imprimirCatalogoEstoque()"><i class="fas fa-print"></i> Inventário</button>
                </div>
            </div>
            <div class="table-responsive bg-white rounded-3 shadow-sm p-3"><table class="table table-hover mb-0"><tbody id="tbody-catalogo-admin"></tbody></table></div>
        `;
        atualizarTabelaCatalogo();
    } catch(e) { area.innerHTML = 'Erro ao carregar'; }
}

function atualizarTabelaCatalogo() {
    const t = document.getElementById('tbody-catalogo-admin');
    if(catalogoAdminMemoria.length === 0) { t.innerHTML = '<tr><td>Vazio</td></tr>'; return; }
    t.innerHTML = catalogoAdminMemoria.map(i => `
        <tr class="${i.ativo===1?'':'opacity-50'}">
            <td class="fw-bold">${i.codigo}</td><td>${i.categoria}</td><td>${i.descricao}</td><td class="text-center fw-bold">${i.quantidade_estoque} un.</td>
            <td class="text-center"><button class="btn btn-sm btn-outline-danger" onclick="inativarMaterialAdmin('${i.codigo}')"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function filtrarCatalogo() {
    const v = document.getElementById('input-busca-cat').value.toLowerCase();
    document.querySelectorAll('#tbody-catalogo-admin tr').forEach(r => r.style.display = r.innerText.toLowerCase().includes(v) ? '' : 'none');
}

function mostrarModalNovoMaterial() {
    if (!verificarAcesso('cadastrar')) return;
    Swal.fire({ title: 'Novo Material', html: `<input id="sc" class="swal2-input" placeholder="Cod"><input id="sca" class="swal2-input" placeholder="Cat"><input id="sd" class="swal2-input" placeholder="Desc">`, preConfirm: () => ({ codigo: document.getElementById('sc').value, categoria: document.getElementById('sca').value, descricao: document.getElementById('sd').value })
    }).then(async r => {
        if(r.isConfirmed) {
            await fetchAutenticado('/admin/materiais/importar', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({itens: [r.value], usuarioLogado: obterAdmin()})});
            renderizarVisaoAlmoxarifado();
        }
    });
}
function inativarMaterialAdmin(codigo) {
    if (!verificarAcesso('excluir')) return;
    Swal.fire({title:'Excluir?', showCancelButton: true}).then(async r => {
        if(r.isConfirmed) { await fetchAutenticado(`/admin/materiais/${codigo}`, {method:'DELETE', body: JSON.stringify({usuarioLogado: obterAdmin()})}); renderizarVisaoAlmoxarifado(); }
    });
}
function imprimirCatalogoEstoque() { window.print(); }


// ---- PATRIMÔNIO ----
async function renderizarVisaoPatrimonio() {
    const area = document.getElementById('area-trabalho-catalogo');
    try {
        area.innerHTML = `
            <div class="d-flex justify-content-between mb-3">
                <input type="text" id="input-busca-pat" class="form-control w-25" placeholder="Pesquisar..." onkeyup="filtrarBens()">
                <div class="d-flex gap-2">
                    <button class="btn btn-info text-white btn-sm" onclick="mostrarModalNovoBem()">+ Novo Bem</button>
                    <button class="btn btn-outline-dark btn-sm" onclick="imprimirConferenciaPatrimonio()"><i class="fas fa-print"></i> Inventário</button>
                </div>
            </div>
            <div class="table-responsive bg-white rounded-3 shadow-sm p-3"><table class="table table-hover mb-0"><tbody id="tbody-patrimonio-admin"></tbody></table></div>
        `;
        carregarItensPatrimonio();
    } catch(e) {}
}

async function carregarItensPatrimonio() {
    catalogoPatrimonioMemoria = await fetchAutenticado('/admin/patrimonio/itens');
    const t = document.getElementById('tbody-patrimonio-admin');
    t.innerHTML = catalogoPatrimonioMemoria.map(i => `
        <tr class="${i.ativo===1?'':'opacity-50'}">
            <td class="fw-bold">${i.tombamento}</td><td>${i.descricao}</td><td>${i.setor_atual || 'Não alocado'}</td><td class="text-center fw-bold">${i.estado_conservacao}</td>
            <td class="text-center"><button class="btn btn-sm btn-outline-danger" onclick="excluirBemAdmin('${i.tombamento}')"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function filtrarBens() {
    const v = document.getElementById('input-busca-pat').value.toLowerCase();
    document.querySelectorAll('#tbody-patrimonio-admin tr').forEach(r => r.style.display = r.innerText.toLowerCase().includes(v) ? '' : 'none');
}

function mostrarModalNovoBem() {
    if (!verificarAcesso('cadastrar')) return;
    Swal.fire({ title: 'Novo Bem', html: `<input id="st" class="swal2-input" placeholder="Tombamento"><input id="sd" class="swal2-input" placeholder="Descrição"><input id="sse" class="swal2-input" placeholder="Setor">`, preConfirm: () => ({ tombamento: document.getElementById('st').value, descricao: document.getElementById('sd').value, setor: document.getElementById('sse').value, estado: 'Novo' })
    }).then(async r => {
        if(r.isConfirmed) {
            await fetchAutenticado('/admin/patrimonio/catalogo/novo', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...r.value, usuarioLogado: obterAdmin()})});
            carregarItensPatrimonio();
        }
    });
}

function excluirBemAdmin(tombamento) {
    if (!verificarAcesso('excluir')) return;
    Swal.fire({title:'Excluir?', showCancelButton: true}).then(async r => {
        if(r.isConfirmed) { await fetchAutenticado(`/admin/patrimonio/catalogo/${tombamento}`, {method:'DELETE', body: JSON.stringify({usuarioLogado: obterAdmin()})}); carregarItensPatrimonio(); }
    });
}
function imprimirConferenciaPatrimonio() { window.print(); }


/* =========================================================================
   MÓDULO: AUDITORIA E BANCO DE DADOS
========================================================================= */
async function abrirAuditoria() {
    if (!verificarAcesso('manutencao')) return;
    const container = document.getElementById('conteudo-dinamico-admin');
    const data = await fetchAutenticado(`/admin/auditoria?t=${new Date().getTime()}`);
    container.innerHTML = `
        <h5 class="fw-bold mb-4 text-dark"><i class="fas fa-history me-2 text-warning"></i>Auditoria</h5>
        <div class="table-responsive bg-white rounded-4 p-3 shadow-sm" style="max-height: 500px; overflow-y: auto;">
            <table class="table table-sm table-hover mb-0"><tbody>
                ${data.dados.map(log => `<tr><td class="text-muted">${new Date(log.data_hora).toLocaleString()}</td><td class="fw-bold">${log.usuario_admin}</td><td><span class="badge bg-secondary">${log.acao}</span></td><td>${log.modulo}</td><td>${log.detalhes}</td></tr>`).join('')}
            </tbody></table>
        </div>
    `;
}

function abrirManutencaoDados() {
    if (!verificarAcesso('manutencao')) return;
    document.getElementById('conteudo-dinamico-admin').innerHTML = `
        <h5 class="fw-bold mb-4 text-danger"><i class="fas fa-radiation me-2"></i>Reset do Sistema</h5>
        <div class="text-center"><button class="btn btn-danger px-5" onclick="executarLimpezaBanco()">APAGAR DADOS</button></div>
    `;
}

async function executarLimpezaBanco() {
    Swal.fire({ title: 'CERTEZA ABSOLUTA?', icon: 'warning', showCancelButton: true, confirmButtonText: 'DESTRUIR' }).then(async r => {
        if(r.isConfirmed) {
            await fetchAutenticado('/admin/limpar-banco', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({confirmacao:'RESETAR-CPRH', alvo:'todos', usuarioLogado: obterAdmin()}) });
            Swal.fire('Limpeza Concluída!', '', 'success');
        }
    });
}


/* =========================================================================
   EXPORTANDO FUNÇÕES PARA O HTML E OUTROS SCRIPTS (MÓDULO ES6)
========================================================================= */
// Funções Core
window.fetchAutenticado = fetchAutenticado;
window.obterAdmin = obterAdmin;
window.verificarAcesso = verificarAcesso;

// Módulo Setores
window.gerenciarSetores = gerenciarSetores;
window.filtrarSetores = filtrarSetores;
window.mostrarModalNovoSetor = mostrarModalNovoSetor;
window.renomearSetor = renomearSetor;
window.alternarStatusSetor = alternarStatusSetor;
window.confirmarExclusaoSetor = confirmarExclusaoSetor;

// Módulo Relatórios
window.abrirRelatorios = abrirRelatorios;
window.carregarDadosRelatorio = carregarDadosRelatorio;
window.confirmarTrocaStatus = confirmarTrocaStatus;
window.imprimirRelatorioAtual = imprimirRelatorioAtual;
window.verDetalhesChamado = verDetalhesChamado;

// Módulo Acessos/RBAC
window.abrirGestaoUsuarios = abrirGestaoUsuarios;
window.mostrarModalNovoUsuario = mostrarModalNovoUsuario;
window.alterarEscopoUsuario = alterarEscopoUsuario;
window.alternarPermissaoUsuario = alternarPermissaoUsuario;
window.renomearUsuarioAdmin = renomearUsuarioAdmin;
window.redefinirSenhaAdmin = redefinirSenhaAdmin;
window.excluirUsuarioAdmin = excluirUsuarioAdmin;

// Módulo Catálogos Base
window.abrirPainelCatalogos = abrirPainelCatalogos;
window.carregarVisaoCatalogo = carregarVisaoCatalogo;

// Módulo Almoxarifado
window.renderizarVisaoAlmoxarifado = renderizarVisaoAlmoxarifado;
window.filtrarCatalogo = filtrarCatalogo;
window.ordenarCatalogo = ordenarCatalogo;
window.baixarPlanilhaModelo = baixarPlanilhaModelo;
window.mostrarModalImportacaoCSV = mostrarModalImportacaoCSV;
window.mostrarModalNovoMaterial = mostrarModalNovoMaterial;
window.editarMaterialAdmin = editarMaterialAdmin;
window.alternarStatusMaterialAdmin = alternarStatusMaterialAdmin;
window.inativarMaterialAdmin = inativarMaterialAdmin;
window.imprimirCatalogoEstoque = imprimirCatalogoEstoque;

// Módulo Patrimônio
window.renderizarVisaoPatrimonio = renderizarVisaoPatrimonio;
window.carregarItensPatrimonio = carregarItensPatrimonio;
window.filtrarBens = filtrarBens;
window.ordenarCatalogoPatrimonio = ordenarCatalogoPatrimonio;
window.mostrarModalNovoBem = mostrarModalNovoBem;
window.editarBemAdmin = editarBemAdmin;
window.alternarStatusBem = alternarStatusBem;
window.excluirBemAdmin = excluirBemAdmin;
window.baixarPlanilhaModeloPatrimonio = baixarPlanilhaModeloPatrimonio;
window.mostrarModalImportacaoCSVPatrimonio = mostrarModalImportacaoCSVPatrimonio;
window.imprimirConferenciaPatrimonio = imprimirConferenciaPatrimonio;

// Módulo Auditoria e Dados
window.abrirAuditoria = abrirAuditoria;
window.abrirManutencaoDados = abrirManutencaoDados;
window.validarTravaReset = validarTravaReset;
window.executarLimpezaBanco = executarLimpezaBanco;