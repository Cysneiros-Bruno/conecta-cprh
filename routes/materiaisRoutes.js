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
        // CORREÇÃO: Mapeamento agora inclui o Estoque e o Mínimo (com fallback para 0 caso não existam)
        const valores = itens.map(item => [
            item.codigo, 
            item.categoria, 
            item.descricao, 
            1, // ativo
            item.quantidade_estoque || 0, 
            item.estoque_minimo || 0
        ]);
        
        // CORREÇÃO: Inserção e Atualização agora cobrem as duas colunas numéricas
        const query = `
            INSERT INTO catalogo_materiais (codigo, categoria, descricao, ativo, quantidade_estoque, estoque_minimo) 
            VALUES ? 
            ON DUPLICATE KEY UPDATE 
            categoria = VALUES(categoria),
            descricao = VALUES(descricao), 
            quantidade_estoque = VALUES(quantidade_estoque),
            estoque_minimo = VALUES(estoque_minimo),
            ativo = 1
        `;
        await pool.query(query, [valores]);
        await registrarLog(usuarioLogado, 'INCLUSAO', 'Catálogo', `Importou/Cadastrou ${itens.length} material(is).`);
        res.json({ success: true });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
});

// 4. Editar Material (Com suporte à troca/mesclagem de E-Fisco)
router.put('/editar', verificarToken, async (req, res) => {
    const { codigoAntigo, novoCodigo, novaCategoria, novaDescricao, novoEstoque, novoMinimo, usuarioLogado } = req.body;
    
    try {
        // REGRA DE NEGÓCIO: Se o almoxarife alterar o E-Fisco para um número que já existe,
        // excluímos a "carcaça" do item antigo para transferir a alma e a história dele para o E-Fisco novo.
        if (codigoAntigo !== novoCodigo) {
            await pool.execute('DELETE FROM catalogo_materiais WHERE codigo = ?', [codigoAntigo]);
        }
        
        // Faz o UPSERT poderoso: Se o E-Fisco novo já existir no banco, ele NÃO DA ERRO, 
        // ele apenas atualiza os dados. Se for um E-fisco inédito, ele cria um novo.
        const queryUpdate = `
            INSERT INTO catalogo_materiais (codigo, categoria, descricao, ativo, quantidade_estoque, estoque_minimo) 
            VALUES (?, ?, ?, 1, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            categoria = VALUES(categoria), 
            descricao = VALUES(descricao), 
            quantidade_estoque = VALUES(quantidade_estoque), 
            estoque_minimo = VALUES(estoque_minimo)
        `;
        
        await pool.execute(queryUpdate, [novoCodigo, novaCategoria, novaDescricao, novoEstoque, novoMinimo]);
        
        await registrarLog(usuarioLogado, 'EDICAO', 'Catálogo', `Editou/Sobrescreveu o item. E-Fisco final: ${novoCodigo}`);
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