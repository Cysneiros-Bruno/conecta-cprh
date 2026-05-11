/* =========================================================================
    DADOS GLOBAIS DA INTRANET (VERSÃO MODULARIZADA ES6)
    Responsável por buscar e fazer a cache de informações comuns (ex: Setores)
   ========================================================================= */

import { fetchPublico } from './services/apiService.js';

let cacheSetores = null;

function forcarAtualizacaoSetores() {
    cacheSetores = null;
}

async function obterSetores() {
    if (cacheSetores) return cacheSetores;
    
    try {
        // Usa a central de API e força o browser a não usar a cache antiga
        const data = await fetchPublico('/setores', { cache: 'no-store' });
        
        cacheSetores = Array.isArray(data) ? data : [];
        return cacheSetores;
    } catch (e) {
        console.error("Erro Crítico na integração de setores:", e);
        return ["Erro Crítico - Servidor Inacessível", "Contacte o NTIC"]; 
    }
}

async function popularSelectSetores(idSelect) {
    try {
        const setores = await fetchPublico('/setores');
        
        const selectEl = document.getElementById(idSelect);
        if (!selectEl) return;

        selectEl.innerHTML = '<option value="">Pesquise ou selecione...</option>';

        setores.forEach(nomeSetor => {
            const opt = document.createElement('option');
            opt.value = nomeSetor;
            opt.text = nomeSetor;
            selectEl.appendChild(opt);
        });

        // Configuração do Autocomplete Visual
        new TomSelect(selectEl, {
            plugins: ['dropdown_input'],
            create: false,
            placeholder: "Digite para pesquisar...", 
            maxOptions: 200,                        
            allowEmptyOption: true,                
            sortField: { field: "text", direction: "asc" },
            render: {
                no_results: function(data, escape) {
                    return '<div class="p-2 text-danger fw-bold small">Nenhum setor encontrado com este nome.</div>';
                }
            }
        });
    } catch (error) {
        console.error('Erro ao carregar a lista de setores:', error);
    }
}

/* =========================================================================
   EXPORTANDO AS FUNÇÕES (Furar a bolha do ES6 Module)
========================================================================= */
window.forcarAtualizacaoSetores = forcarAtualizacaoSetores;
window.obterSetores = obterSetores;
window.popularSelectSetores = popularSelectSetores;