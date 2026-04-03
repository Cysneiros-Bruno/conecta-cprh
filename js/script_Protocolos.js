/* ==========================================================
   GERADOR CENTRAL DE PROTOCOLOS - CPRH
   Versão 2.0 - Março/2026
   ----------------------------------------------------------
   - Padronização de 6 dígitos (000000)
   - Persistência via LocalStorage independente por setor
   - Reset automático na virada do ano
   ========================================================== */

const GeradorProtocolo = {
    
    // Mapeamento de módulos e suas chaves de armazenamento
    MODULOS: {
        DIARIAS:      { prefixo: 'DIA',   storage: 'seq_diarias' },
        MANUTENCAO:   { prefixo: 'MANUT', storage: 'seq_manutencao' },
        ALMOXARIFADO: { prefixo: 'ALMOX', storage: 'seq_almoxarifado' },
        PATRIMONIO:   { prefixo: 'PATRI', storage: 'seq_patrimonio' },
        VEICULOS:     { prefixo: 'VEIC',  storage: 'seq_veiculos' }
    },

    /**
     * Gera o protocolo oficial: PREFIXO-ANO.000000
     * @param {string} chaveModulo - Chave interna (Ex: 'DIARIAS')
     */
    gerar: function(chaveModulo) {
        const config = this.MODULOS[chaveModulo];
        
        if (!config) {
            console.error(`[ERRO] Módulo '${chaveModulo}' não encontrado no Gerador.`);
            return "ERR-999";
        }

        const anoAtual = new Date().getFullYear();

        // --- Lógica de Reset de Ano Novo Automático ---
        const anoSalvo = localStorage.getItem('cprh_ano_protocolos');
        if (anoSalvo && anoSalvo != anoAtual) {
            console.warn("[PROTOCOLOS] Mudança de ano detectada. Resetando contadores...");
            this.resetarTudo();
        }
        localStorage.setItem('cprh_ano_protocolos', anoAtual);

        // --- Lógica de Sequencial ---
        let ultimo = localStorage.getItem(config.storage) || 0;
        let novo = parseInt(ultimo) + 1;
        
        // Salva para a próxima requisição
        localStorage.setItem(config.storage, novo);

        // Formata para 6 dígitos (ex: 1 vira 000001)
        const sequencialFormatado = novo.toString().padStart(6, '0');

        // Montando a exibição do número de Protocolo
        const protocoloFinal = `${config.prefixo}-${anoAtual}.${sequencialFormatado}`;
        
        console.log(`[PROTOCOLOS] Novo registro gerado: ${protocoloFinal}`);
        return protocoloFinal;
    },

    /**
     * Reseta a numeração de um setor específico via Console
     * Ex: GeradorProtocolo.resetarSetor('MANUTENCAO')
     */
    resetarSetor: function(chaveModulo) {
        const config = this.MODULOS[chaveModulo];
        if (config) {
            localStorage.removeItem(config.storage);
            console.info(`[PROTOCOLOS] Contador de ${chaveModulo} resetado com sucesso.`);
            return true;
        }
        return false;
    },

    /**
     * Limpa TODOS os contadores da Intranet (Uso administrativo)
     */
    resetarTudo: function() {
        Object.keys(this.MODULOS).forEach(chave => {
            localStorage.removeItem(this.MODULOS[chave].storage);
        });
        console.info("[PROTOCOLOS] Limpeza geral realizada. Todos os contadores voltaram para 000001.");
    }
};