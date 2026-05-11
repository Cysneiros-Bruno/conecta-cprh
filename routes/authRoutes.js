// Arquivo: routes/authRoutes.js
const express = require('express');
const router = express.Router();
const ldap = require('ldapjs');
const jwt = require('jsonwebtoken');

// Importações do nosso sistema
const pool = require('../config/database');
const { SECRET_KEY } = require('../config/auth');
const { registrarLog } = require('../utils/logger');

// Configuração do LDAP isolada e protegida
const LDAP_CONFIG = {
    url: 'ldap://10.0.1.8', 
    baseDN: 'dc=cprh,dc=pe,dc=gov,dc=br',
    domainSuffix: '@cprh.pe.gov.br'
};

// =======================================================
// 1. LOGIN DE USUÁRIO COMUM (LDAP)
// =======================================================
router.post('/login-ldap', (req, res) => {
    const { usuario, senha } = req.body;
    if (!usuario || !senha) return res.status(400).json({ success: false, message: 'Credenciais ausentes.' });

    const client = ldap.createClient({ url: LDAP_CONFIG.url, connectTimeout: 5000, timeout: 10000 });
    const userUPN = usuario.includes('@') ? usuario : `${usuario}${LDAP_CONFIG.domainSuffix}`;

    client.bind(userUPN, senha, (err) => {
        if (err) {
            client.unbind((err) => {}); // Função de callback vazia evita crash do Node
            return res.json({ success: false, message: 'Usuário ou senha inválidos.' });
        }

        const opts = { filter: `(sAMAccountName=${usuario})`, scope: 'sub', attributes: ['displayName', 'mail', 'cn', 'givenName', 'sn'] };

        client.search(LDAP_CONFIG.baseDN, opts, (err, searchRes) => {
            if (err) { client.unbind((err)=>{}); return res.json({ success: true, nome: usuario, email: "" }); }

            searchRes.on('searchEntry', (entry) => {
                const attr = entry.attributes.reduce((acc, a) => {
                    acc[a.type] = (a.values && a.values.length > 0) ? a.values[0].toString() : "";
                    return acc;
                }, {});
                const nomeFinal = attr.displayName || attr.cn || (attr.givenName ? `${attr.givenName} ${attr.sn || ''}` : usuario);
                
                client.unbind((err)=>{});
                res.json({ success: true, nome: nomeFinal, email: attr.mail || "" });
            });

            searchRes.on('end', () => { 
                if (!res.headersSent) { client.unbind((err)=>{}); res.json({ success: true, nome: usuario, email: "" }); } 
            });
        });
    });
});

// =======================================================
// 2. LOGIN DO ADMINISTRADOR (MYSQL + JWT)
// =======================================================
router.post('/admin/login', async (req, res) => {
    const { usuario, senha } = req.body;
    try {
        const [rows] = await pool.execute(
            'SELECT id, login AS usuario, perm_visualizar, perm_cadastrar, perm_editar, perm_excluir, perm_manutencao, modulo_acesso FROM usuarios_admin WHERE login = ? AND senha = ? AND ativo = 1',
            [usuario, senha]
        );

        if (rows.length > 0) {
            const admin = rows[0];
            await registrarLog(admin.usuario, 'ACESSO', 'Autenticação', 'Realizou login no Backoffice');
            
            const tokenSessao = jwt.sign(
                { id: admin.id, usuario: admin.usuario, modulo: admin.modulo_acesso }, 
                SECRET_KEY, 
                { expiresIn: '8h' }
            );

            res.json({ 
                success: true, 
                token: tokenSessao,
                admin: admin.usuario,
                modulo_acesso: admin.modulo_acesso || 'TODOS',
                permissoes: { 
                    visualizar: admin.perm_visualizar === 1,
                    cadastrar: admin.perm_cadastrar === 1, 
                    editar: admin.perm_editar === 1, 
                    excluir: admin.perm_excluir === 1,
                    manutencao: admin.perm_manutencao === 1 
                }
            });
        } else {
            res.json({ success: false, message: 'Credenciais inválidas ou conta inativa.' });
        }
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;