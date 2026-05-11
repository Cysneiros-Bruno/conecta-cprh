// Arquivo: utils/logger.js
const pool = require('../config/database');

/**
 * Função global de auditoria para o sistema
 */
async function registrarLog(usuario, acao, modulo, detalhes) {
    try {
        await pool.execute(
            'INSERT INTO logs_auditoria (usuario_admin, acao, modulo, detalhes) VALUES (?, ?, ?, ?)',
            [usuario, acao, modulo, detalhes]
        );
    } catch (error) {
        console.error('Erro Crítico ao registrar log de auditoria:', error);
    }
}

module.exports = { registrarLog };