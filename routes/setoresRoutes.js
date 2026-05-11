// Arquivo: routes/setoresRoutes.js
const express = require('express');
const router = express.Router(); // O "Mini-Aplicativo" de rotas

// Importamos nossas peças modulares
const pool = require('../config/database');
const { verificarToken } = require('../config/auth');
const { registrarLog } = require('../utils/logger');

// =======================================================
// ROTAS DE SETORES (Todas já protegidas pelo verificarToken)
// =======================================================

// 1. Buscar todos os setores (A rota raiz '/' equivale a '/api/admin/setores')
router.get('/', verificarToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM setores ORDER BY nome ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Criar novo setor
router.post('/', verificarToken, async (req, res) => {
    const { nome, usuarioLogado } = req.body;
    try {
        await pool.execute('INSERT INTO setores (nome, ativo) VALUES (?, 1)', [nome]);
        await registrarLog(usuarioLogado, 'INCLUSAO', 'Setores', `Criou o setor [${nome}]`);
        res.json({ success: true });
    } catch (error) {
        // Trata o erro de setor duplicado (Unique Key no MySQL)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Este setor já existe.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Renomear setor
router.put('/renomear', verificarToken, async (req, res) => {
    const { nomeAntigo, nomeNovo, usuarioLogado } = req.body;
    try {
        await pool.execute('UPDATE setores SET nome = ? WHERE nome = ?', [nomeNovo, nomeAntigo]);
        // Atualiza em cascata nos bens (se não houver trigger no banco)
        await pool.execute('UPDATE catalogo_patrimonio SET setor_atual = ? WHERE setor_atual = ?', [nomeNovo, nomeAntigo]);
        
        await registrarLog(usuarioLogado, 'EDICAO', 'Setores', `Renomeou [${nomeAntigo}] para [${nomeNovo}]`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Alterar Status (Ligar/Desligar)
router.put('/status', verificarToken, async (req, res) => {
    const { nome, ativo, usuarioLogado } = req.body;
    try {
        await pool.execute('UPDATE setores SET ativo = ? WHERE nome = ?', [ativo, nome]);
        const txt = ativo === 1 ? 'Ativou' : 'Inativou';
        await registrarLog(usuarioLogado, 'EDICAO', 'Setores', `${txt} o setor [${nome}]`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. Excluir Setor
router.delete('/:nome', verificarToken, async (req, res) => {
    const { nome } = req.params;
    const { usuarioLogado } = req.body;
    try {
        await pool.execute('DELETE FROM setores WHERE nome = ?', [nome]);
        await registrarLog(usuarioLogado, 'EXCLUSAO', 'Setores', `Excluiu o setor [${nome}]`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Não é possível excluir um setor que possui bens ou chamados vinculados.' });
    }
});

module.exports = router; // Exporta o pacote de rotas