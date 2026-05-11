// Arquivo: utils/mailer.js
const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER; 
const SMTP_PASS = process.env.SMTP_PASS;          

const transporter = nodemailer.createTransport({
    host: '200.238.112.93', 
    port: 587, 
    secure: false,               
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false }
});

const EMAILS_SETORES = {
    'MANUTENCAO': 'telematica@cprh.pe.gov.br',     
    'PATRIMONIO': 'telematica@cprh.pe.gov.br',     
    'ALMOXARIFADO': 'telematica@cprh.pe.gov.br', 
    'SERVICOS_GERAIS': 'telematica@cprh.pe.gov.br'
};

async function dispararEmailConfirmacao(modulo, protocolo, emailSolicitante, nomeSolicitante, detalhes) {
    const emailSetor = EMAILS_SETORES[modulo];
    const corpoHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #198754; color: white; padding: 20px; text-align: center;">
                <h2>Novo Chamado Registrado</h2>
                <p style="font-size: 1.2rem; margin: 0;">Protocolo: <strong>${protocolo}</strong></p>
            </div>
            <div style="padding: 20px;">
                <p>Olá, <strong>${nomeSolicitante}</strong>.</p>
                <p>Sua solicitação para o setor de <strong>${modulo.replace('_', ' ')}</strong> foi registrada com sucesso.</p>
                <h4 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Resumo da Solicitação:</h4>
                ${detalhes}
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Intranet CPRH" <${SMTP_USER}>`, 
            to: emailSolicitante, cc: emailSetor,                         
            subject: `[Intranet CPRH] Confirmação de Chamado - ${protocolo}`,
            html: corpoHtml
        });
    } catch (error) { console.error(`Falha e-mail ${protocolo}:`, error.message); }
}

async function dispararEmailAlertaEstoque(item) {
    const emailGestor = EMAILS_SETORES['ALMOXARIFADO'];
    const corpoHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #fb8c00; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #fb8c00; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">⚠️ Alerta de Estoque Baixo</h2>
            </div>
            <div style="padding: 20px;">
                <p>O sistema identificou que o item <strong>[${item.codigo}] ${item.descricao}</strong> atingiu o estoque mínimo: <strong>${item.quantidade_estoque} un.</strong></p>
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Intranet CPRH - Alertas" <${SMTP_USER}>`, 
            to: emailGestor,
            subject: `⚠️ [ALERTA ESTOQUE] Item: ${item.codigo} - ${item.descricao}`,
            html: corpoHtml
        });
    } catch (error) {}
}

// Exportando as ferramentas para todo o sistema
module.exports = {
    dispararEmailConfirmacao,
    dispararEmailAlertaEstoque
};