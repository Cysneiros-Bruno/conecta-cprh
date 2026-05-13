/* =========================================================================
   INTRANET CPRH - BACKOFFICE (VERSÃO MODULARIZADA PREMIUM)
   Com Envio de Nomes (UX Payload) para Logs de Auditoria Legíveis
========================================================================= */

import { fetchAutenticado } from './services/apiService.js';

// ==========================================
// VARIÁVEIS GLOBAIS DE MEMÓRIA
// ==========================================
let dadosRelatorioAtual = [];
let catalogoAdminMemoria = []; 
let catalogoPatrimonioMemoria = [];
let setoresMemoria = []; 
let ordemAtualCatalogo = { campo: 'codigo', direcao: 'asc' };
let ordemAtualPatrimonio = { campo: 'tombamento', direcao: 'asc' };

let graficoAtual = null; 
let chartSetores = null;
let chartDemandas = null;
let chartItens = null;

// FUNÇÃO AUXILIAR GLOBAL: Garante que os Códigos sejam comparados corretamente
const normalizarCodigo = (str) => String(str || '').replace(/^['"]|['"]$/g, '').trim();

// ==========================================
// SEGURANÇA E CONTROLE DE ACESSO
// ==========================================
function verificarAcesso(tipoPermissao) {
    if (window.permissoesSessao && window.permissoesSessao[tipoPermissao] === true) return true; 

    Swal.fire({
        title: 'Acesso Restrito',
        text: 'Você não possui permissão para realizar esta operação. Solicite liberação ao administrador.',
        icon: 'error', 
        confirmButtonColor: '#d33'
    });
    return false;
}

function obterAdmin() {
    return window.obterAdminLogado ? window.obterAdminLogado() : 'Admin';
}

// ==========================================
// MÓDULO: GESTÃO DE SETORES
// ==========================================
async function gerenciarSetores() {
    const container = document.getElementById('conteudo-dinamico-admin');
    container.innerHTML = '<div class="text-center py-5"><span class="spinner-border text-success"></span></div>';

    try {
        const setores = await fetchAutenticado(`/admin/setores?t=${new Date().getTime()}`);
        setoresMemoria = setores; 
        setores.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

        let html = `
            <div class="animate__animated animate__fadeIn">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h5 class="fw-bold"><i class="fas fa-sitemap me-2 text-success"></i>Gestão de Setores</h5>
                    <div class="d-flex gap-2">
                        
                        <button class="btn btn-success btn-sm rounded-pill px-3 shadow-sm" onclick="mostrarModalNovoSetor()">
                            <i class="fas fa-plus me-1"></i> Novo Setor
                        </button>

                        <button class="btn btn-outline-dark btn-sm rounded-pill px-3 shadow-sm fw-bold" onclick="imprimirSetores()">
                            <i class="fas fa-print me-1"></i> Imprimir
                        </button>

                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="input-group shadow-sm rounded-pill overflow-hidden border bg-white">
                            <span class="input-group-text bg-transparent border-0 text-muted ps-3"><i class="fas fa-search"></i></span>
                            <input type="text" id="input-busca-setor" class="form-control border-0 shadow-none" placeholder="Pesquisar setor..." onkeyup="filtrarSetores()">
                        </div>
                    </div>
                </div>
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
                    <td class="text-center">
                        <button class="btn btn-link p-0 text-decoration-none shadow-none" onclick="alternarStatusSetor('${setor.nome}', ${isAtivo ? 0 : 1})" title="Ligar/Desligar Setor">
                            <i class="fas ${toggleIcon} fs-3 transition-all"></i>
                        </button>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-outline-primary btn-sm border-0 me-2" onclick="renomearSetor('${setor.nome}')" title="Renomear"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-outline-danger btn-sm border-0" onclick="confirmarExclusaoSetor('${setor.nome}')" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `;
        });
        container.innerHTML = html + `</tbody></table></div></div>`;
    } catch (error) { 
        container.innerHTML = '<div class="alert alert-danger">Erro ao carregar setores.</div>'; 
    }
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
    Swal.fire({ 
        title: 'Novo Setor', input: 'text', inputLabel: 'Nome do local', showCancelButton: true, confirmButtonText: 'Salvar', confirmButtonColor: '#198754'
    }).then(async (result) => {
        if (result.isConfirmed && result.value.trim() !== "") {
            try {
                const data = await fetchAutenticado('/admin/setores', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome: result.value.trim(), usuarioLogado: obterAdmin() })
                });
                if (data.success) { 
                    Swal.fire('Salvo!', '', 'success'); 
                    if (window.forcarAtualizacaoSetores) window.forcarAtualizacaoSetores();
                    gerenciarSetores(); 
                } else Swal.fire('Erro', data.message, 'error');
            } catch (error) { Swal.fire('Erro', 'Falha ao conectar.', 'error'); }
        }
    });
}

function renomearSetor(nomeAntigo) {
    if (!verificarAcesso('editar')) return; 
    Swal.fire({ 
        title: 'Renomear Setor', input: 'text', inputValue: nomeAntigo, showCancelButton: true, confirmButtonText: 'Atualizar', confirmButtonColor: '#0d6efd'
    }).then(async (result) => {
        if (result.isConfirmed && result.value.trim() !== "" && result.value.trim() !== nomeAntigo) {
            try {
                const data = await fetchAutenticado('/admin/setores/renomear', {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nomeAntigo, nomeNovo: result.value.trim(), usuarioLogado: obterAdmin() })
                });
                if (data.success) { 
                    Swal.fire('Atualizado!', '', 'success'); 
                    if (window.forcarAtualizacaoSetores) window.forcarAtualizacaoSetores();
                    gerenciarSetores(); 
                } else Swal.fire('Aviso', data.message, 'warning');
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
        if (data.success) {
            if (window.forcarAtualizacaoSetores) window.forcarAtualizacaoSetores();
            gerenciarSetores();
        } else Swal.fire('Erro', data.message, 'error');
    } catch (error) { Swal.fire('Erro', 'Falha.', 'error'); }
}

function confirmarExclusaoSetor(nomeSetor) {
    if (!verificarAcesso('excluir')) return; 
    Swal.fire({ 
        title: 'Excluir Definitivamente?', 
        html: `Deseja apagar <b>"${nomeSetor}"</b>?<br><small class="text-danger">Bloqueado se existirem chamados.</small>`, 
        icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sim, excluir'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const data = await fetchAutenticado(`/admin/setores/${encodeURIComponent(nomeSetor)}`, {
                    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuarioLogado: obterAdmin() })
                });
                if (data.success) { 
                    Swal.fire('Excluído!', '', 'success'); 
                    if (window.forcarAtualizacaoSetores) window.forcarAtualizacaoSetores();
                    gerenciarSetores(); 
                } else Swal.fire('Atenção', data.message, 'info');
            } catch (error) { Swal.fire('Erro', 'Falha.', 'error'); }
        }
    });
}

function imprimirSetores() {
    if (!setoresMemoria || setoresMemoria.length === 0) {
        Swal.fire('Aviso', 'Nenhum setor cadastrado para imprimir.', 'info');
        return;
    }

    const dataHora = new Date().toLocaleString('pt-BR');
    const nomeAdmin = obterAdmin();

    const listaOrdenada = [...setoresMemoria].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const setoresAtivos = listaOrdenada.filter(s => s.ativo === 1);
    const setoresInativos = listaOrdenada.filter(s => s.ativo === 0);

    let htmlPrint = `
        <html>
        <head>
            <title>Relatório de Setores - CPRH</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #000; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .header h2 { margin: 0; padding: 0; font-size: 18px; text-transform: uppercase; }
                .meta { display: flex; justify-content: space-between; font-size: 11px; color: #444; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                
                .bloco-header { background-color: #e9ecef !important; text-align: center; font-weight: bold; font-size: 14px; letter-spacing: 1px; }
                .linha-total { background-color: #f8f9fa !important; font-weight: bold; }

                .status-ativo { color: #198754 !important; font-weight: bold; }
                .status-inativo { color: #dc3545 !important; font-weight: bold; }

                @media print { 
                    @page { margin: 1cm; } 
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Lista de Setores (Estrutura Organizacional)</h2>
            </div>
            <div class="meta">
                <span><strong>Emissão:</strong> ${dataHora}</span>
                <span><strong>Total Geral:</strong> ${setoresMemoria.length}</span>
                <span><strong>Responsável:</strong> ${nomeAdmin}</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th class="text-center" style="width: 5%;">#</th>
                        <th style="width: 75%;">Nome do Setor / Local</th>
                        <th class="text-center" style="width: 20%;">Status</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (setoresAtivos.length > 0) {
        htmlPrint += `<tr><td colspan="3" class="bloco-header text-center">SETORES ATIVOS</td></tr>`;
        setoresAtivos.forEach((setor, index) => {
            htmlPrint += `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td><strong>${setor.nome}</strong></td>
                    <td class="text-center"><span class="status-ativo">ATIVO</span></td>
                </tr>
            `;
        });
        htmlPrint += `
            <tr class="linha-total">
                <td colspan="3" class="text-right">Total de Setores Ativos: <strong>${setoresAtivos.length}</strong></td>
            </tr>
        `;
    }

    if (setoresInativos.length > 0) {
        const borderTop = setoresAtivos.length > 0 ? 'border-top: 2px solid #000;' : '';
        htmlPrint += `<tr><td colspan="3" class="bloco-header text-center" style="${borderTop}">SETORES INATIVOS</td></tr>`;
        setoresInativos.forEach((setor, index) => {
            htmlPrint += `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td style="color: #666;"><strong>${setor.nome}</strong></td>
                    <td class="text-center"><span class="status-inativo">INATIVO</span></td>
                </tr>
            `;
        });
        htmlPrint += `
            <tr class="linha-total">
                <td colspan="3" class="text-right">Total de Setores Inativos: <strong>${setoresInativos.length}</strong></td>
            </tr>
        `;
    }

    htmlPrint += `
                </tbody>
            </table>
            <script>
                window.onload = function() { 
                    setTimeout(() => {
                        window.print(); 
                        setTimeout(() => { window.close(); }, 500); 
                    }, 500);
                };
            </script>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlPrint);
    printWindow.document.close();
}

// =========================================================================
// MÓDULO: RELATÓRIOS E DASHBOARD
// =========================================================================
async function abrirRelatorios() {
    const container = document.getElementById('conteudo-dinamico-admin');
    container.innerHTML = `
        <div class="animate__animated animate__fadeIn">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="fw-bold"><i class="fas fa-chart-pie me-2 text-primary"></i>Dashboard Gerencial</h5>
                <div class="d-flex gap-2">
                    <select id="filtro-modulo-relatorio" class="form-select shadow-sm border-primary fw-bold text-primary" style="min-width: 260px;" onchange="carregarDadosRelatorio()">
                        <option value="manutencao" selected>Módulo: Manutenção</option>
                        <option value="servicos-gerais">Módulo: Serviços Gerais</option>
                        <option value="patrimonio">Módulo: Patrimônio</option>
                        <option value="almoxarifado">Módulo: Almoxarifado</option>
                    </select>
                    <select id="filtro-ano-relatorio" class="form-select shadow-sm" style="min-width: 120px;" onchange="carregarDadosRelatorio()">
                        <option value="2026" selected>2026</option>
                        <option value="2027">2027</option>
                    </select>
                    <button class="btn btn-outline-dark shadow-sm fw-bold d-flex align-items-center" onclick="imprimirRelatorioAtual()"><i class="fas fa-print me-2"></i> Imprimir</button>
                </div>
            </div>

            <ul class="nav nav-tabs mb-3" role="tablist">
                <li class="nav-item"><button class="nav-link active fw-bold text-dark" data-bs-toggle="tab" data-bs-target="#tab-grafico"><i class="fas fa-chart-bar me-1 text-primary"></i> Visão Gráfica</button></li>
                <li class="nav-item"><button class="nav-link fw-bold text-dark" data-bs-toggle="tab" data-bs-target="#tab-lista"><i class="fas fa-list me-1 text-secondary"></i> Visão em Lista</button></li>
            </ul>

            <div class="tab-content">
                <div class="tab-pane fade show active" id="tab-grafico">
                    <div class="row g-3 mb-4">
                        <div class="col-md-4 col-lg"><div class="card border-0 shadow-sm rounded-4 bg-primary text-white h-100"><div class="card-body p-3 d-flex align-items-center"><div class="bg-white bg-opacity-25 p-3 rounded-3 me-2"><i class="fas fa-ticket-alt fs-4"></i></div><div><p class="mb-0 small fw-bold text-uppercase opacity-75" style="font-size:0.7rem;">Total de Chamados</p><h4 class="mb-0 fw-bold" id="kpi-total">0</h4></div></div></div></div>
                        <div class="col-md-4 col-lg"><div class="card border-0 shadow-sm rounded-4 bg-info text-dark h-100"><div class="card-body p-3 d-flex align-items-center"><div class="bg-dark bg-opacity-10 p-3 rounded-3 me-2"><i class="fas fa-star fs-4"></i></div><div><p class="mb-0 small fw-bold text-uppercase opacity-75" style="font-size:0.7rem;">Novos</p><h4 class="mb-0 fw-bold" id="kpi-novos">0</h4></div></div></div></div>
                        <div class="col-md-4 col-lg"><div class="card border-0 shadow-sm rounded-4 bg-warning text-dark h-100"><div class="card-body p-3 d-flex align-items-center"><div class="bg-dark bg-opacity-10 p-3 rounded-3 me-2"><i class="fas fa-clock fs-4"></i></div><div><p class="mb-0 small fw-bold text-uppercase opacity-75" style="font-size:0.7rem;">Em Andamento</p><h4 class="mb-0 fw-bold" id="kpi-andamento">0</h4></div></div></div></div>
                        <div class="col-md-4 col-lg"><div class="card border-0 shadow-sm rounded-4 bg-success text-white h-100"><div class="card-body p-3 d-flex align-items-center"><div class="bg-white bg-opacity-25 p-3 rounded-3 me-2"><i class="fas fa-check-circle fs-4"></i></div><div><p class="mb-0 small fw-bold text-uppercase opacity-75" style="font-size:0.7rem;">Resolvidos</p><h4 class="mb-0 fw-bold" id="kpi-resolvidos">0</h4></div></div></div></div>
                        <div class="col-md-4 col-lg"><div class="card border-0 shadow-sm rounded-4 bg-dark text-white h-100"><div class="card-body p-3 d-flex align-items-center"><div class="bg-white bg-opacity-25 p-3 rounded-3 me-2"><i class="fas fa-chart-line fs-4"></i></div><div><p class="mb-0 small fw-bold text-uppercase opacity-75" style="font-size:0.7rem;">Resolução</p><h4 class="mb-0 fw-bold" id="kpi-taxa">0%</h4></div></div></div></div>
                    </div>

                    <div class="card border-0 shadow-sm rounded-4 p-3 bg-white border-bottom border-primary border-4 mb-4">
                        <div class="card-body">
                            <h6 class="text-center text-muted fw-bold mb-3" id="titulo-grafico-view">Comparativo Mensal</h6>
                            <div style="position: relative; height: 350px; width: 100%;"><canvas id="canvasDashboard"></canvas></div>
                        </div>
                    </div>

                    <div class="row g-3 mt-1 mb-4" id="linha-rankings">
                        <div class="col-md-6 transition-all" id="col-setores">
                            <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-bottom border-warning border-4"><div class="card-body pb-0"><h6 class="text-muted fw-bold mb-3"><i class="fas fa-trophy text-warning me-2"></i>Top 5 Setores Solicitantes</h6><div style="position: relative; height: 250px; width: 100%;"><canvas id="canvasRankingSetores"></canvas></div></div></div>
                        </div>
                        <div class="col-md-6 transition-all" id="col-demandas">
                            <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-bottom border-danger border-4"><div class="card-body pb-0"><h6 class="text-muted fw-bold mb-3" id="titulo-grafico-macro"><i class="fas fa-fire text-danger me-2"></i>Top 5 Demandas</h6><div style="position: relative; height: 250px; width: 100%;"><canvas id="canvasRankingDemandas"></canvas></div></div></div>
                        </div>
                        <div class="col-md-4 d-none transition-all" id="col-itens-micro">
                            <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-bottom border-success border-4"><div class="card-body pb-0"><h6 class="text-success fw-bold mb-3"><i class="fas fa-box-open me-2"></i>Top 5 Itens (Estoque)</h6><div style="position: relative; height: 250px; width: 100%;"><canvas id="canvasRankingItens"></canvas></div></div></div>
                        </div>
                    </div>
                </div>

                <div class="tab-pane fade" id="tab-lista">
                    <div class="table-responsive bg-white rounded-4 shadow-sm p-3" style="max-height: 500px; overflow-y: auto;">
                        <table class="table table-hover align-middle mb-0" style="font-size: 0.9rem;">
                            <thead class="table-light position-sticky top-0 shadow-sm"><tr><th>Protocolo</th><th>Data de Abertura</th><th>Setor Solicitante</th><th class="text-center">Status</th><th class="text-center">Ações</th></tr></thead>
                            <tbody id="tbody-relatorio-lista"><tr><td colspan="5" class="text-center py-4 text-muted">Carregando dados...</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (window.moduloAcessoSessao && window.moduloAcessoSessao !== 'TODOS') {
        const s = document.getElementById('filtro-modulo-relatorio');
        if(s) {
            s.value = window.moduloAcessoSessao; 
            s.disabled = true;
            const div = s.parentElement;
            const aviso = document.createElement('span');
            aviso.className = 'badge bg-warning text-dark align-self-center me-2 py-2 shadow-sm';
            aviso.innerHTML = '<i class="fas fa-lock me-1"></i> Restrito';
            div.insertBefore(aviso, s);
        }
    }
    carregarDadosRelatorio();
}

async function carregarDadosRelatorio() {
    const modulo = document.getElementById('filtro-modulo-relatorio').value;
    const ano = document.getElementById('filtro-ano-relatorio').value;
    const combo = document.getElementById('filtro-modulo-relatorio');
    const nomeModulo = combo.options[combo.selectedIndex].text;
    
    document.getElementById('titulo-grafico-view').innerText = `${nomeModulo} - Comparativo de ${ano}`;
    document.getElementById('tbody-relatorio-lista').innerHTML = `<tr><td colspan="5" class="text-center py-4"><span class="spinner-border text-primary spinner-border-sm me-2"></span>Atualizando...</td></tr>`;

    try {
        const dataGrafico = await fetchAutenticado(`/admin/relatorios/estatisticas?modulo=${modulo}&ano=${ano}&t=${new Date().getTime()}`);
        if (dataGrafico.success) desenharGraficoDashboard(dataGrafico.abertos, dataGrafico.solucionados);

        const dataLista = await fetchAutenticado(`/admin/chamados/${modulo}?t=${new Date().getTime()}`);
        if (dataLista.success) {
            dadosRelatorioAtual = dataLista.dados.filter(c => {
                const dt = c.data_solicitacao || c.data_abertura;
                return dt && new Date(dt).getFullYear().toString() === ano.toString();
            });
            desenharTabelaRelatorio(dadosRelatorioAtual, modulo);
            atualizarKPIs(dadosRelatorioAtual);
            atualizarRankings(dadosRelatorioAtual, modulo); 
        }
    } catch (error) { 
        Swal.fire('Erro', 'Falha ao processar dados de relatórios.', 'error'); 
    }
}

function desenharGraficoDashboard(abertos, solucionados) {
    const ctx = document.getElementById('canvasDashboard');
    if (!ctx) return;
    if (graficoAtual) graficoAtual.destroy();
    graficoAtual = new Chart(ctx, {
        type: 'bar', 
        data: { 
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'], 
            datasets: [ 
                { label: 'Abertos', data: abertos, backgroundColor: 'rgba(54, 162, 235, 0.7)', borderRadius: 4 }, 
                { label: 'Solucionados', data: solucionados, backgroundColor: 'rgba(75, 192, 192, 0.7)', borderRadius: 4 } 
            ] 
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

function atualizarKPIs(lista) {
    let total = lista.length, novo = 0, and = 0, res = 0;
    
    lista.forEach(c => { 
        if (c.status === 'Novo') {
            novo++;
        } else if (['Solucionado', 'Fechado'].includes(c.status)) {
            res++; 
        } else if (c.status !== 'Cancelado') {
            and++; 
        }
    });
    
    document.getElementById('kpi-total').innerText = total;
    document.getElementById('kpi-novos').innerText = novo;
    document.getElementById('kpi-andamento').innerText = and;
    document.getElementById('kpi-resolvidos').innerText = res;
    document.getElementById('kpi-taxa').innerText = total > 0 ? Math.round((res / total) * 100) + '%' : '0%';
}

function desenharTabelaRelatorio(chamados, modulo) {
    const tbody = document.getElementById('tbody-relatorio-lista');
    if (chamados.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5"><i class="fas fa-inbox fs-1 mb-3 opacity-25"></i><br>Nenhum registro.</td></tr>`; 
        return; 
    }

    let html = '';
    const statusLista = ['Novo', 'Em atendimento', 'Pendente', 'Solucionado', 'Fechado', 'Cancelado', 'Reaberto'];
    chamados.forEach((c, i) => {
        let bgClass = 'bg-light text-dark border';
        if (c.status === 'Novo') bgClass = 'bg-info text-dark border-0';
        if (['Em atendimento', 'Em Andamento'].includes(c.status)) bgClass = 'bg-primary text-white border-0';
        if (['Pendente', 'Reaberto'].includes(c.status)) bgClass = 'bg-warning text-dark border-0';
        if (c.status === 'Solucionado') bgClass = 'bg-success text-white border-0';
        if (c.status === 'Fechado') bgClass = 'bg-secondary text-white border-0';
        if (c.status === 'Cancelado') bgClass = 'bg-danger text-white border-0';

        let op = statusLista.map(s => `<option value="${s}" ${c.status === s ? 'selected' : ''} class="bg-white text-dark">${s}</option>`).join('');
        let infoTipo = c.tipo_solicitacao ? `<br><small class="badge bg-light text-muted border mt-1">${c.tipo_solicitacao}</small>` : '';

        html += `<tr><td class="fw-bold text-success">${c.protocolo}</td><td class="small text-muted">${new Date(c.data_solicitacao || c.data_abertura).toLocaleString('pt-BR')}</td>
                <td class="text-dark">${c.origem || c.unidade || c.localizacao || 'N/A'}${infoTipo}</td>
                <td class="text-center"><select class="form-select form-select-sm shadow-sm fw-bold rounded-pill px-3 text-center ${bgClass}" style="width: auto; display: inline-block; background-image: none;" onchange="confirmarTrocaStatus('${c.protocolo}', this.value, '${c.status}', '${modulo}')">${op}</select></td>
                <td class="text-center"><button class="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-none fw-bold" onclick="verDetalhesChamado('${modulo}', ${i})"><i class="fas fa-search me-1"></i> Detalhes</button></td></tr>`;
    });
    tbody.innerHTML = html;
}

function verDetalhesChamado(modulo, index) {
    const c = dadosRelatorioAtual[index];

    if (modulo === 'patrimonio') {
        let itHtml = (c.itens || []).map(i => `
            <tr style="font-size: 1.00rem;">
                <td class="fw-bold text-muted text-nowrap" style="width: 30%;">${i.tombamento || '-'}</td>
                <td class="text-wrap" style="width: 70%;">${i.descricao || '-'}</td>
            </tr>
        `).join('');

        Swal.fire({
            title: `<span class="text-success">${c.protocolo}</span>`,
            html: `
                <div class="text-start">
                    <ul class="list-group list-group-flush small mb-3">
                        <li class="list-group-item"><b>Solicitante:</b> ${c.nome_solicitante || c.solicitante || 'Não informado'}</li>
                        <li class="list-group-item"><b>Local de Origem:</b> ${c.origem || 'Não informado'}</li>
                        <li class="list-group-item"><b>Setor de Destino:</b> <span class="text-primary fw-bold">${c.destino || 'Não informado'}</span></li>
                        <li class="list-group-item"><b>Tipo de Movimentação:</b> ${c.tipo_solicitacao || 'Transferência'}</li>
                    </ul>
                    <h6 class="fw-bold text-success"><i class="fas fa-boxes"></i> Bens Movimentados no Chamado</h6>
                    <div class="table-responsive border rounded">
                        <table class="table table-sm table-striped mb-0 text-start">
                            <thead class="table-light" style="font-size: 0.9rem;">
                                <tr>
                                    <th style="width: 30%;">Tombamento</th>
                                    <th style="width: 70%;">Descrição do Bem</th>
                                </tr>
                            </thead>
                            <tbody>${itHtml || '<tr><td colspan="2" class="text-center">Nenhum bem listado</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>
            `,
            width: 600 // Aumentado para dar mais conforto visual
        });
        
    } else if (modulo === 'almoxarifado') {

        // Almoxarifado (Com coluna de Quantidade e E-Fisco)
        let itHtml = (c.itens || []).map(i => `
            <tr style="font-size: 0.85rem;">
                <td class="fw-bold text-muted text-nowrap" style="width: 15%;">${i.codigo || '-'}</td>
                <td class="text-wrap" style="width: 70%;">${i.descricao || i.descricao_item || '-'}</td>
                <td class="text-center fw-bold text-nowrap" style="width: 15%;">${i.quantidade || 1}x</td>
            </tr>
        `).join('');

        Swal.fire({ 
            title: `<span class="text-success">${c.protocolo}</span>`, 
            html: `
                <div class="text-start">
                    <ul class="list-group list-group-flush small mb-3">
                        <li class="list-group-item"><b>Solicitante:</b> ${c.nome_solicitante || 'Não informado'}</li>
                        <li class="list-group-item"><b>Local:</b> ${c.origem || c.unidade || c.localizacao || 'Não informado'}</li>
                    </ul>
                    <h6 class="fw-bold text-success"><i class="fas fa-tools"></i> Itens Solicitados</h6>
                    <div class="table-responsive border rounded">
                        <table class="table table-sm table-striped mb-0 text-start">
                            <thead class="table-light" style="font-size: 0.9rem;">
                                <tr>
                                    <th style="width: 15%;">E-Fisco</th>
                                    <th style="width: 70%;">Descrição</th>
                                    <th class="text-center" style="width: 15%;">Qtd</th>
                                </tr>
                            </thead>
                            <tbody>${itHtml || '<tr><td colspan="3" class="text-center">Vazio</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>
            `, 
            width: 600 // Aumentado
        });
        
    } else {

        // Manutenção e Serviços Gerais (Sem coluna de Quantidade)
        let itHtml = (c.itens || []).map(i => `
            <tr style="font-size: 1.00rem;">
                <td class="fw-bold text-muted text-nowrap" style="width: 30%;">${i.tipo || i.categoria || '-'}</td>
                <td class="text-wrap" style="width: 70%;">${i.descricao || i.descricao_item || '-'}</td>
            </tr>
        `).join('');

        Swal.fire({ 
            title: `<span class="text-success">${c.protocolo}</span>`, 
            html: `
                <div class="text-start">
                    <ul class="list-group list-group-flush small mb-3">
                        <li class="list-group-item"><b>Solicitante:</b> ${c.nome_solicitante || 'Não informado'}</li>
                        <li class="list-group-item"><b>Local:</b> ${c.origem || c.unidade || c.localizacao || 'Não informado'}</li>
                    </ul>
                    <h6 class="fw-bold text-success"><i class="fas fa-tools"></i> Reparos/Serviços Solicitados</h6>
                    <div class="table-responsive border rounded">
                        <table class="table table-sm table-striped mb-0 text-start">
                            <thead class="table-light" style="font-size: 0.9rem;">
                                <tr>
                                    <th style="width: 30%;">Categoria</th>
                                    <th style="width: 70%;">Descrição do Serviço</th>
                                </tr>
                            </thead>
                            <tbody>${itHtml || '<tr><td colspan="2" class="text-center">Vazio</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>
            `, 
            width: 600 // Aumentado
        });
    }
}

function atualizarRankings(listaChamados, moduloAtual) {
    const contagemSetores = {}, contagemDemandas = {}, contagemItens = {};    

    listaChamados.forEach(chamado => {
        if (chamado.status === 'Cancelado') return; 
        const setor = chamado.origem || chamado.unidade || chamado.localizacao || 'Não Informado';
        contagemSetores[setor] = (contagemSetores[setor] || 0) + 1;

        if (chamado.itens && chamado.itens.length > 0) {
            chamado.itens.forEach(item => {
                let nomeMacro = 'Diversos', nomeMicro = null, qtd = 1;
                if (moduloAtual === 'manutencao') nomeMacro = item.tipo || item.descricao;
                else if (moduloAtual === 'servicos-gerais') nomeMacro = item.categoria || item.descricao;
                else if (moduloAtual === 'patrimonio') nomeMacro = chamado.tipo_solicitacao || 'Transferência';
                else if (moduloAtual === 'almoxarifado') { nomeMacro = item.categoria || 'Uso Geral'; nomeMicro = item.descricao || 'Desconhecido'; qtd = parseInt(item.quantidade) || 1; }

                if (nomeMacro.length > 25) nomeMacro = nomeMacro.substring(0, 25) + '...';
                contagemDemandas[nomeMacro] = (contagemDemandas[nomeMacro] || 0) + 1; 
                if (nomeMicro) {
                    if (nomeMicro.length > 25) nomeMicro = nomeMicro.substring(0, 25) + '...';
                    contagemItens[nomeMicro] = (contagemItens[nomeMicro] || 0) + qtd; 
                }
            });
        }
    });

    const topSetores = Object.entries(contagemSetores).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topDemandas = Object.entries(contagemDemandas).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topItens = Object.entries(contagemItens).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const colSetores = document.getElementById('col-setores');
    const colDemandas = document.getElementById('col-demandas');
    const colItens = document.getElementById('col-itens-micro');

    if (moduloAtual === 'almoxarifado') {
        colSetores.className = 'col-md-4 transition-all';
        colDemandas.className = 'col-md-4 transition-all';
        colItens.classList.remove('d-none');
        document.getElementById('titulo-grafico-macro').innerHTML = '<i class="fas fa-tags text-danger me-2"></i>Categorias mais Pedidas';
    } else {
        colSetores.className = 'col-md-6 transition-all';
        colDemandas.className = 'col-md-6 transition-all';
        colItens.classList.add('d-none');
        document.getElementById('titulo-grafico-macro').innerHTML = '<i class="fas fa-fire text-danger me-2"></i>Top 5 Demandas';
    }

    const criarChart = (idCanvas, ref, tipo, dadosTop, cores, isHorizontal = false) => {
        const ctx = document.getElementById(idCanvas);
        if (ctx) {
            if (ref) ref.destroy();
            
            let chartOptions = { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } 
                } 
            };
            
            if (isHorizontal && tipo === 'bar') chartOptions.indexAxis = 'y';

            return new Chart(ctx, { 
                type: tipo, 
                data: { 
                    labels: dadosTop.map(d => d[0]), 
                    datasets: [{ 
                        data: dadosTop.map(d => d[1]), 
                        backgroundColor: cores, 
                        borderRadius: tipo === 'bar' ? 4 : 0, 
                        borderWidth: 0 
                    }] 
                }, 
                options: chartOptions 
            });
        }
        return ref;
    };

    chartSetores = criarChart('canvasRankingSetores', chartSetores, 'bar', topSetores, 'rgba(255, 159, 64, 0.7)', true);
    chartDemandas = criarChart('canvasRankingDemandas', chartDemandas, 'doughnut', topDemandas, ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff']);
    if (moduloAtual === 'almoxarifado') chartItens = criarChart('canvasRankingItens', chartItens, 'doughnut', topItens, ['#198754', '#20c997', '#0dcaf0', '#ffc107', '#fd7e14']);
}

async function confirmarTrocaStatus(prot, novoS, antigoS, mod) {
    if (novoS === antigoS) return;
    const r = await Swal.fire({ title: 'Alterar Status?', html: `De: <span class="text-danger fw-bold">${antigoS}</span> <i class="fas fa-arrow-right mx-2"></i> Para: <span class="text-success fw-bold">${novoS}</span>?`, icon: 'question', showCancelButton: true, confirmButtonColor: '#0d6efd', confirmButtonText: 'Sim, atualizar' });
    if (r.isConfirmed) {
        try {
            const data = await fetchAutenticado('/admin/relatorios/status', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ protocolo: prot, novoStatus: novoS, modulo: mod, usuarioLogado: obterAdmin() }) });
            if (data.success) {
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Status atualizado!', showConfirmButton: false, timer: 2000 }); 
            } else {
                Swal.fire('Erro', data.message, 'error');
            }
        } catch(e) { Swal.fire('Erro', 'Falha na comunicação.', 'error'); }
    }
    carregarDadosRelatorio();
}

function imprimirRelatorioAtual() { 
    const moduloSelect = document.getElementById('filtro-modulo-relatorio');
    const nomeModulo = moduloSelect.options[moduloSelect.selectedIndex].text;
    const ano = document.getElementById('filtro-ano-relatorio').value;
    const dataHora = new Date().toLocaleString('pt-BR');
    const nomeAdmin = obterAdmin();

    const tabGrafico = document.querySelector('.nav-tabs .nav-link.active').getAttribute('data-bs-target') === '#tab-grafico';

    let htmlPrint = `
        <html>
        <head>
            <title>Relatório Gerencial - ${nomeModulo}</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #000; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .header h2 { margin: 0; padding: 0; font-size: 18px; text-transform: uppercase; }
                .meta { display: flex; justify-content: space-between; font-size: 11px; color: #444; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .text-center { text-align: center; }
                
                .kpi-container { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 5px; }
                .kpi-box { padding: 15px; width: 19%; text-align: center; border-radius: 5px; }
                .kpi-box h3 { margin: 5px 0 0 0; font-size: 18px; }
                .kpi-box p { margin: 0; font-size: 10px; text-transform: uppercase; font-weight: bold; }
                
                .kpi-total { background-color: #0d6efd !important; color: #ffffff !important; border: 1px solid #0d6efd; }
                .kpi-novos { background-color: #0dcaf0 !important; color: #000000 !important; border: 1px solid #0dcaf0; }
                .kpi-andamento { background-color: #ffc107 !important; color: #000000 !important; border: 1px solid #ffc107; }
                .kpi-resolvidos { background-color: #198754 !important; color: #ffffff !important; border: 1px solid #198754; }
                .kpi-taxa { background-color: #212529 !important; color: #ffffff !important; border: 1px solid #212529; }

                .chart-container { text-align: center; margin-bottom: 30px; page-break-inside: avoid; }
                .chart-container img { max-width: 100%; height: auto; max-height: 250px; }
                .row { display: flex; justify-content: space-between; }
                .col { width: 48%; }
                @media print { 
                    @page { margin: 1cm; } 
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Relatório Gerencial - ${nomeModulo}</h2>
                <p style="margin: 5px 0 0 0;">Ano Referência: ${ano}</p>
            </div>
            <div class="meta">
                <span><strong>Emissão:</strong> ${dataHora}</span>
                <span><strong>Responsável:</strong> ${nomeAdmin}</span>
            </div>
    `;

    if (tabGrafico) {
        const kpiTotal = document.getElementById('kpi-total').innerText;
        const kpiNovos = document.getElementById('kpi-novos').innerText;
        const kpiAndamento = document.getElementById('kpi-andamento').innerText;
        const kpiResolvidos = document.getElementById('kpi-resolvidos').innerText;
        const kpiTaxa = document.getElementById('kpi-taxa').innerText;

        htmlPrint += `
            <div class="kpi-container">
                <div class="kpi-box kpi-total"><p>Total</p><h3>${kpiTotal}</h3></div>
                <div class="kpi-box kpi-novos"><p>Novos</p><h3>${kpiNovos}</h3></div>
                <div class="kpi-box kpi-andamento"><p>Andamento</p><h3>${kpiAndamento}</h3></div>
                <div class="kpi-box kpi-resolvidos"><p>Resolvidos</p><h3>${kpiResolvidos}</h3></div>
                <div class="kpi-box kpi-taxa"><p>Taxa Resol.</p><h3>${kpiTaxa}</h3></div>
            </div>
        `;

        const canvasDash = document.getElementById('canvasDashboard');
        if (canvasDash) htmlPrint += `<div class="chart-container"><h3>Comparativo Mensal</h3><img src="${canvasDash.toDataURL('image/png')}"></div>`;

        htmlPrint += `<div class="row">`;
        
        const canvasSetores = document.getElementById('canvasRankingSetores');
        if (canvasSetores) htmlPrint += `<div class="col chart-container"><h3>Top 5 Setores Solicitantes</h3><img src="${canvasSetores.toDataURL('image/png')}"></div>`;

        const canvasDemandas = document.getElementById('canvasRankingDemandas');
        if (canvasDemandas) htmlPrint += `<div class="col chart-container"><h3>Top 5 Demandas</h3><img src="${canvasDemandas.toDataURL('image/png')}"></div>`;

        htmlPrint += `</div>`;

        if (moduloSelect.value === 'almoxarifado') {
            const canvasItens = document.getElementById('canvasRankingItens');
            if (canvasItens) htmlPrint += `<div class="chart-container"><h3>Top 5 Itens (Estoque)</h3><img src="${canvasItens.toDataURL('image/png')}" style="max-height: 250px;"></div>`;
        }

    } else {
        htmlPrint += `
            <table>
                <thead>
                    <tr>
                        <th class="text-center" style="width: 15%;">Protocolo</th>
                        <th style="width: 20%;">Data de Abertura</th>
                        <th style="width: 50%;">Setor do Chamado</th>
                        <th class="text-center" style="width: 15%;">Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (dadosRelatorioAtual.length === 0) {
            htmlPrint += `<tr><td colspan="4" class="text-center">Nenhum chamado registrado.</td></tr>`;
        } else {
            dadosRelatorioAtual.forEach(c => {
                const dataAbertura = new Date(c.data_solicitacao || c.data_abertura).toLocaleString('pt-BR');
                const nome = c.nome_solicitante || 'N/A';
                const local = c.origem || c.unidade || c.localizacao || 'N/A';
                
                htmlPrint += `
                    <tr>
                        <td class="text-center"><strong>${c.protocolo}</strong></td>
                        <td>${dataAbertura}</td>
                        <td><strong>${local}</strong><br><span style="font-size: 10px; color: #555;">Solicitante: ${nome}</span></td>
                        <td class="text-center">${c.status}</td>
                    </tr>
                `;
            });
        }
        htmlPrint += `</tbody></table>`;
    }

    htmlPrint += `
            <script>
                window.onload = function() { 
                    setTimeout(() => {
                        window.print(); 
                        setTimeout(() => { window.close(); }, 500); 
                    }, 500);
                };
            </script>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlPrint);
    printWindow.document.close();
}

// =========================================================================
// MÓDULO: CATÁLOGOS (ALMOXARIFADO E PATRIMÔNIO)
// =========================================================================
async function abrirPainelCatalogos() {
    if (!verificarAcesso('visualizar')) return;
    if (window.moduloAcessoSessao !== 'TODOS' && window.moduloAcessoSessao !== 'almoxarifado' && window.moduloAcessoSessao !== 'patrimonio') { 
        Swal.fire('Acesso Negado', 'Ferramenta exclusiva para Almoxarifado e Patrimônio.', 'error'); 
        return; 
    }

    document.getElementById('conteudo-dinamico-admin').innerHTML = `
        <div class="animate__animated animate__fadeIn">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="fw-bold"><i class="fas fa-book-open me-2 text-info"></i>Gestão de Catálogos</h5>
                <div class="d-flex gap-2">
                    <select id="filtro-modulo-catalogo" class="form-select shadow-sm border-info fw-bold text-info" style="min-width: 280px;" onchange="carregarVisaoCatalogo()">
                        <option value="almoxarifado" selected>Almoxarifado (Materiais)</option>
                        <option value="patrimonio">Patrimônio (Bens Tombados)</option>
                    </select>
                </div>
            </div>
            <div id="area-trabalho-catalogo"></div>
        </div>
    `;
    
    if (window.moduloAcessoSessao && window.moduloAcessoSessao !== 'TODOS') {
        const s = document.getElementById('filtro-modulo-catalogo');
        s.value = window.moduloAcessoSessao; s.disabled = true;
        const aviso = document.createElement('span'); 
        aviso.className = 'badge bg-warning text-dark align-self-center me-2 py-2 shadow-sm'; 
        aviso.innerHTML = '<i class="fas fa-lock me-1"></i> Restrito';
        s.parentElement.insertBefore(aviso, s);
    }
    carregarVisaoCatalogo();
}

function carregarVisaoCatalogo() {
    const m = document.getElementById('filtro-modulo-catalogo').value;
    if (m === 'almoxarifado') renderizarVisaoAlmoxarifado(); else renderizarVisaoPatrimonio();
}

async function renderizarVisaoAlmoxarifado() {
    const area = document.getElementById('area-trabalho-catalogo');
    area.innerHTML = '<div class="text-center py-5"><span class="spinner-border text-info"></span></div>';
    try {
        catalogoAdminMemoria = await fetchAutenticado(`/admin/materiais?t=${new Date().getTime()}`);
        
        area.innerHTML = `
            <div class="animate__animated animate__fadeIn">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="input-group shadow-sm rounded-pill overflow-hidden border bg-white" style="max-width: 400px;">
                        <span class="input-group-text bg-transparent border-0 text-muted ps-3"><i class="fas fa-search"></i></span>
                        <input type="text" id="input-busca-catalogo" class="form-control border-0 shadow-none" placeholder="Pesquisar..." onkeyup="filtrarCatalogo()">
                    </div>
                    <div class="d-flex gap-2 text-nowrap">
                        <button class="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm" onclick="baixarPlanilhaModelo()"><i class="fas fa-file-csv me-1"></i> Modelo CSV</button>
                        <button class="btn btn-primary btn-sm rounded-pill px-3 shadow-sm" onclick="mostrarModalImportacaoCSV()"><i class="fas fa-upload me-1"></i> Importar</button>                        
                        <button class="btn btn-info text-white btn-sm rounded-pill px-3 shadow-sm" onclick="mostrarModalNovoMaterial()"><i class="fas fa-plus me-1"></i> Novo Item</button>
                        <button class="btn btn-outline-dark btn-sm rounded-pill px-3 shadow-sm fw-bold" onclick="imprimirCatalogoEstoque()"><i class="fas fa-print me-1"></i> Inventário</button>
                    </div>
                </div>
                <div class="table-responsive bg-white rounded-4 shadow-sm p-3" style="max-height: 450px; overflow-y: auto;">
                    <table class="table table-hover align-middle mb-0" id="tabela-catalogo">
                        <thead class="table-light position-sticky top-0 shadow-sm text-nowrap">
                            <tr>
                                <th style="cursor: pointer; width: 12%;" onclick="ordenarCatalogo('codigo')">E-Fisco <i id="icone-sort-codigo" class="fas fa-sort ms-1 text-muted opacity-50"></i></th>
                                <th style="cursor: pointer; width: 15%;" onclick="ordenarCatalogo('categoria')">Categoria <i id="icone-sort-categoria" class="fas fa-sort ms-1 text-muted opacity-50"></i></th>
                                <th style="cursor: pointer; width: 43%;" onclick="ordenarCatalogo('descricao')">Descrição <i id="icone-sort-descricao" class="fas fa-sort ms-1 text-muted opacity-50"></i></th>
                                <th class="text-center" style="cursor: pointer; width: 10%;" onclick="ordenarCatalogo('quantidade_estoque')">Estoque <i id="icone-sort-quantidade_estoque" class="fas fa-sort ms-1 text-muted opacity-50"></i></th>
                                <th class="text-center" style="width: 10%;">Status</th>
                                <th class="text-center" style="width: 10%;">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-catalogo-admin"></tbody>
                    </table>
                </div>
            </div>
        `;
        ordenarCatalogo('codigo', 'asc');
    } catch(e) { area.innerHTML = 'Erro ao carregar catálogo.'; }
}

function filtrarCatalogo() {
    const f = document.getElementById('input-busca-catalogo').value.toLowerCase();
    document.querySelectorAll('#tabela-catalogo tbody tr').forEach(r => r.style.display = r.innerText.toLowerCase().includes(f) ? '' : 'none');
}

function ordenarCatalogo(campo, forceDirection = null) {
    if (forceDirection) {
        ordemAtualCatalogo.campo = campo;
        ordemAtualCatalogo.direcao = forceDirection;
    } else if (ordemAtualCatalogo.campo === campo) {
        ordemAtualCatalogo.direcao = ordemAtualCatalogo.direcao === 'asc' ? 'desc' : 'asc';
    } else { 
        ordemAtualCatalogo.campo = campo; 
        ordemAtualCatalogo.direcao = 'asc'; 
    }
    
    catalogoAdminMemoria.sort((a, b) => {
        if (campo === 'quantidade_estoque') {
            const valA = parseInt(a.quantidade_estoque) || 0;
            const valB = parseInt(b.quantidade_estoque) || 0;
            return ordemAtualCatalogo.direcao === 'asc' ? valA - valB : valB - valA;
        } else {
            const cmp = String(a[campo] || '').localeCompare(String(b[campo] || ''), 'pt-BR', { numeric: true });
            return ordemAtualCatalogo.direcao === 'asc' ? cmp : -cmp;
        }
    });

    ['codigo', 'categoria', 'descricao', 'quantidade_estoque'].forEach(c => { 
        const ic = document.getElementById(`icone-sort-${c}`); 
        if(ic) ic.className = 'fas fa-sort ms-1 text-muted opacity-50'; 
    });
    
    const at = document.getElementById(`icone-sort-${campo}`); 
    if (at) at.className = ordemAtualCatalogo.direcao === 'asc' ? 'fas fa-sort-up ms-1 text-primary' : 'fas fa-sort-down ms-1 text-primary';
    
    atualizarTabelaCatalogo();
}

function atualizarTabelaCatalogo() {
    const t = document.getElementById('tbody-catalogo-admin');
    if(catalogoAdminMemoria.length === 0) { t.innerHTML = '<tr><td colspan="6" class="text-center">Vazio</td></tr>'; return; }
    
    t.innerHTML = catalogoAdminMemoria.map(i => {
        const est = parseInt(i.quantidade_estoque) || 0; const min = parseInt(i.estoque_minimo) || 0;
        let cEst = 'text-dark fw-bold', alert = '';
        if (est <= 0) { cEst = 'text-danger fw-bold'; alert = '<i class="fas fa-exclamation-triangle text-danger ms-1 animate__animated animate__flash animate__infinite"></i>'; }
        else if (est <= min) { cEst = 'text-warning fw-bold'; alert = '<i class="fas fa-exclamation-circle text-warning ms-1"></i>'; }
        
        return `<tr class="${i.ativo===1?'':'opacity-50'}">
            <td class="fw-bold text-secondary text-nowrap">${i.codigo}</td>
            <td class="text-secondary fw-bold small text-nowrap">${i.categoria || 'Uso Geral'}</td>
            <td class="text-wrap">${i.descricao}</td>
            <td class="text-center text-nowrap"><span class="${cEst}">${est}</span><div class="small text-muted" style="font-size:0.7rem;">Mín: ${min}</div>${alert}</td>
            <td class="text-center text-nowrap"><button class="btn btn-link p-0 text-decoration-none shadow-none" onclick="alternarStatusMaterialAdmin('${i.codigo}', ${i.ativo ? 0 : 1})"><i class="fas ${i.ativo ? 'fa-toggle-on text-success' : 'fa-toggle-off text-secondary'} fs-3"></i></button></td>
            <td class="text-center text-nowrap"><button class="btn btn-outline-primary btn-sm border-0 me-2" onclick="editarMaterialAdmin('${i.codigo}', \`${i.categoria||''}\`, \`${i.descricao}\`, ${est}, ${min})"><i class="fas fa-edit"></i></button><button class="btn btn-outline-danger btn-sm border-0" onclick="inativarMaterialAdmin('${i.codigo}')"><i class="fas fa-trash-alt"></i></button></td>
        </tr>`;
    }).join('');
}

function mostrarModalNovoMaterial() {
    if (!verificarAcesso('cadastrar')) return;
    
    Swal.fire({ 
        title: 'Cadastrar Item', 
        html: `
            <div class="text-start px-2 mt-3">
                <label class="small text-muted fw-bold">E-Fisco (Código) *</label>
                <input id="sc" class="form-control mb-3" placeholder="Ex: 010203">
                
                <label class="small text-muted fw-bold">Categoria *</label>
                <input id="sca" class="form-control mb-3" placeholder="Ex: Uso Geral">
                
                <label class="small text-muted fw-bold">Descrição *</label>
                <input id="sd" class="form-control mb-3" placeholder="Descrição completa do Material">
                
                <div class="row">
                    <div class="col-6">
                        <label class="small text-muted fw-bold">Estoque Inicial</label>
                        <input id="se-e" type="number" class="form-control" value="0" min="0">
                    </div>
                    <div class="col-6">
                        <label class="small text-danger fw-bold">Estoque Mínimo</label>
                        <input id="se-m" type="number" class="form-control" value="0" min="0">
                    </div>
                </div>
            </div>
        `, 
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonText: '<i class="fas fa-save me-1"></i> Salvar',
        confirmButtonColor: '#198754',
        preConfirm: () => {
            const cod = normalizarCodigo(document.getElementById('sc').value);
            const cat = document.getElementById('sca').value.trim();
            const desc = document.getElementById('sd').value.trim();
            
            if(!cod || !cat || !desc) {
                Swal.showValidationMessage('Preencha E-Fisco, Categoria e Descrição!');
                return false;
            }

            return { 
                codigo: cod, 
                categoria: cat, 
                descricao: desc,
                quantidade_estoque: parseInt(document.getElementById('se-e').value) || 0,
                estoque_minimo: parseInt(document.getElementById('se-m').value) || 0,
                estoque: parseInt(document.getElementById('se-e').value) || 0,
                minimo: parseInt(document.getElementById('se-m').value) || 0
            };
        }
    }).then(async r => {
        if(r.isConfirmed) { 
            const novoItem = r.value;
            const itemExistente = catalogoAdminMemoria.find(m => normalizarCodigo(m.codigo) === novoItem.codigo);
            
            if (itemExistente) {
                const step1 = await Swal.fire({
                    title: 'Código E-Fisco já cadastrado!',
                    html: `O código E-Fisco utilizado já se encontra cadastrado para o item:<br><br>
                           <strong class="text-primary">${itemExistente.descricao}</strong><br><br>
                           Esta operação pode causar <b>quebra de relacionamento</b> no banco de dados para os históricos antigos deste item.<br><br>
                           Deseja continuar e sobrescrever o item?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sim, continuar',
                    cancelButtonText: 'Cancelar'
                });
                
                if (!step1.isConfirmed) return;
                
                const step2 = await Swal.fire({
                    title: 'Confirmação de Segurança',
                    html: 'Esta ação requer confirmação em duas etapas.<br><br>Tem certeza que quer continuar e sobrescrever este item?',
                    icon: 'error',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, sobrescrever',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#d33'
                });
                
                if (!step2.isConfirmed) return;
                
                await enviarLoteParaServidor([novoItem], false); 
            } else {
                await enviarLoteParaServidor([novoItem], false); 
            }
        }
    });
}

function editarMaterialAdmin(codigoAntigo, catAtual, descAtual, estoqueAtual, minimoAtual) {
    if (!verificarAcesso('editar')) return;
    
    const codAntigoSeguro = normalizarCodigo(codigoAntigo);

    Swal.fire({
        title: `Editar Item`, 
        html: `
            <div class="text-start px-2 mt-3">
                <label class="small text-muted fw-bold">E-Fisco (Código) *</label>
                <input id="se-cod" class="form-control mb-3" value="${codAntigoSeguro}">
                
                <label class="small text-muted fw-bold">Categoria</label>
                <input id="se-c" class="form-control mb-3" value="${catAtual}">
                
                <label class="small text-muted fw-bold">Descrição</label>
                <input id="se-d" class="form-control mb-3" value="${descAtual}">
                
                <div class="row">
                    <div class="col-6"><label class="small text-muted fw-bold">Estoque</label><input id="se-e" type="number" class="form-control" value="${estoqueAtual}"></div>
                    <div class="col-6"><label class="small text-danger fw-bold">Mínimo</label><input id="se-m" type="number" class="form-control" value="${minimoAtual}"></div>
                </div>
            </div>
        `, 
        showCancelButton: true, 
        confirmButtonText: 'Atualizar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0d6efd',
        preConfirm: () => {
            const novoCod = normalizarCodigo(document.getElementById('se-cod').value);
            if(!novoCod) {
                Swal.showValidationMessage('O E-Fisco não pode ficar em branco!');
                return false;
            }
            return { 
                codigoAntigo: codAntigoSeguro,
                novoCodigo: novoCod,
                novaCategoria: document.getElementById('se-c').value.trim(), 
                novaDescricao: document.getElementById('se-d').value.trim(), 
                novoEstoque: parseInt(document.getElementById('se-e').value) || 0, 
                novoMinimo: parseInt(document.getElementById('se-m').value) || 0 
            }
        }
    }).then(async r => {
        if (r.isConfirmed) {
            const payload = r.value;

            const codAntigoStr = String(payload.codigoAntigo).trim();
            const novoCodStr = String(payload.novoCodigo).trim();

            if (novoCodStr !== codAntigoStr) {
                
                const itemExistente = catalogoAdminMemoria.find(m => normalizarCodigo(m.codigo) === novoCodStr);
                
                let title1 = '';
                let html1 = '';

                if (itemExistente) {
                    title1 = 'Código E-Fisco já cadastrado!';
                    html1 = `O código E-Fisco utilizado já se encontra cadastrado para o item:<br><br>
                             <strong class="text-primary">${itemExistente.descricao}</strong><br><br>
                             Ao continuar, você irá sobrescrever o item e pode causar <b>quebra de relacionamento</b> em chamados antigos.<br><br>
                             Deseja continuar e sobrescrever este item?`;
                } else {
                    title1 = 'Atenção: Alteração de E-Fisco!';
                    html1 = `Você está prestes a alterar o código E-Fisco de <b>${codAntigoStr}</b> para <b>${novoCodStr}</b>.<br><br>
                             Esta operação altera a identidade do item e pode causar <b>quebra de relacionamento</b> no banco de dados para os históricos de chamados antigos.<br><br>
                             Deseja continuar com a alteração?`;
                }

                const step1 = await Swal.fire({
                    title: title1,
                    html: html1,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, continuar',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#d33'
                });
                
                if (!step1.isConfirmed) return; 
                
                const step2 = await Swal.fire({
                    title: 'Confirmação de Segurança',
                    html: 'Esta ação requer confirmação em duas etapas.<br><br>Tem certeza que quer continuar e alterar o E-Fisco?',
                    icon: 'error',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, confirmar',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#d33'
                });
                
                if (!step2.isConfirmed) return; 
            }

            try {
                const data = await fetchAutenticado('/admin/materiais/editar', { 
                    method: 'PUT', 
                    headers: {'Content-Type':'application/json'}, 
                    body: JSON.stringify({...payload, usuarioLogado: obterAdmin()}) 
                });
                
                if(data.success) { 
                    Swal.fire({toast:true, icon:'success', title:'Atualizado com sucesso!', timer:2000}); 
                    renderizarVisaoAlmoxarifado(); 
                } else {
                    Swal.fire('Erro', data.message, 'error');
                }
            } catch(err) {
                Swal.fire('Erro', 'Falha ao conectar com o servidor.', 'error');
            }
        }
    });
}

function baixarPlanilhaModelo() { 
    const cabecalhos = "E-Fisco;Categoria;Descricao;Estoque;Estoque_Minimo\n";
    const linhasExemplo = "010203;Uso Geral;Caneta Esferográfica Azul;100;20\n040506;Limpeza;Desinfetante 1L;50;10\n070809;Informática;Mouse Óptico;15;5\n";
    
    const blob = new Blob(["\uFEFF" + cabecalhos + linhasExemplo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo_importacao_materiais.csv";
    link.style.display = 'none'; 
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}

function mostrarModalImportacaoCSV() { 
    if (!verificarAcesso('cadastrar')) return;

    Swal.fire({
        title: 'Importar Lote de Materiais',
        html: `
            <div class="text-start">
                <p class="small text-muted mb-2">Selecione o arquivo <b>.csv</b> (separado por ponto e vírgula) no mesmo formato do modelo fornecido.</p>
                <input type="file" id="input-arquivo-csv" class="form-control border-primary shadow-sm" accept=".csv">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-cogs me-1"></i> Processar Arquivo',
        confirmButtonColor: '#0d6efd',
        preConfirm: () => {
            const fileInput = document.getElementById('input-arquivo-csv');
            if (!fileInput.files || fileInput.files.length === 0) {
                Swal.showValidationMessage('Selecione um arquivo .csv primeiro.');
                return false;
            }
            return fileInput.files[0];
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const arquivo = result.value;
            const reader = new FileReader();

            reader.onload = function(e) {
                const conteudo = e.target.result;
                processarConteudoCSV(conteudo);
            };

            reader.onerror = function() {
                Swal.fire('Erro', 'Não foi possível ler o arquivo.', 'error');
            };

            reader.readAsText(arquivo, 'windows-1252');
        }
    });
}

function processarConteudoCSV(conteudo) {
    const linhas = conteudo.split(/\r?\n/).filter(linha => linha.trim() !== '');

    if (linhas.length === 0) {
        Swal.fire('Aviso', 'O arquivo CSV está vazio.', 'warning');
        return;
    }

    const itensParaImportar = [];
    const itensIgnorados = [];

    // Lê desde a primeira linha (index 0). Se for cabeçalho, pula.
    for (let i = 0; i < linhas.length; i++) {
        let linhaLimpa = linhas[i].replace(/"/g, ''); 
        const colunas = linhaLimpa.split(';');

        let codigo = normalizarCodigo((colunas[0] || '').trim());
        
        // Trava Inteligente de Cabeçalho
        if (codigo.toLowerCase().includes('e-fisco') || codigo.toLowerCase().includes('código') || codigo.toLowerCase().includes('codigo')) {
            continue; 
        }

        const categoria = (colunas[1] || 'Uso Geral').trim();
        const descricao = (colunas[2] || '').trim();

        const rawEstoque = (colunas[3] || '').trim();
        const quantidade_estoque = rawEstoque === '' ? 0 : parseInt(rawEstoque, 10) || 0;

        const rawMinimo = (colunas[4] || '').trim();
        const estoque_minimo = rawMinimo === '' ? 0 : parseInt(rawMinimo, 10) || 0;

        if (codigo && descricao) {
            const existeNoSistema = catalogoAdminMemoria.find(m => normalizarCodigo(m.codigo) === codigo);
            if (existeNoSistema) {
                itensIgnorados.push(codigo);
            } else {
                itensParaImportar.push({
                    codigo: codigo,
                    categoria: categoria,
                    descricao: descricao,
                    quantidade_estoque: quantidade_estoque, 
                    estoque_minimo: estoque_minimo,
                    estoque: quantidade_estoque,
                    minimo: estoque_minimo
                });
            }
        }
    }

    if (itensParaImportar.length === 0 && itensIgnorados.length > 0) {
        Swal.fire('Aviso', 'Todos os itens da planilha já estão cadastrados (E-Fisco duplicado). Nenhuma importação realizada.', 'warning');
        return;
    } else if (itensParaImportar.length === 0) {
        Swal.fire('Aviso', 'Nenhum material válido encontrado. Verifique se usou ponto e vírgula (;)', 'warning');
        return;
    }

    enviarLoteParaServidor(itensParaImportar, itensIgnorados.length > 0);
}

async function enviarLoteParaServidor(itensJSON, teveItensIgnorados = false) {
    Swal.fire({ title: 'Sincronizando com o Banco...', didOpen: () => Swal.showLoading() });
    
    try {
        const data = await fetchAutenticado('/admin/materiais/importar', { 
            method: 'POST', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify({itens: itensJSON, usuarioLogado: obterAdmin()}) 
        });
        
        if(data.success) { 
            if (teveItensIgnorados) {
                Swal.fire('Importação Parcial', `<b>${itensJSON.length}</b> materiais novos importados com sucesso.<br><br><span class="text-warning">A planilha não foi totalmente importada porque já existem códigos E-Fisco cadastrados que foram ignorados por segurança.</span>`, 'warning');
            } else {
                Swal.fire('Sucesso!', `<b>${itensJSON.length}</b> materiais cadastrados no banco de dados.`, 'success'); 
            }
            renderizarVisaoAlmoxarifado(); 
        } else {
            Swal.fire('Erro', data.message, 'error');
        }
    } catch(err) {
        Swal.fire('Erro', 'Falha ao conectar com o servidor.', 'error');
    }
}

function alternarStatusMaterialAdmin(codigo, novoStatus) { fetchAutenticado('/admin/materiais/status', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({codigo, ativo: novoStatus, usuarioLogado: obterAdmin()}) }).then(d => { if(d.success) renderizarVisaoAlmoxarifado(); }); }
function inativarMaterialAdmin(codigo) { Swal.fire({title:'Excluir?', showCancelButton: true}).then(async r => { if(r.isConfirmed) { const data = await fetchAutenticado(`/admin/materiais/${codigo}`, {method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({usuarioLogado: obterAdmin()})}); if(data.success) renderizarVisaoAlmoxarifado(); else Swal.fire('Aviso', 'Item com histórico não pode ser apagado.', 'info'); } }); }

function imprimirCatalogoEstoque() { 
    if (!catalogoAdminMemoria || catalogoAdminMemoria.length === 0) {
        Swal.fire('Aviso', 'O catálogo de materiais está vazio.', 'info');
        return;
    }

    const dataHora = new Date().toLocaleString('pt-BR');
    const nomeAdmin = obterAdmin();

    let htmlPrint = `
        <html>
        <head>
            <title>Inventário Físico - Almoxarifado</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #000; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h2 { margin: 0; padding: 0; font-size: 18px; text-transform: uppercase; }
                .meta { display: flex; justify-content: space-between; font-size: 11px; color: #444; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .text-center { text-align: center; }
                
                .col-efisco { width: 12%; }
                .col-cat { width: 15%; }
                .col-desc { width: 43%; }
                .col-estoque { width: 15%; text-align: center; }
                .col-conferencia { width: 15%; }
                
                .sig-container { display: flex; justify-content: space-around; margin-top: 50px; }
                .sig-box { border-top: 1px solid #000; width: 35%; text-align: center; padding-top: 5px; font-size: 12px; }
                .item-inativo { color: #888; text-decoration: line-through; }
                
                @media print { 
                    @page { margin: 1cm; } 
                    tr { page-break-inside: avoid; } 
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Ficha de Inventário Físico - Almoxarifado</h2>
            </div>
            <div class="meta">
                <span><strong>Emissão:</strong> ${dataHora}</span>
                <span><strong>Total de Itens:</strong> ${catalogoAdminMemoria.length}</span>
                <span><strong>Responsável:</strong> ${nomeAdmin}</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th class="col-efisco text-center">E-Fisco</th>
                        <th class="col-cat">Categoria</th>
                        <th class="col-desc">Descrição do Material</th>
                        <th class="col-estoque">Estoque (Sistema)</th>
                        <th class="col-conferencia">Conferência (Físico)</th>
                    </tr>
                </thead>
                <tbody>
    `;

    catalogoAdminMemoria.forEach(item => {
        const classInativo = item.ativo === 0 ? 'item-inativo' : '';
        const tagInativo = item.ativo === 0 ? ' <small>(INATIVO)</small>' : '';
        
        htmlPrint += `
            <tr class="${classInativo}">
                <td class="text-center"><strong>${item.codigo}</strong></td>
                <td>${item.categoria || 'Uso Geral'}</td>
                <td>${item.descricao}${tagInativo}</td>
                <td class="text-center">${item.quantidade_estoque || 0}</td>
                <td></td> 
            </tr>
        `;
    });

    htmlPrint += `
                </tbody>
            </table>
            <div class="sig-container">
                <div class="sig-box">Assinatura do Conferente</div>
                <div class="sig-box">Visto da Chefia do Setor</div>
            </div>
            <script>
                window.onload = function() { 
                    window.print(); 
                    setTimeout(() => { window.close(); }, 500); 
                };
            </script>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlPrint);
    printWindow.document.close();
}

// =========================================================================
// MÓDULO: PATRIMÔNIO (LAYOUT AJUSTADO PARA EVITAR ESMAGAMENTO DO BADGE)
// =========================================================================
async function renderizarVisaoPatrimonio() {
    const area = document.getElementById('area-trabalho-catalogo');
    area.innerHTML = '<div class="text-center py-5"><span class="spinner-border text-primary"></span></div>';
    try {
        let optionsSetores = '';
        if(window.obterSetores) { 
            const sets = await window.obterSetores(); 
            optionsSetores = sets.map(s => `<option value="${s}">${s}</option>`).join(''); 
        }

        // NOVO LAYOUT DO CABEÇALHO COM FLEX-WRAP, LIMITES MÁXIMOS E TAMANHO MÍNIMO NO BADGE DE TOTAL
        area.innerHTML = `
            <div class="animate__animated animate__fadeIn">
                
                <div class="mb-3">
                                                            
                    <div class="d-flex gap-2 align-items-center flex-wrap justify-content-end">
                        <span class="badge bg-white text-dark border shadow-sm p-2 px-3 d-flex align-items-center justify-content-center" style="font-size: 0.9rem; min-width: 90px;">
                            <i class="fas fa-boxes text-primary me-2"></i> <strong id="qtd-itens-patri" class="fs-6">0</strong>
                        </span>
                        <button class="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm" onclick="baixarPlanilhaModeloPatrimonio()"><i class="fas fa-file-csv me-1"></i> Modelo CSV</button>
                        <button class="btn btn-primary btn-sm rounded-pill px-3 shadow-sm" onclick="mostrarModalImportacaoCSVPatrimonio()"><i class="fas fa-upload me-1"></i> Importar</button>
                        <button class="btn btn-info text-white btn-sm rounded-pill px-3 shadow-sm" onclick="mostrarModalNovoBem()"><i class="fas fa-plus me-1"></i> Novo Bem</button>
                        <button class="btn btn-outline-dark btn-sm rounded-pill px-3 shadow-sm fw-bold" onclick="prepararImpressaoPatrimonio()"><i class="fas fa-print me-1"></i> Inventário</button>
                    </div>

                    <br>

                    <div class="d-flex gap-2 mb-3 justify-content-start">
                        <select id="filtro-setor-patrimonio" class="form-select shadow-sm rounded-pill" onchange="carregarItensPatrimonio()" style="max-width: 250px;">
                            <option value="TODOS">Todos Setores</option>${optionsSetores}
                        </select>
                        <div class="input-group shadow-sm rounded-pill overflow-hidden border bg-white" style="max-width: 300px;">
                            <span class="input-group-text bg-transparent border-0 text-muted ps-3"><i class="fas fa-search"></i></span>
                            <input type="text" id="input-busca-bens" class="form-control border-0 shadow-none" placeholder="Pesquisar..." onkeyup="filtrarBens()">
                        </div>
                    </div>
                    
                </div>
                
                <div class="table-responsive bg-white rounded-4 shadow-sm p-3" style="max-height: 450px; overflow-y: auto;">
                    <table class="table table-hover align-middle mb-0" id="tabela-bens">
                        <thead class="table-light position-sticky top-0 shadow-sm text-nowrap">
                            <tr>
                                <th style="cursor:pointer; width: 12%; white-space: nowrap;" onclick="ordenarCatalogoPatrimonio('tombamento')">Tombamento <i id="icone-sort-patri-tombamento" class="fas fa-sort ms-1 text-muted opacity-50"></i></th>
                                <th style="cursor:pointer; width: 45%; white-space: nowrap;" onclick="ordenarCatalogoPatrimonio('descricao')">Descrição <i id="icone-sort-patri-descricao" class="fas fa-sort ms-1 text-muted opacity-50"></i></th>
                                <th style="cursor:pointer; width: 18%; white-space: nowrap;" onclick="ordenarCatalogoPatrimonio('setor_atual')">Local <i id="icone-sort-patri-setor_atual" class="fas fa-sort ms-1 text-muted opacity-50"></i></th>
                                <th style="cursor:pointer; width: 10%;" onclick="ordenarCatalogoPatrimonio('estado_conservacao')">Estado <i id="icone-sort-patri-estado_conservacao" class="fas fa-sort ms-1 text-muted opacity-50"></i></th>
                                <th class="text-center" style="width: 5%;">Status</th>
                                <th class="text-center" style="width: 10%;">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-patrimonio-admin"></tbody>
                    </table>
                </div>
            </div>
        `;
        carregarItensPatrimonio();
    } catch(e) { area.innerHTML = 'Erro ao carregar.'; }
}

async function carregarItensPatrimonio() {
    const setor = document.getElementById('filtro-setor-patrimonio').value;
    
    catalogoPatrimonioMemoria = await fetchAutenticado(`/admin/patrimonio/itens?setor=${encodeURIComponent(setor)}&t=${new Date().getTime()}`);
    
    document.getElementById('qtd-itens-patri').innerText = catalogoPatrimonioMemoria.length;
    ordenarCatalogoPatrimonio('tombamento', 'asc');
}

function atualizarTabelaPatrimonio() {
    const t = document.getElementById('tbody-patrimonio-admin');
    if (!t) return;
    t.innerHTML = catalogoPatrimonioMemoria.map(i => {
        let corEstado = '';
        let estadoFormatado = i.estado_conservacao || '-';
        
        if (estadoFormatado === 'INSERVÍVEL/OBSOLETO') {
            corEstado = 'text-danger fw-bold';
            estadoFormatado = 'INSERVÍVEL/<br>OBSOLETO';
        }
        else if (estadoFormatado === 'RUIM (REPARÁVEL)') {
            corEstado = 'text-warning fw-bold text-dark';
        }
        
        return `<tr class="${i.ativo===1?'':'opacity-50'}">
            <td class="fw-bold text-primary text-nowrap">${i.tombamento}</td>
            <td class="text-wrap">${i.descricao}</td>
            <td class="small fw-bold text-secondary text-nowrap">${i.setor_atual || 'Não alocado'}</td>
            <td class="${corEstado}" style="line-height: 1.2; font-size: 0.85rem;">${estadoFormatado}</td>
            <td class="text-center text-nowrap"><button class="btn btn-link p-0 shadow-none" onclick="alternarStatusBem('${i.tombamento}', ${i.ativo ? 0 : 1})"><i class="fas ${i.ativo ? 'fa-toggle-on text-success' : 'fa-toggle-off text-secondary'} fs-3"></i></button></td>
            <td class="text-center text-nowrap"><button class="btn btn-outline-primary btn-sm border-0 me-2" onclick="editarBemAdmin('${i.tombamento}')"><i class="fas fa-edit"></i></button><button class="btn btn-outline-danger btn-sm border-0" onclick="excluirBemAdmin('${i.tombamento}')"><i class="fas fa-trash-alt"></i></button></td>
        </tr>`;
    }).join('') || '<tr><td colspan="6" class="text-center">Vazio</td></tr>';
}

function filtrarBens() { const v = document.getElementById('input-busca-bens').value.toLowerCase(); document.querySelectorAll('#tabela-bens tbody tr').forEach(r => r.style.display = r.innerText.toLowerCase().includes(v) ? '' : 'none'); }

function ordenarCatalogoPatrimonio(c, forceDirection = null) { 
    if(forceDirection) {
        ordemAtualPatrimonio.campo = c;
        ordemAtualPatrimonio.direcao = forceDirection;
    } else if(ordemAtualPatrimonio.campo===c) {
        ordemAtualPatrimonio.direcao = ordemAtualPatrimonio.direcao==='asc'?'desc':'asc'; 
    } else { 
        ordemAtualPatrimonio.campo=c; 
        ordemAtualPatrimonio.direcao='asc'; 
    } 
    
    catalogoPatrimonioMemoria.sort((a,b) => { 
        const cmp = String(a[c]||'').localeCompare(String(b[c]||''),'pt-BR',{numeric:true}); 
        return ordemAtualPatrimonio.direcao==='asc'?cmp:-cmp; 
    }); 
    
    ['tombamento', 'descricao', 'setor_atual', 'estado_conservacao'].forEach(col => {
        const ic = document.getElementById(`icone-sort-patri-${col}`); 
        if(ic) ic.className = 'fas fa-sort ms-1 text-muted opacity-50'; 
    });
    
    const at = document.getElementById(`icone-sort-patri-${c}`); 
    if (at) at.className = ordemAtualPatrimonio.direcao === 'asc' ? 'fas fa-sort-up ms-1 text-primary' : 'fas fa-sort-down ms-1 text-primary';
    
    atualizarTabelaPatrimonio(); 
}

// CRIAÇÃO MANUAL DE NOVO BEM
async function mostrarModalNovoBem() { 
    if(!verificarAcesso('cadastrar')) return; 

    let optionsSetores = '<option value="" selected disabled>Selecione o Local...</option>';
    try {
        const setores = await fetchAutenticado(`/admin/setores?t=${new Date().getTime()}`);
        if (setores && Array.isArray(setores)) {
            setores.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).forEach(s => {
                optionsSetores += `<option value="${s.nome}">${s.nome}</option>`;
            });
        }
    } catch(e) {}

    Swal.fire({ 
        title: 'Cadastrar Novo Bem', 
        html: `
            <div class="text-start px-2 mt-3">
                <label class="small text-muted fw-bold">Tombamento *</label>
                <input id="swal-tombamento" class="form-control mb-3" placeholder="Ex: CPRH-123456" style="text-transform: uppercase;">
                
                <label class="small text-muted fw-bold">Descrição do Bem *</label>
                <input id="swal-descricao" class="form-control mb-3" placeholder="Ex: CADEIRA GIRATÓRIA" style="text-transform: uppercase;">
                
                <div class="row">
                    <div class="col-md-6">
                        <label class="small text-muted fw-bold">Local (Setor Atual) *</label>
                        <select id="swal-setor" class="form-select mb-3 border-primary">${optionsSetores}</select>
                    </div>
                    <div class="col-md-6">
                        <label class="small text-muted fw-bold">Estado de Conservação *</label>
                        <select id="swal-estado" class="form-select mb-3 border-primary">
                            <option value="NOVO" selected>NOVO</option>
                            <option value="EM BOM ESTADO">EM BOM ESTADO</option>
                            <option value="USADO">USADO</option>
                            <option value="RUIM (REPARÁVEL)">RUIM (REPARÁVEL)</option>
                            <option value="INSERVÍVEL/OBSOLETO">INSERVÍVEL/OBSOLETO</option>
                        </select>
                    </div>
                </div>
            </div>
        `, 
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-save me-1"></i> Salvar',
        confirmButtonColor: '#198754',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const t = document.getElementById('swal-tombamento').value.trim().toUpperCase();
            const d = document.getElementById('swal-descricao').value.trim().toUpperCase();
            const s = document.getElementById('swal-setor').value.toUpperCase();
            const e = document.getElementById('swal-estado').value.toUpperCase();
            
            if(!t || !d || !s || !e) {
                Swal.showValidationMessage('Por favor, preencha o Tombamento, a Descrição, o Local e o Estado!');
                return false;
            }

            const existe = catalogoPatrimonioMemoria.find(m => String(m.tombamento).trim().toUpperCase() === t);
            if (existe) {
                Swal.showValidationMessage(`O Tombamento ${t} já está cadastrado no sistema (${existe.descricao}).`);
                return false;
            }

            return { tombamento: t, descricao: d, setor: s, estado: e };
        } 
    }).then(async r => { 
        if(r.isConfirmed) { 
            try {
                const data = await fetchAutenticado('/admin/patrimonio/catalogo/novo', { 
                    method: 'POST', 
                    headers: {'Content-Type':'application/json'}, 
                    body: JSON.stringify({...r.value, usuarioLogado: obterAdmin()})
                }); 
                
                if (data.success) {
                    Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Bem Patrimonial cadastrado!', showConfirmButton: false, timer: 2000});
                    carregarItensPatrimonio(); 
                } else {
                    Swal.fire('Erro', data.message, 'error');
                }
            } catch(error) { Swal.fire('Erro', 'Falha ao processar.', 'error'); }
        } 
    }); 
}

// EDIÇÃO DO BEM
async function editarBemAdmin(tombamentoAtual) {
    if (!verificarAcesso('editar')) return;
    
    const bem = catalogoPatrimonioMemoria.find(m => m.tombamento === tombamentoAtual);
    if (!bem) return Swal.fire('Erro', 'Bem não encontrado na memória.', 'error');

    let optionsSetores = '';
    try {
        const setores = await fetchAutenticado(`/admin/setores?t=${new Date().getTime()}`);
        if (setores && Array.isArray(setores)) {
            setores.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).forEach(s => {
                const sel = (s.nome.toUpperCase() === (bem.setor_atual || '').toUpperCase()) ? 'selected' : '';
                optionsSetores += `<option value="${s.nome}" ${sel}>${s.nome}</option>`;
            });
        }
    } catch(e) {}

    const estados = ['NOVO', 'EM BOM ESTADO', 'USADO', 'RUIM (REPARÁVEL)', 'INSERVÍVEL/OBSOLETO'];
    let optionsEstados = estados.map(est => {
        const sel = (est === (bem.estado_conservacao || 'NOVO').toUpperCase()) ? 'selected' : '';
        return `<option value="${est}" ${sel}>${est}</option>`;
    }).join('');

    Swal.fire({
        title: 'Editar Bem Patrimonial',
        html: `
            <div class="text-start px-2 mt-3">
                <label class="small text-muted fw-bold">Tombamento *</label>
                <input id="swal-edit-tombamento" class="form-control mb-3" value="${bem.tombamento}" style="text-transform: uppercase;">
                
                <label class="small text-muted fw-bold">Descrição do Bem *</label>
                <input id="swal-edit-descricao" class="form-control mb-3" value="${bem.descricao}" style="text-transform: uppercase;">
                
                <div class="row">
                    <div class="col-md-6">
                        <label class="small text-muted fw-bold">Local (Setor Atual) *</label>
                        <select id="swal-edit-setor" class="form-select mb-3 border-primary">${optionsSetores}</select>
                    </div>
                    <div class="col-md-6">
                        <label class="small text-muted fw-bold">Estado de Conservação *</label>
                        <select id="swal-edit-estado" class="form-select mb-3 border-primary">
                            ${optionsEstados}
                        </select>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-save me-1"></i> Atualizar',
        confirmButtonColor: '#0d6efd',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const tNovo = document.getElementById('swal-edit-tombamento').value.trim().toUpperCase();
            const d = document.getElementById('swal-edit-descricao').value.trim().toUpperCase();
            const s = document.getElementById('swal-edit-setor').value.toUpperCase();
            const e = document.getElementById('swal-edit-estado').value.toUpperCase();
            
            if(!tNovo || !d || !s || !e) {
                Swal.showValidationMessage('Preencha todos os campos obrigatórios!');
                return false;
            }

            if (tNovo !== tombamentoAtual.toUpperCase()) {
                const existe = catalogoPatrimonioMemoria.find(m => String(m.tombamento).trim().toUpperCase() === tNovo);
                if (existe) {
                    Swal.showValidationMessage(`Bloqueado: O Tombamento ${tNovo} já pertence ao item: ${existe.descricao}.`);
                    return false;
                }
            }

            return { tombamentoAntigo: tombamentoAtual, novoTombamento: tNovo, descricao: d, setor: s, estado: e };
        }
    }).then(async r => {
        if (r.isConfirmed) {
            try {
                const data = await fetchAutenticado('/admin/patrimonio/catalogo/editar', {
                    method: 'PUT',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({...r.value, usuarioLogado: obterAdmin()})
                });
                
                if (data.success) {
                    Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Bem atualizado!', showConfirmButton: false, timer: 2000});
                    carregarItensPatrimonio(); 
                } else {
                    Swal.fire('Erro', data.message, 'error');
                }
            } catch(error) { Swal.fire('Erro', 'Falha ao processar.', 'error'); }
        }
    });
}

function baixarPlanilhaModeloPatrimonio() {
    const cabecalhos = "Tombamento;Descricao;Local;Estado\n";
    const linhasExemplo = 
        "CPRH-123456;MESA DE ESCRITÓRIO;RECEPÇÃO;NOVO\n" +
        "CPRH-234567;CADEIRA GIRATÓRIA;TI;EM BOM ESTADO\n" +
        "CPRH-345678;ARMÁRIO DE AÇO;ALMOXARIFADO;USADO\n" +
        "CPRH-456789;AR CONDICIONADO;DIRETORIA;RUIM (REPARÁVEL)\n" +
        "CPRH-567890;COMPUTADOR ANTIGO;DEPÓSITO;INSERVÍVEL/OBSOLETO\n";
    
    const blob = new Blob(["\uFEFF" + cabecalhos + linhasExemplo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo_importacao_patrimonio.csv";
    link.style.display = "none"; 
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}

function mostrarModalImportacaoCSVPatrimonio() {
    if (!verificarAcesso('cadastrar')) return;

    Swal.fire({
        title: 'Importar Lote de Patrimônio',
        html: `
            <div class="text-start">
                <p class="small text-muted mb-2">Selecione o arquivo <b>.csv</b> (separado por ponto e vírgula) no mesmo formato do modelo fornecido.</p>
                <input type="file" id="input-arquivo-csv-patri" class="form-control border-primary shadow-sm" accept=".csv">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-cogs me-1"></i> Processar Arquivo',
        confirmButtonColor: '#0d6efd',
        preConfirm: () => {
            const fileInput = document.getElementById('input-arquivo-csv-patri');
            if (!fileInput.files || fileInput.files.length === 0) {
                Swal.showValidationMessage('Selecione um arquivo .csv primeiro.');
                return false;
            }
            return fileInput.files[0];
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const arquivo = result.value;
            const reader = new FileReader();

            reader.onload = function(e) {
                processarConteudoCSVPatrimonio(e.target.result);
            };

            reader.onerror = function() {
                Swal.fire('Erro', 'Não foi possível ler o arquivo.', 'error');
            };

            reader.readAsText(arquivo, 'windows-1252'); 
        }
    });
}

function processarConteudoCSVPatrimonio(conteudo) {
    const linhas = conteudo.split(/\r?\n/).filter(linha => linha.trim() !== '');

    if (linhas.length === 0) {
        Swal.fire('Aviso', 'O arquivo CSV está vazio.', 'warning');
        return;
    }

    const itensParaImportar = [];
    const itensIgnorados = [];
    let errosFronteira = [];

    for (let i = 0; i < linhas.length; i++) {
        let linhaLimpa = linhas[i].replace(/"/g, ''); 
        const colunas = linhaLimpa.split(';');

        let tombamento = (colunas[0] || '').trim().toUpperCase();
        const descricao = (colunas[1] || '').trim().toUpperCase();
        const setor = (colunas[2] || 'NÃO ALOCADO').trim().toUpperCase();
        const estado = (colunas[3] || 'NOVO').trim().toUpperCase(); 

        if (tombamento.includes('TOMBAMENTO')) {
            continue; 
        }

        const estadosPermitidos = ['NOVO', 'EM BOM ESTADO', 'USADO', 'RUIM (REPARÁVEL)', 'INSERVÍVEL/OBSOLETO'];
        let estadoFinal = estado;
        if (!estadosPermitidos.includes(estado)) {
            errosFronteira.push(`Tombamento ${tombamento}: Estado "${estado}" é inválido. Assumindo "NOVO".`);
            estadoFinal = 'NOVO';
        }

        if (tombamento && descricao) {
            const existeNoSistema = catalogoPatrimonioMemoria.find(m => String(m.tombamento).trim().toUpperCase() === tombamento);
            
            if (existeNoSistema) {
                itensIgnorados.push(tombamento);
            } else {
                const existeNaLista = itensParaImportar.find(m => String(m.tombamento).trim().toUpperCase() === tombamento);
                if (!existeNaLista) {
                    itensParaImportar.push({
                        tombamento: tombamento,
                        descricao: descricao,
                        setor: setor,
                        estado: estadoFinal
                    });
                }
            }
        }
    }

    if (itensParaImportar.length === 0 && itensIgnorados.length > 0) {
        Swal.fire('Aviso', 'Todos os bens desta planilha já estão cadastrados (Tombamentos Duplicados). Nenhuma importação realizada.', 'warning');
        return;
    } else if (itensParaImportar.length === 0) {
        Swal.fire('Aviso', 'Nenhum bem válido encontrado. Verifique se usou ponto e vírgula (;)', 'warning');
        return;
    }

    if (errosFronteira.length > 0) {
        console.warn("Alertas na importação CSV:", errosFronteira);
    }

    enviarLotePatrimonioParaServidor(itensParaImportar, itensIgnorados.length > 0);
}

async function enviarLotePatrimonioParaServidor(itensJSON, teveItensIgnorados = false) {
    Swal.fire({ title: 'Sincronizando com o Banco...', didOpen: () => Swal.showLoading() });
    
    try {
        const data = await fetchAutenticado('/admin/patrimonio/catalogo/importar', { 
            method: 'POST', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify({itens: itensJSON, usuarioLogado: obterAdmin()}) 
        });
        
        if(data.success) { 
            if (data.avisos && data.avisos.length > 0) {
                let htmlAvisos = data.avisos.join('<br>');
                Swal.fire({
                    title: 'Importação Concluída com Alertas',
                    html: `<b>${data.cadastrados}</b> itens foram cadastrados com sucesso no banco.<br><br>
                           <b class="text-warning">Atenção: Alguns locais não foram reconhecidos:</b><br>
                           <div class="text-start bg-light p-2 border mt-2" style="max-height: 150px; overflow-y: auto; font-size: 0.85rem;">
                               ${htmlAvisos}
                           </div>
                           <br>Estes itens ficaram sem local definido. Por favor, edite-os manualmente depois.`,
                    icon: 'warning'
                });
            } else if (teveItensIgnorados || data.ignorados > 0) {
                Swal.fire('Importação Parcial', `<b>${data.cadastrados}</b> novos bens cadastrados.<br><br><span class="text-warning">Alguns Tombamentos já existiam e foram ignorados.</span>`, 'warning');
            } else {
                Swal.fire('Sucesso!', `<b>${data.cadastrados}</b> bens cadastrados no banco de dados.`, 'success'); 
            }
            carregarItensPatrimonio(); 
        } else {
            Swal.fire('Erro', data.message, 'error');
        }
    } catch(err) {
        Swal.fire('Erro', 'Falha ao conectar com o servidor.', 'error');
    }
}

async function prepararImpressaoPatrimonio() {
    if (!catalogoPatrimonioMemoria || catalogoPatrimonioMemoria.length === 0) {
        Swal.fire('Aviso', 'O catálogo de patrimônio está vazio. Verifique os dados.', 'info');
        return;
    }

    let optionsHTML = '<option value="TODOS">TODOS OS SETORES</option>';
    try {
        const setores = await fetchAutenticado(`/admin/setores?t=${new Date().getTime()}`);
        if (setores && Array.isArray(setores)) {
            setores.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).forEach(s => {
                optionsHTML += `<option value="${s.nome}">${s.nome}</option>`;
            });
        }
    } catch(e) {
        if(window.obterSetores) {
           const sets = await window.obterSetores();
           sets.forEach(s => { optionsHTML += `<option value="${s}">${s}</option>`; });
        }
    }

    Swal.fire({
        title: 'Imprimir Inventário Físico',
        html: `
            <div class="text-start mt-3">
                <label class="small text-muted fw-bold mb-2">Selecione o Setor para Impressão:</label>
                <select id="swal-setor-print" class="form-select shadow-sm border-dark">
                    ${optionsHTML}
                </select>
                <small class="text-muted d-block mt-2">Dica: Selecione um setor específico se a comissão for visitar apenas um local, ou 'TODOS' para imprimir a relação completa.</small>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-print me-1"></i> Gerar Ficha',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#212529'
    }).then((result) => {
        if (result.isConfirmed) {
            const setorFiltro = document.getElementById('swal-setor-print').value;
            imprimirConferenciaPatrimonio(setorFiltro);
        }
    });
}

function imprimirConferenciaPatrimonio(setorFiltro = 'TODOS') { 
    let listaFiltrada = catalogoPatrimonioMemoria;
    
    if (setorFiltro !== 'TODOS') {
        listaFiltrada = catalogoPatrimonioMemoria.filter(item => item.setor_atual === setorFiltro);
    }

    if (!listaFiltrada || listaFiltrada.length === 0) {
        Swal.fire('Aviso', `Nenhum bem patrimonial encontrado para o setor selecionado: ${setorFiltro}`, 'info');
        return;
    }

    const dataHora = new Date().toLocaleString('pt-BR');
    const nomeAdmin = obterAdmin();
    const tituloSetor = setorFiltro === 'TODOS' ? 'Todos os Setores da Empresa' : setorFiltro;

    const listaOrdenada = [...listaFiltrada].sort((a, b) => {
        return String(a.tombamento || '').localeCompare(String(b.tombamento || ''), 'pt-BR', { numeric: true });
    });

    let htmlPrint = `
        <html>
        <head>
            <title>Inventário Físico - Patrimônio</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #000; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h2 { margin: 0; padding: 0; font-size: 18px; text-transform: uppercase; }
                .meta { display: flex; justify-content: space-between; font-size: 11px; color: #444; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; vertical-align: top; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .text-center { text-align: center; }
                
                .col-seq { width: 5%; text-align: center; }
                .col-tomb { width: 12%; }
                .col-desc { width: 40%; } 
                .col-local { width: 18%; }
                .col-estado { width: 10%; text-align: center; font-size: 10px; } 
                .col-obs { width: 15%; }
                
                .sig-container { display: flex; justify-content: space-around; margin-top: 50px; }
                .sig-box { border-top: 1px solid #000; width: 35%; text-align: center; padding-top: 5px; font-size: 12px; }
                .item-inativo { color: #888; text-decoration: line-through; }
                
                @media print { 
                    @page { margin: 1cm; size: auto; } 
                    tr { page-break-inside: avoid; } 
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Ficha de Levantamento Patrimonial (Inventário)</h2>
            </div>
            <div class="meta">
                <span><strong>Emissão:</strong> ${dataHora}</span>
                <span><strong>Setor Foco:</strong> ${tituloSetor}</span>
                <span><strong>Total de Bens:</strong> ${listaOrdenada.length}</span>
                <span><strong>Comissão/Responsável:</strong> ${nomeAdmin}</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th class="col-seq text-center">#</th>
                        <th class="col-tomb text-center">Tombamento</th>
                        <th class="col-desc">Descrição do Bem</th>
                        <th class="col-local">Localização (Sistema)</th>
                        <th class="col-estado">Estado (Sistema)</th>
                        <th class="col-obs">Anotações / Físico</th>
                    </tr>
                </thead>
                <tbody>
    `;

    listaOrdenada.forEach((item, index) => {
        const classInativo = item.ativo === 0 ? 'item-inativo' : '';
        const tagInativo = item.ativo === 0 ? ' <small>(BAIXADO)</small>' : '';
        
        let estadoPrint = item.estado_conservacao || '-';
        if (estadoPrint === 'INSERVÍVEL/OBSOLETO') {
            estadoPrint = 'INSERVÍVEL/<br>OBSOLETO';
        }

        htmlPrint += `
            <tr class="${classInativo}">
                <td class="text-center">${index + 1}</td>
                <td class="text-center"><strong>${item.tombamento}</strong></td>
                <td>${item.descricao}${tagInativo}</td>
                <td>${item.setor_atual || 'Não alocado'}</td>
                <td class="text-center" style="line-height: 1.1;">${estadoPrint}</td>
                <td></td> 
            </tr>
        `;
    });

    htmlPrint += `
                </tbody>
            </table>
            <p style="text-align: right; margin-top: 10px; font-size: 12px; font-weight: bold;">
                Total de Itens Listados: ${listaOrdenada.length}
            </p>
            <div class="sig-container">
                <div class="sig-box">Assinatura do Membro da Comissão</div>
                <div class="sig-box">Visto da Chefia do Patrimônio</div>
            </div>
            <script>
                window.onload = function() { 
                    setTimeout(() => {
                        window.print(); 
                        setTimeout(() => { window.close(); }, 500); 
                    }, 500);
                };
            </script>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlPrint);
    printWindow.document.close();
}

function alternarStatusBem(tombamento, novoStatus) { fetchAutenticado('/admin/patrimonio/catalogo/status', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({tombamento, ativo: novoStatus, usuarioLogado: obterAdmin()}) }).then(r=>carregarItensPatrimonio()); }
function excluirBemAdmin(tombamento) { Swal.fire({title:'Excluir Definitivamente?', showCancelButton: true, icon: 'warning', confirmButtonColor: '#d33'}).then(async r => { if(r.isConfirmed) { const res = await fetchAutenticado(`/admin/patrimonio/catalogo/${tombamento}`, {method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({usuarioLogado: obterAdmin()})}); if(res.success) carregarItensPatrimonio(); else Swal.fire('Aviso', res.message, 'info'); } }); }


// =========================================================================
// MÓDULO: AUDITORIA E BANCO DE DADOS (ZONA DE PERIGO)
// =========================================================================
async function abrirAuditoria() {
    if (!verificarAcesso('manutencao')) return;
    const container = document.getElementById('conteudo-dinamico-admin');
    container.innerHTML = '<div class="text-center py-5"><span class="spinner-border text-warning"></span></div>';

    try {
        const data = await fetchAutenticado(`/admin/auditoria?t=${new Date().getTime()}`);
        let html = `
            <div class="animate__animated animate__fadeIn">
                <h5 class="fw-bold mb-4 text-dark"><i class="fas fa-history me-2 text-warning"></i>Log de Auditoria</h5>
                <div class="table-responsive bg-white rounded-4 shadow-sm p-3" style="max-height: 500px; overflow-y: auto;">
                    <table class="table table-sm table-hover align-middle mb-0" style="font-size: 0.85rem;">
                        <thead class="table-light position-sticky top-0 shadow-sm"><tr><th>Data/Hora</th><th>Admin</th><th>Ação</th><th>Módulo</th><th>Detalhes</th></tr></thead>
                        <tbody>
        `;
        if (data.dados.length === 0) html += `<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum log.</td></tr>`;
        else {
            data.dados.forEach(log => {
                let cor = 'bg-secondary';
                if (log.acao === 'INCLUSAO') cor = 'bg-success';
                if (log.acao === 'EDICAO') cor = 'bg-primary';
                if (log.acao === 'EXCLUSAO') cor = 'bg-danger';
                if (log.acao === 'SISTEMA') cor = 'bg-info text-dark';
                if (log.acao === 'RESET') cor = 'bg-dark text-warning';

                html += `<tr><td class="text-muted text-nowrap">${new Date(log.data_hora).toLocaleString('pt-BR')}</td><td class="fw-bold text-secondary"><i class="fas fa-user-circle me-1"></i>${log.usuario_admin}</td><td><span class="badge ${cor}">${log.acao}</span></td><td class="text-dark">${log.modulo}</td><td class="text-muted text-wrap">${log.detalhes}</td></tr>`;
            });
        }
        container.innerHTML = html + `</tbody></table></div></div>`;
    } catch (error) { container.innerHTML = `<div class="alert alert-danger">Erro ao carregar logs.</div>`; }
}

function abrirManutencaoDados() {
    if (!verificarAcesso('manutencao')) return;
    const container = document.getElementById('conteudo-dinamico-admin');
    container.innerHTML = `
        <div class="animate__animated animate__fadeIn">
            <h5 class="fw-bold mb-4 text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Manutenção de Dados (Zona de Perigo)</h5>
            <div class="card border-danger shadow-sm rounded-4">
                <div class="card-header bg-danger text-white fw-bold py-3 rounded-top-4 border-0">Reset do Sistema de Protocolos</div>
                <div class="card-body p-4 text-center">
                    <p class="text-muted">Apaga o histórico de chamados e zera a numeração.</p>
                    <div class="mx-auto mt-4" style="max-width: 400px;">
                        <select id="alvo-reset" class="form-select border-danger fw-bold text-dark shadow-sm mb-3">
                            <option value="producao">MODO PRODUÇÃO: Zerar TUDO</option>
                            <option value="manutencao">Apenas Manutenção</option>
                            <option value="servicos-gerais">Apenas Serviços Gerais</option>
                            <option value="patrimonio">Apenas Patrimônio</option>
                            <option value="almoxarifado">Apenas Almoxarifado</option>
                        </select>
                        <div class="bg-light p-3 rounded-3 border text-center">
                            <label class="form-label small fw-bold text-muted">Digite: <span class="text-danger user-select-all">RESETAR-CPRH</span></label>
                            <input type="text" id="input-confirmacao-reset" class="form-control text-center fw-bold text-danger border-danger" onkeyup="validarTravaReset()">
                        </div>
                    </div>
                    <button id="btn-executar-reset" class="btn btn-danger px-5 rounded-pill fw-bold mt-4 disabled" onclick="executarLimpezaBanco()"><i class="fas fa-radiation me-2"></i> EXECUTAR LIMPEZA</button>
                </div>
            </div>
        </div>
    `;
}

function validarTravaReset() {
    const input = document.getElementById('input-confirmacao-reset').value;
    const btn = document.getElementById('btn-executar-reset');
    if (input === 'RESETAR-CPRH') { 
        btn.classList.remove('disabled'); 
        btn.classList.add('animate__animated', 'animate__pulse', 'animate__infinite'); 
    } else { 
        btn.classList.add('disabled'); 
        btn.classList.remove('animate__animated', 'animate__pulse', 'animate__infinite'); 
    }
}

async function executarLimpezaBanco() {
    if (!verificarAcesso('manutencao')) return; 
    const alvo = document.getElementById('alvo-reset').value;
    
    Swal.fire({
        title: 'ÚLTIMO AVISO', 
        text: `Apagar dados permanentemente. Tem certeza?`, 
        icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'DESTRUIR'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const data = await fetchAutenticado('/admin/limpar-banco', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ confirmacao: 'RESETAR-CPRH', alvo: alvo, usuarioLogado: obterAdmin() }) 
                });
                if (data.success) { 
                    Swal.fire('Limpeza Concluída!', '', 'success'); 
                    document.getElementById('conteudo-dinamico-admin').innerHTML = ''; 
                }
            } catch (error) { Swal.fire('Erro Crítico', 'Falha.', 'error'); }
        }
    });
}

// =========================================================================
// GESTÃO DE USUÁRIOS (Acessos)
// =========================================================================
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
                            <thead class="table-light text-nowrap">
                                <tr><th class="text-start">Usuário</th><th>Escopo</th><th>Ativo</th><th>Ver</th><th>Criar</th><th>Editar</th><th>Excluir</th><th class="text-danger">DB</th><th>Ações</th></tr>
                            </thead>
                            <tbody>
            `;
            result.dados.forEach(user => {
                const criarToggle = (coluna, valor) => `<div class="form-check form-switch d-flex justify-content-center m-0"><input class="form-check-input shadow-none" style="cursor: pointer;" type="checkbox" ${valor === 1 ? 'checked' : ''} onchange="alternarPermissaoUsuario(${user.id}, '${coluna}', this.checked ? 1 : 0, '${user.usuario}')"></div>`;
                
                let badgeConfig = 'bg-dark text-white'; 
                if (user.modulo_acesso === 'manutencao') badgeConfig = 'bg-primary text-white';
                else if (user.modulo_acesso === 'servicos-gerais') badgeConfig = 'bg-warning text-dark';
                else if (user.modulo_acesso === 'patrimonio') badgeConfig = 'bg-success text-white';
                else if (user.modulo_acesso === 'almoxarifado') badgeConfig = 'bg-info text-dark';
                
                html += `
                    <tr>
                        <td class="text-start fw-bold text-secondary text-nowrap"><i class="fas fa-user-shield me-2"></i>${user.usuario}</td>
                        <td class="text-nowrap"><span class="badge ${badgeConfig} p-2 shadow-sm transition-all hover-scale" style="cursor: pointer;" onclick="alterarEscopoUsuario(${user.id}, '${user.usuario}', '${user.modulo_acesso}')" title="Clique para alterar o setor de acesso">${user.modulo_acesso ? user.modulo_acesso.toUpperCase() : 'TODOS'} <i class="fas fa-edit ms-1"></i></span></td>
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
                <option value="TODOS" ${moduloAtual === 'TODOS' ? 'selected' : ''} style="background-color: #212529; color: #fff;">ADMIN GLOBAL (Todos)</option>
                <option value="manutencao" ${moduloAtual === 'manutencao' ? 'selected' : ''} style="background-color: #0d6efd; color: #fff;">Manutenção</option>
                <option value="servicos-gerais" ${moduloAtual === 'servicos-gerais' ? 'selected' : ''} style="background-color: #ffc107; color: #000;">Serviços Gerais</option>
                <option value="patrimonio" ${moduloAtual === 'patrimonio' ? 'selected' : ''} style="background-color: #198754; color: #fff;">Patrimônio</option>
                <option value="almoxarifado" ${moduloAtual === 'almoxarifado' ? 'selected' : ''} style="background-color: #0dcaf0; color: #000;">Almoxarifado</option>
            </select>`,
        showCancelButton: true, confirmButtonText: 'Atualizar',
        preConfirm: () => document.getElementById('swal-select-modulo').value
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetchAutenticado('/admin/usuarios/modulo', {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, novoModulo: result.value, nomeUsuario, usuarioLogado: obterAdmin() })
                });
                if (res.success) abrirGestaoUsuarios();
            } catch (error) { Swal.fire('Erro', 'Falha.', 'error'); }
        }
    });
}

async function alternarPermissaoUsuario(idUsuario, colunaPermissao, novoValor, nomeUsuario) {
    if (!verificarAcesso('manutencao')) { abrirGestaoUsuarios(); return; }
    try {
        const res = await fetchAutenticado('/admin/usuarios/permissao', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idUsuario, colunaPermissao, valor: novoValor, nomeUsuario, usuarioLogado: obterAdmin() })
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
            try {
                const data = await fetchAutenticado('/admin/usuarios/renomear', {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, nomeAntigo: nomeAtual, novoNome: result.value.trim(), usuarioLogado: obterAdmin() })
                });
                if (data.success) abrirGestaoUsuarios();
            } catch (error) { Swal.fire('Erro', 'Falha no servidor', 'error'); }
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
                body: JSON.stringify({ id, novaSenha: result.value.trim(), nomeUsuario, usuarioLogado: obterAdmin() })
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
                body: JSON.stringify({ nomeUsuario, usuarioLogado: obterAdmin() })
            });
            if (data.success) abrirGestaoUsuarios();
        }
    });
}

// =========================================================================
// EXPORTANDO FUNÇÕES PARA O HTML E OUTROS SCRIPTS
// =========================================================================

window.fetchAutenticado = fetchAutenticado;
window.obterAdmin = obterAdmin;
window.verificarAcesso = verificarAcesso;

window.imprimirSetores = imprimirSetores;
window.abrirGestaoUsuarios = abrirGestaoUsuarios;
window.mostrarModalNovoUsuario = mostrarModalNovoUsuario;
window.alterarEscopoUsuario = alterarEscopoUsuario;
window.alternarPermissaoUsuario = alternarPermissaoUsuario;
window.renomearUsuarioAdmin = renomearUsuarioAdmin;
window.redefinirSenhaAdmin = redefinirSenhaAdmin;
window.excluirUsuarioAdmin = excluirUsuarioAdmin;

window.gerenciarSetores = gerenciarSetores;
window.filtrarSetores = filtrarSetores;
window.mostrarModalNovoSetor = mostrarModalNovoSetor;
window.renomearSetor = renomearSetor;
window.alternarStatusSetor = alternarStatusSetor;
window.confirmarExclusaoSetor = confirmarExclusaoSetor;

window.abrirRelatorios = abrirRelatorios;
window.carregarDadosRelatorio = carregarDadosRelatorio;
window.confirmarTrocaStatus = confirmarTrocaStatus;
window.imprimirRelatorioAtual = imprimirRelatorioAtual;
window.verDetalhesChamado = verDetalhesChamado;

window.abrirPainelCatalogos = abrirPainelCatalogos;
window.carregarVisaoCatalogo = carregarVisaoCatalogo;

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
window.prepararImpressaoPatrimonio = prepararImpressaoPatrimonio;

window.abrirAuditoria = abrirAuditoria;
window.abrirManutencaoDados = abrirManutencaoDados;
window.validarTravaReset = validarTravaReset;
window.executarLimpezaBanco = executarLimpezaBanco;

console.log("✅ [Backoffice] script_Admin.js carregado (Layout Quebra de Linha em Estado Ativado)!");