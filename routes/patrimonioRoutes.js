// Arquivo: routes/patrimonioRoutes.js
const express = require('express');
const router = express.Router();

const pool = require('../config/database');
const { verificarToken } = require('../config/auth');
const { registrarLog } = require('../utils/logger');

// =======================================================
// ROTAS DO CATÁLOGO DE PATRIMÔNIO (Base: /api/admin/patrimonio)
// =======================================================

router.get('/itens', verificarToken, async (req, res) => {
    const { setor } = req.query;
    try {
        let query = 'SELECT * FROM catalogo_patrimonio';
        let params = [];

        if (setor && setor !== 'TODOS' && setor !== 'undefined') {
            query += ' WHERE setor_atual = ?';
            params.push(setor);
        }
        query += ' ORDER BY tombamento ASC';

        const [rows] = await pool.execute(query, params);
        res.json(Array.isArray(rows) ? rows : []);
    } catch (error) { 
        console.error("Erro na consulta de bens:", error.message);
        res.status(500).json({ success: false, message: error.message }); 
    }
});

// IMPORTAÇÃO EM LOTE - Motor Analítico Flexível (Tolerante a Falhas de Setor)
router.post('/catalogo/importar', verificarToken, async (req, res) => {
    const { itens, usuarioLogado } = req.body;
    if (!itens || itens.length === 0) return res.status(400).json({ success: false, message: 'Nenhum item enviado.' });

    const connection = await pool.getConnection();
    let cadastrados = 0;
    let ignorados = 0;
    let avisos = []; // Nova lista para guardar itens salvos com setor em branco

    try {
        await connection.beginTransaction();

        for (let item of itens) {
            const t = String(item.tombamento).trim().toUpperCase();
            const d = String(item.descricao).trim().toUpperCase();
            const s = String(item.setor || '').trim().toUpperCase();
            const e = String(item.estado || 'NOVO').trim().toUpperCase();

            // 1. Verifica se o tombamento já existe no banco (Isso continua sendo impeditivo)
            const [existe] = await connection.execute('SELECT tombamento FROM catalogo_patrimonio WHERE tombamento = ?', [t]);
            if (existe.length > 0) {
                ignorados++;
                continue; 
            }

            // 2. Verifica o SETOR (Nova Lógica Tolerante)
            let setorFinal = null;
            if (s && s !== 'NÃO ALOCADO' && s !== '') {
                const [setorExiste] = await connection.execute('SELECT nome FROM setores WHERE UPPER(nome) = ?', [s]);
                
                if (setorExiste.length === 0) {
                    // O setor digitado no CSV não existe! 
                    // Salva nos avisos, deixa setorFinal nulo e DEIXA SEGUIR PARA O INSERT.
                    avisos.push(`Bem <b>${t}</b>: Setor "${s}" desconhecido. Salvo como "Não alocado".`);
                    setorFinal = null;
                } else {
                    setorFinal = setorExiste[0].nome; // Pega o nome correto do banco
                }
            }

            // 3. Insere de forma segura (Mesmo com setorFinal nulo, o banco aceita pela Foreign Key ON DELETE SET NULL)
            await connection.execute(
                'INSERT INTO catalogo_patrimonio (tombamento, descricao, setor_atual, estado_conservacao, ativo) VALUES (?, ?, ?, ?, 1)',
                [t, d, setorFinal, e]
            );
            cadastrados++;
        }

        await connection.commit();
        
        if (cadastrados > 0) {
            await registrarLog(usuarioLogado, 'INCLUSAO', 'Patrimônio', `Importou/Cadastrou ${cadastrados} bem(ns) em lote. (${avisos.length} alertas de setor)`);
        }
        
        res.json({ success: true, cadastrados, ignorados, avisos });

    } catch (error) { 
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message }); 
    } finally {
        connection.release();
    }
});

// NOVO BEM MANUAL
router.post('/catalogo/novo', verificarToken, async (req, res) => {
    const { tombamento, descricao, setor, estado, usuarioLogado } = req.body;
    try {
        const t = String(tombamento).trim().toUpperCase();
        const d = String(descricao).trim().toUpperCase();
        const s = String(setor || '').trim().toUpperCase();
        const e = String(estado || 'NOVO').trim().toUpperCase();

        const [existe] = await pool.execute('SELECT tombamento FROM catalogo_patrimonio WHERE tombamento = ?', [t]);
        if (existe.length > 0) return res.status(400).json({ success: false, message: 'Tombamento já cadastrado no sistema.' });

        const setorFinal = (s === '' || s === 'NÃO ALOCADO') ? null : s;

        await pool.execute(
            'INSERT INTO catalogo_patrimonio (tombamento, descricao, setor_atual, estado_conservacao, ativo) VALUES (?, ?, ?, ?, 1)',
            [t, d, setorFinal, e]
        );
        const detalheLog = `Cadastrou o bem [${t}] - ${d} | Local: ${setorFinal || 'Não Alocado'} | Estado: ${e}`;
        await registrarLog(usuarioLogado, 'CADASTRO', 'Patrimônio', detalheLog);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// EDIÇÃO DE BEM
router.put('/catalogo/editar', verificarToken, async (req, res) => {
    const { tombamentoAntigo, novoTombamento, descricao, setor, estado, usuarioLogado } = req.body;
    try {
        const tAntigo = String(tombamentoAntigo).trim().toUpperCase();
        const tNovo = String(novoTombamento).trim().toUpperCase();
        const d = String(descricao).trim().toUpperCase();
        const s = String(setor || '').trim().toUpperCase();
        const e = String(estado || 'NOVO').trim().toUpperCase();

        if (tNovo !== tAntigo) {
            const [existe] = await pool.execute('SELECT tombamento FROM catalogo_patrimonio WHERE tombamento = ?', [tNovo]);
            if (existe.length > 0) return res.status(400).json({ success: false, message: 'O novo tombamento digitado já se encontra cadastrado no sistema.' });
        }

        const [rows] = await pool.execute('SELECT tombamento, descricao, setor_atual, estado_conservacao FROM catalogo_patrimonio WHERE tombamento = ?', [tAntigo]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Bem não encontrado.' });

        const atual = rows[0];
        let mudancas = [];
        const setorFinal = (s === '' || s === 'NÃO ALOCADO') ? null : s;

        if (tNovo !== tAntigo) mudancas.push(`Tombamento: "${tAntigo}" -> "${tNovo}"`);
        if (atual.descricao !== d) mudancas.push(`Desc: "${atual.descricao}" -> "${d}"`);
        if ((atual.setor_atual || 'NÃO ALOCADO') !== (setorFinal || 'NÃO ALOCADO')) mudancas.push(`Setor: "${atual.setor_atual || 'NÃO ALOCADO'}" -> "${setorFinal || 'NÃO ALOCADO'}"`);
        if (atual.estado_conservacao !== e) mudancas.push(`Estado: "${atual.estado_conservacao}" -> "${e}"`);

        await pool.execute(
            'UPDATE catalogo_patrimonio SET tombamento = ?, descricao = ?, setor_atual = ?, estado_conservacao = ? WHERE tombamento = ?',
            [tNovo, d, setorFinal, e, tAntigo]
        );

        if (mudancas.length > 0) {
            await registrarLog(usuarioLogado, 'EDICAO', 'Patrimônio', `Editou o bem [${tAntigo}]. Alterações: ${mudancas.join(' | ')}`);
        } else {
            await registrarLog(usuarioLogado, 'EDICAO', 'Patrimônio', `Acessou e salvou o bem [${tAntigo}] sem realizar alterações.`);
        }
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/catalogo/status', verificarToken, async (req, res) => {
    const { tombamento, ativo, usuarioLogado } = req.body;
    try {
        await pool.execute('UPDATE catalogo_patrimonio SET ativo = ? WHERE tombamento = ?', [ativo, tombamento]);
        const txt = ativo === 1 ? 'Ativou' : 'Inativou';
        await registrarLog(usuarioLogado, 'EDICAO', 'Patrimônio', `${txt} o bem: ${tombamento}`);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.delete('/catalogo/:tombamento', verificarToken, async (req, res) => {
    const { tombamento } = req.params;
    const { usuarioLogado } = req.body;
    try {
        await pool.execute('DELETE FROM catalogo_patrimonio WHERE tombamento = ?', [tombamento]);
        await registrarLog(usuarioLogado, 'EXCLUSAO', 'Patrimônio', `Excluiu o bem [${tombamento}]`);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: 'Item com histórico de movimentação não pode ser excluído. Utilize o botão de Status para inativá-lo e tirá-lo da visão principal.' }); }
});

module.exports = router;