// Arquivo: routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken } = require('../config/auth');
const { registrarLog } = require('../utils/logger');

// Todas as rotas baseiam-se em /api/admin/usuarios
router.get('/', verificarToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, login AS usuario, modulo_acesso, ativo, perm_visualizar, perm_cadastrar, perm_editar, perm_excluir, perm_manutencao FROM usuarios_admin');
        res.json({ success: true, dados: rows });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/', verificarToken, async (req, res) => {
    const { usuario, senha, modulo, usuarioLogado } = req.body;
    try {
        const escopo = modulo || 'TODOS';
        await pool.execute('INSERT INTO usuarios_admin (nome, login, senha, ativo, perm_visualizar, modulo_acesso) VALUES (?, ?, ?, 1, 1, ?)', [usuario, usuario, senha, escopo]);
        await registrarLog(usuarioLogado, 'INCLUSAO', 'Acessos', `Criou gestor: ${usuario}`);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: "Usuário já existe." }); }
});

router.put('/modulo', verificarToken, async (req, res) => {
    const { id, novoModulo, usuarioLogado } = req.body;
    try {
        // 1. Busca quem é o usuário que está sofrendo a alteração
        const [user] = await pool.execute('SELECT login FROM usuarios_admin WHERE id = ?', [id]);
        const loginAfetado = user.length > 0 ? user[0].login : `ID ${id}`;

        await pool.execute('UPDATE usuarios_admin SET modulo_acesso = ? WHERE id = ?', [novoModulo, id]);
        
        // 2. Registra de forma humana
        await registrarLog(usuarioLogado, 'EDICAO', 'Acessos', `Alterou o escopo do usuário [${loginAfetado}] para: ${novoModulo.toUpperCase()}`);
        
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/permissao', verificarToken, async (req, res) => {
    const { idUsuario, colunaPermissao, valor, usuarioLogado } = req.body;
    try {
        // 1. Busca quem é o usuário afetado
        const [user] = await pool.execute('SELECT login FROM usuarios_admin WHERE id = ?', [idUsuario]);
        const loginAfetado = user.length > 0 ? user[0].login : `ID ${idUsuario}`;

        // 2. Dicionário de tradução das colunas do banco para PT-BR
        const dicionarioPermissoes = {
            'perm_visualizar': 'Visualizar Catálogos',
            'perm_cadastrar': 'Cadastrar Itens',
            'perm_editar': 'Editar Registros',
            'perm_excluir': 'Excluir Registros',
            'perm_manutencao': 'Manutenção Avançada (Reset/Acessos)',
            'ativo': 'Acesso Geral ao Painel'
        };

        const nomePermissao = dicionarioPermissoes[colunaPermissao] || colunaPermissao;
        const acao = valor === 1 ? 'Concedeu' : 'Revogou';

        // 3. Executa a atualização
        await pool.execute(`UPDATE usuarios_admin SET ${colunaPermissao} = ? WHERE id = ?`, [valor, idUsuario]);
        
        // 4. Salva o log perfeitamente formatado
        await registrarLog(usuarioLogado, 'EDICAO', 'Acessos', `${acao} a permissão de [${nomePermissao}] para o usuário: ${loginAfetado}`);
        
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/renomear', verificarToken, async (req, res) => {
    const { id, novoNome, usuarioLogado } = req.body;
    try {
        await pool.execute('UPDATE usuarios_admin SET login = ?, nome = ? WHERE id = ?', [novoNome, novoNome, id]);
        await registrarLog(usuarioLogado, 'EDICAO', 'Acessos', `Renomeou admin ID ${id}`);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/senha', verificarToken, async (req, res) => {
    const { id, novaSenha, usuarioLogado } = req.body;
    try {
        await pool.execute('UPDATE usuarios_admin SET senha = ? WHERE id = ?', [novaSenha, id]);
        await registrarLog(usuarioLogado, 'EDICAO', 'Acessos', `Alterou senha ID ${id}`);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.delete('/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { usuarioLogado } = req.body;
    try {
        await pool.execute('DELETE FROM usuarios_admin WHERE id = ?', [id]);
        await registrarLog(usuarioLogado, 'EXCLUSAO', 'Acessos', `Excluiu admin ID ${id}`);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;