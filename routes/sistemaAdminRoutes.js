// Arquivo: routes/sistemaAdminRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken } = require('../config/auth');
const { registrarLog } = require('../utils/logger');

// IMPORTAÇÃO CRÍTICA DO NOSSO NOVO MÓDULO DE E-MAIL
const { dispararEmailAlertaEstoque } = require('../utils/mailer');

// Função auxiliar interna
function obterTabelaPorModulo(modulo) {
    const tabelas = {
        'manutencao': 'chamados_manutencao', 'servicos-gerais': 'chamados_servicos_gerais',
        'patrimonio': 'chamados_patrimonio', 'almoxarifado': 'chamados_almoxarifado'
    };
    return tabelas[modulo] || null;
}

// 1. Carregar Listagem de Chamados
router.get('/chamados/:modulo', verificarToken, async (req, res) => {
    const { modulo } = req.params;
    try {
        if (modulo === 'manutencao') {
            const [chamados] = await pool.execute('SELECT * FROM chamados_manutencao ORDER BY data_solicitacao DESC');
            for (let chamado of chamados) {
                const [itens] = await pool.execute('SELECT tipo_reparo as tipo, descricao FROM itens_manutencao WHERE id_chamado = ?', [chamado.id]);
                chamado.itens = itens;
            }
            return res.json({ success: true, dados: chamados });
        } else if (modulo === 'patrimonio') {
            const [rows] = await pool.execute('SELECT * FROM chamados_patrimonio ORDER BY data_solicitacao DESC');
            for (let chamado of rows) {
                const [itens] = await pool.execute('SELECT tombamento, descricao_item as descricao FROM itens_patrimonio WHERE id_chamado = ?', [chamado.id]);
                chamado.itens = itens;
            }
            return res.json({ success: true, dados: rows });
        } else if (modulo === 'almoxarifado') {
            const [chamados] = await pool.execute('SELECT * FROM chamados_almoxarifado ORDER BY data_solicitacao DESC');
            for (let chamado of chamados) {
                const [itens] = await pool.execute('SELECT codigo, categoria, descricao, quantidade FROM itens_almoxarifado WHERE id_chamado = ?', [chamado.id]);
                chamado.itens = itens;
            }
            return res.json({ success: true, dados: chamados });
        } else if (modulo === 'servicos-gerais') {
            const [chamados] = await pool.execute('SELECT * FROM chamados_servicos_gerais ORDER BY data_solicitacao DESC');
            for (let chamado of chamados) {
                const [itens] = await pool.execute('SELECT categoria, descricao FROM itens_servicos_gerais WHERE id_chamado = ?', [chamado.id]);
                chamado.itens = itens;
            }
            return res.json({ success: true, dados: chamados });
        }
        res.status(400).json({ success: false, message: 'Módulo inválido.' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// 2. Gráficos Estatísticos
router.get('/relatorios/estatisticas', verificarToken, async (req, res) => {
    const { modulo, ano } = req.query;
    const tabela = obterTabelaPorModulo(modulo);
    if (!tabela) return res.status(400).json({ success: false, message: 'Módulo inválido.' });

    try {
        const query = `
            SELECT MONTH(data_solicitacao) AS mes, COUNT(*) AS total_abertos, SUM(CASE WHEN status IN ('Solucionado', 'Fechado') THEN 1 ELSE 0 END) AS total_solucionados
            FROM ${tabela} WHERE YEAR(data_solicitacao) = ? GROUP BY MONTH(data_solicitacao) ORDER BY mes ASC
        `;
        const [rows] = await pool.execute(query, [ano]);
        const abertos = Array(12).fill(0);
        const solucionados = Array(12).fill(0);

        rows.forEach(row => {
            const indiceMes = row.mes - 1; 
            abertos[indiceMes] = row.total_abertos;
            solucionados[indiceMes] = Number(row.total_solucionados); 
        });

        res.json({ success: true, abertos, solucionados });
    } catch (error) { res.status(500).json({ success: false, message: 'Erro interno.' }); }
});

// 3. Alteração de Status e Baixa de Estoque
router.put('/relatorios/status', verificarToken, async (req, res) => {
    const { protocolo, novoStatus, modulo, usuarioLogado } = req.body;
    const tabela = obterTabelaPorModulo(modulo);

    if (!tabela) return res.status(400).json({ success: false, message: 'Módulo inválido.' });

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [chamadoExistente] = await connection.execute(`SELECT id, status FROM ${tabela} WHERE protocolo = ? FOR UPDATE`, [protocolo]);
        if (chamadoExistente.length === 0) throw new Error('Protocolo não encontrado.');
        
        const statusAntigo = chamadoExistente[0].status;
        const idChamado = chamadoExistente[0].id;

        if (modulo === 'almoxarifado') {
            const eraFechado = statusAntigo === 'Solucionado' || statusAntigo === 'Fechado';
            const vaiFechar = novoStatus === 'Solucionado' || novoStatus === 'Fechado';

            if (!eraFechado && vaiFechar) {
                const [itens] = await connection.execute('SELECT codigo, quantidade FROM itens_almoxarifado WHERE id_chamado = ?', [idChamado]);
                for (let item of itens) {
                    const [estoqueAtual] = await connection.execute('SELECT quantidade_estoque FROM catalogo_materiais WHERE codigo = ? FOR UPDATE', [item.codigo]);
                    if (estoqueAtual[0].quantidade_estoque < item.quantidade) {
                        throw new Error(`Estoque insuficiente! O item [${item.codigo}] só possui ${estoqueAtual[0].quantidade_estoque} un.`);
                    }
                }

                for (let item of itens) {
                    await connection.execute('UPDATE catalogo_materiais SET quantidade_estoque = quantidade_estoque - ? WHERE codigo = ?', [item.quantidade, item.codigo]);
                    const [res] = await connection.execute('SELECT codigo, descricao, quantidade_estoque, estoque_minimo FROM catalogo_materiais WHERE codigo = ?', [item.codigo]);
                    if (res[0].quantidade_estoque <= res[0].estoque_minimo) dispararEmailAlertaEstoque(res[0]); 
                }
                
                await registrarLog(usuarioLogado || 'Sistema', 'SISTEMA', 'Estoque', `Baixa processada: ${protocolo}`);
            }
            else if (eraFechado && !vaiFechar) {
                const [itens] = await connection.execute('SELECT codigo, quantidade FROM itens_almoxarifado WHERE id_chamado = ?', [idChamado]);
                for (let item of itens) {
                    await connection.execute('UPDATE catalogo_materiais SET quantidade_estoque = quantidade_estoque + ? WHERE codigo = ?', [item.quantidade, item.codigo]);
                }
                await registrarLog(usuarioLogado || 'Sistema', 'SISTEMA', 'Estoque', `Estorno processado. Protocolo ${protocolo} reaberto.`);
            }
        }

        await connection.execute(`UPDATE ${tabela} SET status = ? WHERE protocolo = ?`, [novoStatus, protocolo]);
        await connection.commit();
        await registrarLog(usuarioLogado, 'EDICAO', modulo.toUpperCase(), `Alterou status do protocolo ${protocolo} para: ${novoStatus}`);
        
        res.json({ success: true });

    } catch (error) {
        await connection.rollback(); 
        res.status(500).json({ success: false, message: error.message });
    } finally { connection.release(); }
});

// 4. Limpeza da Base de Dados (ZONA DE PERIGO)
router.post('/limpar-banco', verificarToken, async (req, res) => {
    const { confirmacao, alvo, usuarioLogado } = req.body;
    if (confirmacao !== 'RESETAR-CPRH') return res.status(403).json({ success: false, message: 'Senha incorreta.' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        if (alvo === 'producao' || alvo === 'todos') {
            await connection.execute('TRUNCATE TABLE itens_manutencao');
            await connection.execute('TRUNCATE TABLE chamados_manutencao');
            await connection.execute('TRUNCATE TABLE itens_patrimonio'); 
            await connection.execute('TRUNCATE TABLE chamados_patrimonio');
            await connection.execute('TRUNCATE TABLE itens_almoxarifado');
            await connection.execute('TRUNCATE TABLE chamados_almoxarifado');
            await connection.execute('TRUNCATE TABLE itens_servicos_gerais');
            await connection.execute('TRUNCATE TABLE chamados_servicos_gerais');
            await connection.execute('TRUNCATE TABLE logs_auditoria');
            await connection.execute('INSERT INTO logs_auditoria (usuario_admin, acao, modulo, detalhes) VALUES (?, "RESET", "Sistema", "RESET DE GO-LIVE: Sistema preparado.")', [usuarioLogado]);
        } else {
            const tabelas = {
                'manutencao': { itens: 'itens_manutencao', chamados: 'chamados_manutencao', nome: 'Manutenção' },
                'servicos-gerais': { itens: 'itens_servicos_gerais', chamados: 'chamados_servicos_gerais', nome: 'Serviços Gerais' },
                'patrimonio': { itens: 'itens_patrimonio', chamados: 'chamados_patrimonio', nome: 'Patrimônio' },
                'almoxarifado': { itens: 'itens_almoxarifado', chamados: 'chamados_almoxarifado', nome: 'Almoxarifado' }
            };
            
            if (tabelas[alvo]) {
                await connection.execute(`TRUNCATE TABLE ${tabelas[alvo].itens}`);
                await connection.execute(`TRUNCATE TABLE ${tabelas[alvo].chamados}`);
                await registrarLog(usuarioLogado, 'RESET', tabelas[alvo].nome, `Limpou chamados de ${tabelas[alvo].nome.toLowerCase()}.`);
            }
        }

        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        await connection.commit();
        res.json({ success: true, message: 'Banco de dados limpo.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally { connection.release(); }
});

// 5. Auditoria de Logs
router.get('/auditoria', verificarToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM logs_auditoria ORDER BY data_hora DESC LIMIT 200');
        res.json({ success: true, dados: rows });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;