// Arquivo: routes/portalRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { dispararEmailConfirmacao } = require('../utils/mailer');

// ==========================================
// CONSULTAS PÚBLICAS (SELECTS)
// ==========================================

// Lista de Setores Ativos
router.get('/setores', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT nome FROM setores WHERE ativo = 1 ORDER BY nome ASC');
        res.json(rows.map(r => r.nome));
    } catch (error) { res.status(500).json(["Erro"]); }
});

// Lista de Materiais de Almoxarifado
router.get('/materiais', async (req, res) => {
    try {
        const [materiais] = await pool.execute(`SELECT codigo, categoria, descricao, quantidade_estoque FROM catalogo_materiais WHERE ativo = 1 ORDER BY categoria ASC, descricao ASC`);
        res.status(200).json(materiais);
    } catch (error) { res.status(500).json({ success: false }); }
});

// Lista Pública de Bens do Patrimônio (Ativos por Setor)
router.get('/patrimonio/itens', async (req, res) => {
    const { setor } = req.query;
    try {
        let query = 'SELECT tombamento, descricao, setor_atual, estado_conservacao, ativo FROM catalogo_patrimonio WHERE ativo = 1';
        let params = [];
        if (setor && setor !== 'TODOS' && setor !== 'undefined') {
            query += ' AND setor_atual = ?';
            params.push(setor);
        }
        query += ' ORDER BY tombamento ASC';
        const [rows] = await pool.execute(query, params);
        res.json(Array.isArray(rows) ? rows : []);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// ==========================================
// ABERTURA DE CHAMADOS (TRANSAÇÕES 1-N)
// ==========================================

router.post('/manutencao', async (req, res) => {
    const { nome, email, local, itens } = req.body;
    const anoAtual = new Date().getFullYear();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(`SELECT MAX(sequencial) as max_seq FROM chamados_manutencao WHERE ano = ? FOR UPDATE`, [anoAtual]);
        const novoSeq = (rows[0].max_seq || 0) + 1;
        const protocolo = `MANUT-${anoAtual}.${String(novoSeq).padStart(6, '0')}`;

        const [result] = await connection.execute(
            `INSERT INTO chamados_manutencao (protocolo, nome_solicitante, email_solicitante, localizacao, ano, sequencial) VALUES (?, ?, ?, ?, ?, ?)`, 
            [protocolo, nome, email, local, anoAtual, novoSeq]
        );
        
        const idChamado = result.insertId;
        let listaEmail = `<ul>`;
        for (const item of itens) {
            await connection.execute(`INSERT INTO itens_manutencao (id_chamado, tipo_reparo, descricao) VALUES (?, ?, ?)`, [idChamado, item.tipo, item.descricao]);
            listaEmail += `<li><b>${item.tipo}</b>: ${item.descricao}</li>`;
        }
        listaEmail += `</ul>`;

        await connection.commit();
        res.json({ success: true, protocolo });
        dispararEmailConfirmacao('MANUTENCAO', protocolo, email, nome, `<p><strong>Local:</strong> ${local}</p>${listaEmail}`);
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally { connection.release(); }
});

router.post('/almoxarifado', async (req, res) => {
    const { nome, email, unidade, itens } = req.body;
    const anoAtual = new Date().getFullYear();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(`SELECT MAX(sequencial) as max_seq FROM chamados_almoxarifado WHERE ano = ? FOR UPDATE`, [anoAtual]);
        const novoSeq = (rows[0].max_seq || 0) + 1;
        const protocolo = `ALMOX-${anoAtual}.${String(novoSeq).padStart(6, '0')}`;

        const [result] = await connection.execute(
            `INSERT INTO chamados_almoxarifado (protocolo, ano, sequencial, nome_solicitante, email_solicitante, unidade) VALUES (?, ?, ?, ?, ?, ?)`,
            [protocolo, anoAtual, novoSeq, nome, email, unidade]
        );
        
        const idChamado = result.insertId;
        let listaEmail = `<ul>`;
        for (const item of itens) {
	        await connection.execute(`INSERT INTO itens_almoxarifado (id_chamado, codigo, categoria, descricao, quantidade) VALUES (?, ?, ?, ?, ?)`, [idChamado, item.codigo, item.categoria, item.descricao, item.quantidade]);
            listaEmail += `<li>${item.quantidade}x - <b>[${item.codigo}]</b> ${item.descricao}</li>`;
        }
        listaEmail += `</ul>`;

        await connection.commit();
        res.json({ success: true, protocolo });
        dispararEmailConfirmacao('ALMOXARIFADO', protocolo, email, nome, `<p><strong>Unidade:</strong> ${unidade}</p>${listaEmail}`);
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally { connection.release(); }
});

router.post('/patrimonio', async (req, res) => {
    const { solicitante, email, tipo_solicitacao, motivo, origem, destino, itens } = req.body;
    const anoAtual = new Date().getFullYear();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(`SELECT MAX(sequencial) as max_seq FROM chamados_patrimonio WHERE ano = ? FOR UPDATE`, [anoAtual]);
        const novoSeq = (rows[0].max_seq || 0) + 1;
        const protocolo = `PATRI-${anoAtual}.${String(novoSeq).padStart(6, '0')}`;

        const [result] = await connection.execute(
	        `INSERT INTO chamados_patrimonio (protocolo, ano, sequencial, nome_solicitante, email_solicitante, tipo_solicitacao, origem, destino, motivo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	        [protocolo, anoAtual, novoSeq, solicitante, email, tipo_solicitacao, origem, destino, motivo]
	    );

        const idChamado = result.insertId;
        let listaEmail = `<ul>`;
        for (const item of itens) {
            await connection.execute(`INSERT INTO itens_patrimonio (id_chamado, tombamento, descricao_item) VALUES (?, ?, ?)`, [idChamado, item.tombamento, item.descricao]);
            listaEmail += `<li><b>Tomb: ${item.tombamento}</b> - ${item.descricao}</li>`;
        }
        listaEmail += `</ul>`;

        await connection.commit();
        res.json({ success: true, protocolo });
        dispararEmailConfirmacao('PATRIMONIO', protocolo, email, solicitante, `<p><strong>Origem:</strong> ${origem} | <strong>Destino:</strong> ${destino}</p>${listaEmail}`);
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally { connection.release(); }
});

router.post('/servicos-gerais', async (req, res) => {
    const { nome, email, local, itens } = req.body;
    const anoAtual = new Date().getFullYear();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(`SELECT MAX(sequencial) as max_seq FROM chamados_servicos_gerais WHERE ano = ? FOR UPDATE`, [anoAtual]);
        const novoSeq = (rows[0].max_seq || 0) + 1;
        const protocolo = `SERVG-${anoAtual}.${String(novoSeq).padStart(6, '0')}`;

        const [result] = await connection.execute(
            `INSERT INTO chamados_servicos_gerais (protocolo, nome_solicitante, email_solicitante, localizacao, ano, sequencial) VALUES (?, ?, ?, ?, ?, ?)`, 
            [protocolo, nome, email, local, anoAtual, novoSeq]
        );
        
        const idChamado = result.insertId;
        let listaEmail = `<ul>`;
        for (const item of itens) {
            await connection.execute(`INSERT INTO itens_servicos_gerais (id_chamado, categoria, descricao) VALUES (?, ?, ?)`, [idChamado, item.categoria, item.descricao]);
            listaEmail += `<li><b>${item.categoria}</b>: ${item.descricao}</li>`;
        }
        listaEmail += `</ul>`;

        await connection.commit();
        res.json({ success: true, protocolo });
        dispararEmailConfirmacao('SERVICOS_GERAIS', protocolo, email, nome, `<p><strong>Local:</strong> ${local}</p>${listaEmail}`);
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally { connection.release(); }
});

module.exports = router;