/* =========================================================================
   INTRANET CPRH - SERVER BACKEND (VERSÃO FINAL 100% MODULARIZADA)
   A partir de agora, a manutenção é feita nos arquivos dentro de /routes/
========================================================================= */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middlewares Básicos
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// ==========================================
// IMPORTAÇÃO DE TODAS AS ROTAS DO SISTEMA
// ==========================================
const authRoutes = require('./routes/authRoutes');
const portalRoutes = require('./routes/portalRoutes');
const setoresRoutes = require('./routes/setoresRoutes');
const materiaisRoutes = require('./routes/materiaisRoutes');
const patrimonioRoutes = require('./routes/patrimonioRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const sistemaAdminRoutes = require('./routes/sistemaAdminRoutes');

// ==========================================
// APLICAÇÃO DAS ROTAS (ROTEAMENTO MVC)
// ==========================================

// 1. Rotas Públicas e de Login (Não exigem Token)
app.use('/api', authRoutes);     // Contém: /login-ldap e /admin/login
app.use('/api', portalRoutes);   // Contém todos os chamados e listas públicas

// 2. Rotas do Backoffice (Protegidas pelo verificarToken nas suas raízes)
app.use('/api/admin/setores', setoresRoutes);
app.use('/api/admin/materiais', materiaisRoutes);
app.use('/api/admin/patrimonio', patrimonioRoutes);
app.use('/api/admin/usuarios', usuariosRoutes);
app.use('/api/admin', sistemaAdminRoutes); 

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor CPRH-Intranet Ativo em http://10.0.1.70:${PORT} - 100% MODULARIZADO!`);
});