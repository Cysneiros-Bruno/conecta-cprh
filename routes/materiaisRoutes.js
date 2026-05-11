// Arquivo: routes/materiaisRoutes.js
const express = require('express');
const router = express.Router();

const pool = require('../config/database');
const { verificarToken } = require('../config/auth');
const { registrarLog } = require('../utils/logger');

// =======================================================
// ROTAS DO CATÁLOGO DE MATERIAIS (Base: /api/admin/materiais)
// =======================================================

// 1. Buscar todos os materiais
router.get('/', verificarToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT codigo, categoria, descricao, ativo, quantidade_estoque, estoque_minimo FROM catalogo_materiais ORDER BY categoria ASC, descricao ASC');
        res.json(rows);
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
});

// 2. Alterar Status do Material
router.put('/status', verificarToken, async (req, res) => {
    const { codigo, ativo, usuarioLogado } = req.body;
    try {
        await pool.execute('UPDATE catalogo_materiais SET ativo = ? WHERE codigo = ?', [ativo, codigo]);
        const txt = ativo === 1 ? 'Ativou' : 'Inativou';
        await registrarLog(usuarioLogado, 'EDICAO', 'Catálogo', `${txt} o item: ${codigo}`);
        res.json({ success: true });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
});

// 3. Importar em Lote (CSV)
router.post('/importar', verificarToken, async (req, res) => {
    const { itens, usuarioLogado } = req.body;
    if (!itens || itens.length === 0) return res.status(400).json({ success: false, message: 'Nenhum item enviado.' });

    try {
        const valores = itens.map(item => [item.codigo, item.categoria, item.descricao, 1]);
        const query = `
            INSERT INTO catalogo_materiais (codigo, categoria, descricao, ativo) 
            VALUES ? 
            ON DUPLICATE KEY UPDATE 
            categoria = VALUES(categoria),
            descricao = VALUES(descricao), 
            ativo = 1
        `;
        await pool.query(query, [valores]);
        await registrarLog(usuarioLogado, 'INCLUSAO', 'Catálogo', `Importou/Cadastrou ${itens.length} material(is).`);
        res.json({ success: true });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
});

// 4. Editar Material
router.put('/editar', verificarToken, async (req, res) => {
    const { codigo, novaCategoria, novaDescricao, novoEstoque, novoMinimo, usuarioLogado } = req.body;
    try {
        await pool.execute(
            'UPDATE catalogo_materiais SET categoria = ?, descricao = ?, quantidade_estoque = ?, estoque_minimo = ? WHERE codigo = ?', 
            [novaCategoria, novaDescricao, novoEstoque, novoMinimo, codigo]
        );
        await registrarLog(usuarioLogado, 'EDICAO', 'Catálogo', `Editou item ${codigo} (Estoque atualizado para: ${novoEstoque})`);
        res.json({ success: true });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
});

// 5. Excluir Material
router.delete('/:codigo', verificarToken, async (req, res) => {
    const { codigo } = req.params;
    const { usuarioLogado } = req.body;
    try {
        await pool.execute('DELETE FROM catalogo_materiais WHERE codigo = ?', [codigo]);
        await registrarLog(usuarioLogado, 'EXCLUSAO', 'Catálogo', `Excluiu o item ${codigo}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Este item já foi utilizado em um chamado anterior e não pode ser excluído. Em vez de excluir, use o botão de Status para Desligar o item.' });
    }
});

module.exports = router;