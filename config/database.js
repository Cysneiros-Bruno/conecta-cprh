// Arquivo: config/database.js
const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS, // Senha blindada
    database: process.env.DB_NAME
};

// Cria o pool de conexões
const pool = mysql.createPool(DB_CONFIG);

console.log('[Banco de Dados] Pool de conexões MySQL inicializado.');

// Exporta o 'pool' para que outros arquivos possam usá-lo
module.exports = pool;