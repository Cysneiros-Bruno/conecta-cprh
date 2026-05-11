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

router.post('/catalogo/importar', verificarToken, async (req, res) => {
    const { itens, usuarioLogado } = req.body;
    if (!itens || itens.length === 0) return res.status(400).json({ success: false, message: 'Nenhum item enviado.' });

    try {
        const valores = itens.map(item => [
            item.tombamento, item.descricao, item.setor || null, item.estado || 'Em bom estado', 1
        ]);

        const query = `
            INSERT INTO catalogo_patrimonio (tombamento, descricao, setor_atual, estado_conservacao, ativo) 
            VALUES ? 
            ON DUPLICATE KEY UPDATE 
            descricao = VALUES(descricao), setor_atual = VALUES(setor_atual), estado_conservacao = VALUES(estado_conservacao), ativo = 1
        `;
        
        await pool.query(query, [valores]);
        await registrarLog(usuarioLogado, 'INCLUSAO', 'Patrimônio', `Importou/Atualizou ${itens.length} bem(ns) tombado(s) em lote.`);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/catalogo/novo', verificarToken, async (req, res) => {
    const { tombamento, descricao, setor, estado, usuarioLogado } = req.body;
    try {
        const [existe] = await pool.execute('SELECT tombamento FROM catalogo_patrimonio WHERE tombamento = ?', [tombamento]);
        if (existe.length > 0) return res.status(400).json({ success: false, message: 'Tombamento já cadastrado.' });

        await pool.execute(
            'INSERT INTO catalogo_patrimonio (tombamento, descricao, setor_atual, estado_conservacao, ativo) VALUES (?, ?, ?, ?, 1)',
            [tombamento, descricao, setor, estado]
        );
        const detalheLog = `Cadastrou o bem [${tombamento}] - ${descricao} | Local inicial: ${setor || 'Depósito'} | Estado: ${estado}`;
        await registrarLog(usuarioLogado, 'CADASTRO', 'Patrimônio', detalheLog);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/catalogo/editar', verificarToken, async (req, res) => {
    const { tombamento, descricao, setor, estado, usuarioLogado } = req.body;
    try {
        const [rows] = await pool.execute('SELECT descricao, setor_atual, estado_conservacao FROM catalogo_patrimonio WHERE tombamento = ?', [tombamento]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Bem não encontrado.' });

        const atual = rows[0];
        let mudancas = [];

        if (atual.descricao !== descricao) mudancas.push(`Descrição: "${atual.descricao}" -> "${descricao}"`);
        
        const setorAntigo = atual.setor_atual || 'Não Alocado';
        const setorNovo = setor || 'Não Alocado';
        if (setorAntigo !== setorNovo) mudancas.push(`Setor: "${setorAntigo}" -> "${setorNovo}"`);

        if (atual.estado_conservacao !== estado) mudancas.push(`Estado: "${atual.estado_conservacao}" -> "${estado}"`);

        await pool.execute(
            'UPDATE catalogo_patrimonio SET descricao = ?, setor_atual = ?, estado_conservacao = ? WHERE tombamento = ?',
            [descricao, setor, estado, tombamento]
        );

        if (mudancas.length > 0) {
            await registrarLog(usuarioLogado, 'EDICAO', 'Patrimônio', `Editou o bem [${tombamento}]. Alterações: ${mudancas.join(' | ')}`);
        } else {
            await registrarLog(usuarioLogado, 'EDICAO', 'Patrimônio', `Salvou o bem [${tombamento}] sem realizar alterações.`);
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
    } catch (error) { res.status(500).json({ success: false, message: 'Item com histórico. Utilize o botão de Status para Inativá-lo.' }); }
});

module.exports = router;