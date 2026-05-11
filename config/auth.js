// Arquivo: config/auth.js
const jwt = require('jsonwebtoken');

// A Chave Mestra do seu sistema
const SECRET_KEY = process.env.JWT_SECRET;

// Middleware (A Catraca)
function verificarToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    
    if (!bearerHeader) {
        return res.status(401).json({ success: false, message: 'Acesso Negado: Você precisa estar logado.' });
    }

    const token = bearerHeader.split(' ')[1];

    jwt.verify(token, SECRET_KEY, (err, dadosDecodificados) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Sessão expirada ou token inválido.' });
        }
        
        req.usuarioAutenticado = dadosDecodificados;
        next(); 
    });
}

// Exportamos a chave a função para o resto do sistema
module.exports = {
    SECRET_KEY,
    verificarToken
};